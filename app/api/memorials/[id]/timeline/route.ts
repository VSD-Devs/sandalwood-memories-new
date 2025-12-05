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

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params

    const sql = getSql()
    if (!sql) {
      return NextResponse.json([])
    }

    const rows = await sql`
      SELECT id, memorial_id, title, description, event_date, category, media_id, created_at
      FROM timeline_events
      WHERE memorial_id = ${id}
      ORDER BY event_date ASC NULLS LAST, created_at ASC
    `

    return NextResponse.json(rows || [])
  } catch (err) {
    console.error("Fetch timeline events error:", err)
    return NextResponse.json({ error: "Failed to fetch timeline events" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const { title, description = null, event_date = null, category = "milestone", media_id = null } = body || {}

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

    const sql = getSql()
    if (!sql) {
      // No DB available in this environment
      return NextResponse.json({ id: crypto.randomUUID(), memorial_id: id, title, description, event_date, category, media_id })
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
    const inserted = await sql`
      INSERT INTO timeline_events (memorial_id, title, description, event_date, category, media_id)
      VALUES (${id}, ${title}, ${description}, ${normalizedDate}, ${category}, ${normalizedMediaId})
      RETURNING id, memorial_id, title, description, event_date, category, media_id, created_at
    `

    const newEvent = inserted?.[0]
    if (!newEvent) {
      return NextResponse.json({ error: "Failed to create timeline event" }, { status: 500 })
    }

    return NextResponse.json(newEvent)
  } catch (err) {
    console.error("Create timeline event error:", err)
    return NextResponse.json({ error: "Failed to create timeline event" }, { status: 500 })
  }
}


