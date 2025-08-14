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
  throw new Error("DATABASE_URL is not set")
}

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params

    if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL && !process.env.DATABASE_URL_UNPOOLED) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 })
    }

    const sql = getSql()
    const rows = await sql`
      SELECT id, title, full_name, birth_date, death_date, biography, profile_image_url, cover_image_url, created_by, created_at, updated_at, is_public, status
      FROM memorials
      WHERE id = ${id}
    `

    const memorial = rows?.[0]
    if (!memorial) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json(memorial)
  } catch (err) {
    console.error("Fetch memorial error:", err)
    return NextResponse.json({ error: "Failed to fetch memorial" }, { status: 500 })
  }
}


