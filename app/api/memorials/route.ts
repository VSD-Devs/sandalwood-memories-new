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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      full_name,
      title,
      birth_date = null,
      death_date = null,
      biography = null,
      theme = "classic",
      profile_image_url = null,
      cover_image_url = null,
      created_by = "anonymous",
      is_alive = false,
    } = body || {}

    if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL && !process.env.DATABASE_URL_UNPOOLED) {
      // Fallback: generate a client-only ID and return it so the UI can navigate
      return NextResponse.json({ id: crypto.randomUUID(), full_name, title, birth_date, death_date, biography, theme, is_alive })
    }

    if (!full_name || !title) {
      return NextResponse.json({ error: "full_name and title are required" }, { status: 400 })
    }

    const sql = getSql()
    let createdByValue: string | null = null
    try {
      // Only use created_by if it exists in neon_auth.users_sync; otherwise default to null to avoid FK errors
      if (created_by && created_by !== "anonymous") {
        const exists = await sql`SELECT 1 FROM neon_auth.users_sync WHERE id = ${created_by} LIMIT 1`
        createdByValue = exists && exists.length > 0 ? created_by : null
      }
    } catch {
      // If the auth schema/table is unavailable, fall back to null
      createdByValue = null
    }
    // Ensure new column exists (safe if already present)
    try {
      await sql`ALTER TABLE memorials ADD COLUMN IF NOT EXISTS is_alive boolean DEFAULT false` 
    } catch {}

    let result
    try {
      result = await sql`
        INSERT INTO memorials (
          full_name, title, birth_date, death_date, biography, created_by, profile_image_url, cover_image_url, is_alive
        )
        VALUES (
          ${full_name}, ${title}, ${birth_date}, ${death_date}, ${biography}, ${createdByValue}, ${profile_image_url}, ${cover_image_url}, ${is_alive}
        )
        RETURNING id
      `
    } catch (e: any) {
      // Fallback for older schemas without is_alive
      result = await sql`
        INSERT INTO memorials (
          full_name, title, birth_date, death_date, biography, created_by, profile_image_url, cover_image_url
        )
        VALUES (
          ${full_name}, ${title}, ${birth_date}, ${death_date}, ${biography}, ${createdByValue}, ${profile_image_url}, ${cover_image_url}
        )
        RETURNING id
      `
    }

    const id = result?.[0]?.id || crypto.randomUUID()
    return NextResponse.json({ id })
  } catch (err) {
    console.error("Create memorial error:", err)
    const details = (err as any)?.message || String(err)
    return NextResponse.json({ error: "Failed to create memorial", details }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const createdBy = searchParams.get("created_by")
    const limitParam = searchParams.get("limit")
    const limit = Math.min(Number(limitParam || "50"), 100)

    if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL && !process.env.DATABASE_URL_UNPOOLED) {
      return NextResponse.json([])
    }

    const sql = getSql()
    let result
    if (createdBy) {
      result = await sql`
        SELECT m.*, u.name as creator_name, u.email as creator_email
        FROM memorials m
        LEFT JOIN neon_auth.users_sync u ON m.created_by = u.id
        WHERE m.created_by = ${createdBy}
        ORDER BY m.created_at DESC
        LIMIT ${limit}
      `
    } else {
      result = await sql`
        SELECT m.*, u.name as creator_name, u.email as creator_email
        FROM memorials m
        LEFT JOIN neon_auth.users_sync u ON m.created_by = u.id
        ORDER BY m.created_at DESC
        LIMIT ${limit}
      `
    }
    return NextResponse.json(result || [])
  } catch (err) {
    console.error("List memorials error:", err)
    const details = (err as any)?.message || String(err)
    return NextResponse.json({ error: "Failed to list memorials", details }, { status: 500 })
  }
}


