import { NextResponse, type NextRequest } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getAuthenticatedUser } from "@/lib/auth-helpers"

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

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params

    if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL && !process.env.DATABASE_URL_UNPOOLED) {
      // Fallback for development - return a mock memorial
      return NextResponse.json({
        id,
        full_name: "Sample Memorial",
        title: "Beloved Family Member",
        birth_date: "1950-01-01",
        death_date: "2020-01-01",
        biography: "A wonderful person who will be deeply missed.",
        theme: "classic",
        created_at: new Date().toISOString(),
        is_alive: false,
        burial_location: null,
        profile_image_url: null,
        cover_image_url: null,
      })
    }

    const sql = getSql()
    const user = await getAuthenticatedUser(request)

    // Get the memorial - check if it's public or if user has access
    const result = await sql`
      SELECT 
        m.*,
        u.name as creator_name, 
        u.email as creator_email
      FROM memorials m
      LEFT JOIN users u ON m.created_by = u.id
      WHERE m.id = ${id}
      LIMIT 1
    `

    if (!result || result.length === 0) {
      return NextResponse.json({ error: "Memorial not found" }, { status: 404 })
    }

    const memorial = result[0]

    // Check access permissions
    const isOwner = user && (
      String(memorial.created_by) === String(user.id) ||
      String(memorial.owner_user_id) === String(user.id)
    )

    // For now, allow public access to all memorials
    // Later we can add privacy controls here
    const canAccess = true // memorial.is_public || isOwner || (user && memorial.allow_public_access)

    if (!canAccess) {
      return NextResponse.json({ error: "Memorial not found" }, { status: 404 })
    }

    // Return the memorial data
    return NextResponse.json({
      ...memorial,
      // Add computed fields
      isOwner: Boolean(isOwner),
      canEdit: Boolean(isOwner),
    })

  } catch (err) {
    console.error("Get memorial error:", err)
    const details = (err as any)?.message || String(err)
    return NextResponse.json({ error: "Failed to fetch memorial", details }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const user = await getAuthenticatedUser(request)
    
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL && !process.env.DATABASE_URL_UNPOOLED) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 })
    }

    const body = await request.json()
    const {
      full_name,
      title,
      birth_date,
      death_date,
      biography,
      theme,
      profile_image_url,
      cover_image_url,
      is_alive,
      burial_location,
    } = body

    const sql = getSql()

    // Check if user owns this memorial
    const memorialCheck = await sql`
      SELECT created_by, owner_user_id 
      FROM memorials 
      WHERE id = ${id}
      LIMIT 1
    `

    if (!memorialCheck || memorialCheck.length === 0) {
      return NextResponse.json({ error: "Memorial not found" }, { status: 404 })
    }

    const memorial = memorialCheck[0]
    const isOwner = (
      String(memorial.created_by) === String(user.id) ||
      String(memorial.owner_user_id) === String(user.id)
    )

    if (!isOwner) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 })
    }

    // Update the memorial
    const result = await sql`
      UPDATE memorials 
      SET 
        full_name = COALESCE(${full_name}, full_name),
        title = COALESCE(${title}, title),
        birth_date = COALESCE(${birth_date}, birth_date),
        death_date = COALESCE(${death_date}, death_date),
        biography = COALESCE(${biography}, biography),
        theme = COALESCE(${theme}, theme),
        profile_image_url = COALESCE(${profile_image_url}, profile_image_url),
        cover_image_url = COALESCE(${cover_image_url}, cover_image_url),
        is_alive = COALESCE(${is_alive}, is_alive),
        burial_location = COALESCE(${burial_location}, burial_location),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    return NextResponse.json(result[0])

  } catch (err) {
    console.error("Update memorial error:", err)
    const details = (err as any)?.message || String(err)
    return NextResponse.json({ error: "Failed to update memorial", details }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const user = await getAuthenticatedUser(request)
    
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL && !process.env.DATABASE_URL_UNPOOLED) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 })
    }

    const sql = getSql()

    // Check if user owns this memorial
    const memorialCheck = await sql`
      SELECT created_by, owner_user_id 
      FROM memorials 
      WHERE id = ${id}
      LIMIT 1
    `

    if (!memorialCheck || memorialCheck.length === 0) {
      return NextResponse.json({ error: "Memorial not found" }, { status: 404 })
    }

    const memorial = memorialCheck[0]
    const isOwner = (
      String(memorial.created_by) === String(user.id) ||
      String(memorial.owner_user_id) === String(user.id)
    )

    if (!isOwner) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 })
    }

    // Update constraint if needed (safe if already updated)
    try {
      await sql`ALTER TABLE memorials DROP CONSTRAINT IF EXISTS memorials_status_check`
      await sql`ALTER TABLE memorials ADD CONSTRAINT memorials_status_check CHECK (status IN ('active', 'pending', 'archived', 'deleted'))`
    } catch (e) {
      // Constraint might already exist, continue
    }

    // For safety, just mark as deleted rather than actually deleting
    await sql`
      UPDATE memorials 
      SET status = 'deleted', updated_at = NOW()
      WHERE id = ${id}
    `

    return NextResponse.json({ message: "Memorial deleted successfully" })

  } catch (err) {
    console.error("Delete memorial error:", err)
    const details = (err as any)?.message || String(err)
    return NextResponse.json({ error: "Failed to delete memorial", details }, { status: 500 })
  }
}
