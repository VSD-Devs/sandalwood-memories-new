import { NextResponse, type NextRequest } from "next/server"
import { supabase } from "@/lib/database"
import { updateMemorialUsage, checkUsageLimits } from "@/lib/usage-limits"
import { getAuthenticatedUser } from "@/lib/auth-helpers"
import { getMemorialAccess } from "@/lib/memorial-access"

async function getMemorialMediaCounts(memorialId: string) {
  const [{ count: media_count = 0, error: mediaError }, { count: photo_count = 0, error: photoError }, { count: video_count = 0, error: videoError }] =
    await Promise.all([
      supabase.from("media").select("id", { count: "exact", head: true }).eq("memorial_id", memorialId),
      supabase
        .from("media")
        .select("id", { count: "exact", head: true })
        .eq("memorial_id", memorialId)
        .eq("file_type", "image"),
      supabase
        .from("media")
        .select("id", { count: "exact", head: true })
        .eq("memorial_id", memorialId)
        .eq("file_type", "video"),
    ])

  if (mediaError || photoError || videoError) {
    console.error("Failed to count memorial media:", mediaError || photoError || videoError)
  }

  return { photo_count: photo_count || 0, video_count: video_count || 0, media_count: media_count || 0 }
}

async function getMemorialOwner(memorialId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("memorials")
    .select("created_by")
    .eq("id", memorialId)
    .maybeSingle()

  if (error) {
    console.error("Failed to fetch memorial owner:", error)
    return null
  }

  return data?.created_by || null
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const user = await getAuthenticatedUser(request)
    const access = await getMemorialAccess(id, user?.id)

    if (!access) {
      return NextResponse.json({ error: "Memorial not found" }, { status: 404 })
    }

    if (!access.canView) {
      return NextResponse.json({ error: "This memorial is private", requiresAccess: true, requestStatus: access.requestStatus }, { status: 403 })
    }
    const { data, error } = await supabase
      .from("media")
      .select("id, memorial_id, file_url, file_type, title, description, uploaded_by, created_at")
      .eq("memorial_id", id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Fetch media error:", error)
      return NextResponse.json({ error: "Failed to fetch media" }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (err) {
    console.error("Fetch media error:", err)
    return NextResponse.json({ error: "Failed to fetch media" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const access = await getMemorialAccess(id, user.id)
    if (!access) {
      return NextResponse.json({ error: "Memorial not found" }, { status: 404 })
    }

    if (!access.isOwner && !access.isCollaborator) {
      return NextResponse.json({ error: "You do not have permission to add media" }, { status: 403 })
    }
    const body = await request.json()
    const items: Array<{
      file_url: string
      file_type: "image" | "video" | "document"
      title?: string | null
      description?: string | null
      uploaded_by?: string | null
    }> = Array.isArray(body?.items) ? body.items : body?.item ? [body.item] : []

    if (!items.length) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 })
    }

    // Server-side usage limit validation
    const photoCount = items.filter(item => item.file_type === "image").length
    const videoCount = items.filter(item => item.file_type === "video").length

    // Create mock File objects for the usage check with estimated sizes
    const mockFiles = [
      ...Array(photoCount).fill(null).map(() => ({ type: "image/jpeg", size: 2 * 1024 * 1024 } as File)), // 2MB average for images
      ...Array(videoCount).fill(null).map(() => ({ type: "video/mp4", size: 50 * 1024 * 1024 } as File)) // 50MB average for videos
    ]

    const limitCheck = await checkUsageLimits(user.id, "upload_media", {
      files: mockFiles,
      memorialId: id,
    })

    if (!limitCheck.allowed) {
      return NextResponse.json({
        error: limitCheck.message || "Usage limit exceeded",
        upgradeRequired: limitCheck.upgradeRequired
      }, { status: 403 })
    }

    // Basic validation: accept only images for now when URL is a data URL
    const sanitized = items.map((it) => ({
      file_url: String(it.file_url || "").trim(),
      file_type: it.file_type === "video" ? "video" : it.file_type === "document" ? "document" : "image",
      title: it.title && String(it.title).trim() !== "" ? String(it.title) : null,
      description: it.description && String(it.description).trim() !== "" ? String(it.description) : null,
      uploaded_by: it.uploaded_by && String(it.uploaded_by).trim() !== "" ? String(it.uploaded_by) : null,
    }))

    const { data, error } = await supabase
      .from("media")
      .insert(
        sanitized.map((it) => ({
          memorial_id: id,
          file_url: it.file_url,
          file_type: it.file_type,
          title: it.title,
          description: it.description,
          uploaded_by: it.uploaded_by || null,
        })),
      )
      .select()

    if (error) {
      console.error("Create media error:", error)
      return NextResponse.json({ error: "Failed to create media" }, { status: 500 })
    }

    const validInserted = data || []

    // Update memorial usage statistics after successful media insertion
    if (validInserted.length > 0) {
      try {
        const memorialOwner = await getMemorialOwner(id)
        if (memorialOwner) {
          // Always recalculate from scratch to ensure accuracy
          const mediaCounts = await getMemorialMediaCounts(id)
          await updateMemorialUsage(memorialOwner, id, {
            mediaCount: mediaCounts.media_count,
            photoCount: mediaCounts.photo_count,
            videoCount: mediaCounts.video_count,
          })
        }
      } catch (error) {
        console.error("Failed to update memorial usage statistics:", error)
        // Log the error but don't fail the upload - this prevents the paywall issue
        // from breaking legitimate uploads
      }
    }

    return NextResponse.json({ items: validInserted })
  } catch (err) {
    console.error("Create media error:", err)
    return NextResponse.json({ error: "Failed to create media" }, { status: 500 })
  }
}


