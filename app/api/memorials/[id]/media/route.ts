import { NextResponse, type NextRequest } from "next/server"
import { neon } from "@neondatabase/serverless"
import { updateMemorialUsage } from "@/lib/usage-limits"

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

async function getMemorialMediaCounts(memorialId: string) {
  const sql = getSql()
  if (!sql) return { photo_count: 0, video_count: 0, media_count: 0 }

  const result = await sql`
    SELECT 
      COUNT(*) FILTER (WHERE file_type = 'image') as photo_count,
      COUNT(*) FILTER (WHERE file_type = 'video') as video_count,
      COUNT(*) as media_count
    FROM media 
    WHERE memorial_id = ${memorialId}
  `
  
  return {
    photo_count: Number(result[0]?.photo_count || 0),
    video_count: Number(result[0]?.video_count || 0),
    media_count: Number(result[0]?.media_count || 0)
  }
}

async function getMemorialOwner(memorialId: string): Promise<string | null> {
  const sql = getSql()
  if (!sql) return null

  const result = await sql`
    SELECT created_by
    FROM memorials 
    WHERE id = ${memorialId}
  `
  
  return result[0]?.created_by || null
}

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const sql = getSql()
    if (!sql) {
      return NextResponse.json([])
    }
    const rows = await sql`
      SELECT id, memorial_id, file_url, file_type, title, description, uploaded_by, created_at
      FROM media
      WHERE memorial_id = ${id}
      ORDER BY created_at DESC
    `
    return NextResponse.json(rows || [])
  } catch (err) {
    console.error("Fetch media error:", err)
    return NextResponse.json({ error: "Failed to fetch media" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
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

    // Basic validation: accept only images for now when URL is a data URL
    const sanitized = items.map((it) => ({
      file_url: String(it.file_url || "").trim(),
      file_type: it.file_type === "video" ? "video" : it.file_type === "document" ? "document" : "image",
      title: it.title && String(it.title).trim() !== "" ? String(it.title) : null,
      description: it.description && String(it.description).trim() !== "" ? String(it.description) : null,
      uploaded_by: it.uploaded_by && String(it.uploaded_by).trim() !== "" ? String(it.uploaded_by) : null,
    }))

    const sql = getSql()
    if (!sql) {
      // No DB: return echo objects with generated IDs to support local/dev
      const now = new Date().toISOString()
      const echo = sanitized.map((it) => ({
        id: crypto.randomUUID(),
        memorial_id: id,
        file_url: it.file_url,
        file_type: it.file_type,
        title: it.title,
        description: it.description,
        uploaded_by: it.uploaded_by || null,
        created_at: now,
      }))
      return NextResponse.json({ items: echo })
    }

    const inserted = await Promise.all(
      sanitized.map(async (it) => {
        const rows = await sql`
          INSERT INTO media (memorial_id, file_url, file_type, title, description, uploaded_by)
          VALUES (${id}, ${it.file_url}, ${it.file_type}, ${it.title}, ${it.description}, ${it.uploaded_by})
          RETURNING id, memorial_id, file_url, file_type, title, description, uploaded_by, created_at
        `
        return rows?.[0]
      })
    )

    const validInserted = inserted.filter(Boolean)
    
    // Update memorial usage statistics after successful media insertion
    if (validInserted.length > 0) {
      try {
        const memorialOwner = await getMemorialOwner(id)
        if (memorialOwner) {
          const mediaCounts = await getMemorialMediaCounts(id)
          await updateMemorialUsage(memorialOwner, Number(id), {
            mediaCount: mediaCounts.media_count,
            photoCount: mediaCounts.photo_count,
            videoCount: mediaCounts.video_count
          })
        }
      } catch (error) {
        console.error("Failed to update memorial usage statistics:", error)
        // Don't fail the media upload if usage update fails
      }
    }

    return NextResponse.json({ items: validInserted })
  } catch (err) {
    console.error("Create media error:", err)
    return NextResponse.json({ error: "Failed to create media" }, { status: 500 })
  }
}


