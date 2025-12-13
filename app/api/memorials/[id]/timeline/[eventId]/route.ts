import { NextResponse, type NextRequest } from "next/server"
import { supabase } from "@/lib/database"
import { getAuthenticatedUser } from "@/lib/auth-helpers"
import { getMemorialAccess } from "@/lib/memorial-access"

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string; eventId: string }> }) {
  try {
    const { id, eventId } = await context.params
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
    if (String(eventId).startsWith("boundary-")) {
      return NextResponse.json({ error: "Cannot edit boundary events" }, { status: 400 })
    }
    const body = await request.json()
    const {
      title,
      description = null,
      event_date = null,
      category = null,
      media_id = null,
      gallery_media_ids = undefined,
    } = body || {}
    
    // Validate required fields for update
    if (event_date !== null && !event_date) {
      return NextResponse.json({ error: "event_date is required" }, { status: 400 })
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
    const normalizedMediaId = media_id && String(media_id).trim() !== "" ? media_id : null

    const normalizedGallery =
      gallery_media_ids === undefined
        ? undefined
        : Array.isArray(gallery_media_ids)
          ? Array.from(
              new Set(
                gallery_media_ids
                  .map((id: unknown) => (typeof id === "string" ? id.trim() : ""))
                  .filter((id) => id),
              ),
            )
          : []

    const updates: Record<string, any> = {
      title,
      description,
      event_date: normalizedDate,
      category,
      media_id: normalizedMediaId,
    }

    if (normalizedGallery !== undefined) {
      updates.gallery_media_ids = normalizedGallery
    }

    const { error } = await supabase.from("timeline_events").update(updates).eq("id", eventId).eq("memorial_id", id)

    if (error) {
      console.error("Update timeline event error:", error)
      return NextResponse.json({ error: "Failed to update timeline event" }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Update timeline event error:", err)
    return NextResponse.json({ error: "Failed to update timeline event" }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string; eventId: string }> }) {
  try {
    const { id, eventId } = await context.params
    const user = await getAuthenticatedUser(_request)

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
    if (String(eventId).startsWith("boundary-")) {
      return NextResponse.json({ error: "Cannot delete boundary events" }, { status: 400 })
    }
    const { error } = await supabase.from("timeline_events").delete().eq("id", eventId).eq("memorial_id", id)
    if (error) {
      console.error("Delete timeline event error:", error)
      return NextResponse.json({ error: "Failed to delete timeline event" }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Delete timeline event error:", err)
    return NextResponse.json({ error: "Failed to delete timeline event" }, { status: 500 })
  }
}


