import { NextResponse, type NextRequest } from "next/server"
import { neon } from "@neondatabase/serverless"

function getSql() {
  const rawCandidates = [process.env.DATABASE_URL, process.env.POSTGRES_URL, process.env.DATABASE_URL_UNPOOLED]
  const candidates = rawCandidates
    .filter((v) => typeof v === "string" && v.trim().length > 0)
    .map((v) => v!.trim().replace(/^postgres:\/\//, "postgresql://"))
  for (const url of candidates) {
    try {
      return neon(url)
    } catch {}
  }
  return null
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string; eventId: string }> }) {
  try {
    const { id, eventId } = await context.params
    if (String(eventId).startsWith("boundary-")) {
      return NextResponse.json({ error: "Cannot edit boundary events" }, { status: 400 })
    }
    const sql = getSql()
    if (!sql) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 })
    }
    const body = await request.json()
    const { title, description = null, event_date = null, category = null, media_id = null } = body || {}
    
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

    await sql`
      UPDATE timeline_events
      SET
        title = COALESCE(${title}, title),
        description = ${description},
        event_date = ${normalizedDate},
        category = COALESCE(${category}, category),
        media_id = ${normalizedMediaId}
      WHERE id = ${eventId} AND memorial_id = ${id}
    `

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Update timeline event error:", err)
    return NextResponse.json({ error: "Failed to update timeline event" }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string; eventId: string }> }) {
  try {
    const { id, eventId } = await context.params
    if (String(eventId).startsWith("boundary-")) {
      return NextResponse.json({ error: "Cannot delete boundary events" }, { status: 400 })
    }
    const sql = getSql()
    if (!sql) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 })
    }
    await sql`DELETE FROM timeline_events WHERE id = ${eventId} AND memorial_id = ${id}`
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Delete timeline event error:", err)
    return NextResponse.json({ error: "Failed to delete timeline event" }, { status: 500 })
  }
}


