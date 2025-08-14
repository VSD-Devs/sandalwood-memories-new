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
      SELECT id, memorial_id, title, description, event_date, category, image_url, created_at
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
    const { title, description = null, event_date = null, category = "milestone", image_url = null } = body || {}

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 })
    }

    const sql = getSql()
    if (!sql) {
      // No DB available in this environment
      return NextResponse.json({ id: crypto.randomUUID(), memorial_id: id, title, description, event_date, category, image_url })
    }

    // Coerce empty strings to nulls for date/optional fields
    const normalizedDate = event_date && String(event_date).trim() !== "" ? event_date : null
    const normalizedImage = image_url && String(image_url).trim() !== "" ? image_url : null
    const inserted = await sql`
      INSERT INTO timeline_events (memorial_id, title, description, event_date, category, image_url)
      VALUES (${id}, ${title}, ${description}, ${normalizedDate}, ${category}, ${normalizedImage})
      RETURNING id
    `

    return NextResponse.json({ id: inserted?.[0]?.id })
  } catch (err) {
    console.error("Create timeline event error:", err)
    return NextResponse.json({ error: "Failed to create timeline event" }, { status: 500 })
  }
}


