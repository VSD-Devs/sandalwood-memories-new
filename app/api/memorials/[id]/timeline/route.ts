import { NextResponse, type NextRequest } from "next/server"
import { supabase } from "@/lib/database"
import { getAuthenticatedUser } from "@/lib/auth-helpers"
import { getMemorialAccess } from "@/lib/memorial-access"

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params

    const user = await getAuthenticatedUser(request)
    const access = await getMemorialAccess(id, user?.id)

    if (!access) {
      return NextResponse.json({ error: "Memorial not found" }, { status: 404 })
    }

    if (!access.canView) {
      return NextResponse.json({ error: "This memorial is private", requestStatus: access.requestStatus, requiresAccess: true }, { status: 403 })
    }

    const { data, error } = await supabase
      .from("timeline_events")
      .select("id, memorial_id, title, description, event_date, category, media_id, gallery_media_ids, created_at")
      .eq("memorial_id", id)
      .order("event_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Fetch timeline events error:", error)
      return NextResponse.json({ error: "Failed to fetch timeline events" }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (err) {
    console.error("Fetch timeline events error:", err)
    return NextResponse.json({ error: "Failed to fetch timeline events" }, { status: 500 })
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
      return NextResponse.json({ error: "You do not have permission to update this memorial" }, { status: 403 })
    }
    const body = await request.json()
    const {
      title,
      description = null,
      event_date = null,
      category = "milestone",
      media_id = null,
      gallery_media_ids = [],
    } = body || {}

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 })
    }

    if (!event_date) {
      return NextResponse.json({ error: "event_date is required" }, { status: 400 })
    }

    // Validate category
    const validCategories = ["milestone", "achievement", "memory", "celebration"]
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: "Invalid category. Must be one of: milestone, achievement, memory, celebration" }, { status: 400 })
    }

    // Handle different date formats
    let normalizedDate = null
    if (event_date && String(event_date).trim() !== "") {
      const dateStr = String(event_date).trim()
      
      // Handle YYYY-MM format (month input) - convert to first day of month
      if (dateStr.match(/^\d{4}-\d{2}$/)) {
        normalizedDate = `${dateStr}-01`
      } 
      // Handle full date format
      else if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        normalizedDate = dateStr
      }
      // Try to parse other formats
      else {
        const parsedDate = new Date(dateStr)
        if (!isNaN(parsedDate.getTime())) {
          normalizedDate = parsedDate.toISOString().split('T')[0]
        }
      }
    }
    
    if (!normalizedDate) {
      return NextResponse.json({ error: "Invalid event_date format. Expected YYYY-MM or YYYY-MM-DD" }, { status: 400 })
    }
    const normalizedMediaId = media_id && String(media_id).trim() !== "" ? media_id : null

    // Optional gallery: keep unique string IDs, drop empties
    const normalizedGallery: string[] = Array.isArray(gallery_media_ids)
      ? Array.from(
          new Set(
            gallery_media_ids
              .map((id: unknown) => (typeof id === "string" ? id.trim() : ""))
              .filter((id) => id),
          ),
        )
      : []
    const { data, error } = await supabase
      .from("timeline_events")
      .insert({
        memorial_id: id,
        title,
        description,
        event_date: normalizedDate,
        category,
        media_id: normalizedMediaId,
        gallery_media_ids: normalizedGallery,
      })
      .select()
      .maybeSingle()

    if (error || !data) {
      console.error("Create timeline event error:", error)
      return NextResponse.json({ error: "Failed to create timeline event" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("Create timeline event error:", err)
    return NextResponse.json({ error: "Failed to create timeline event" }, { status: 500 })
  }
}


