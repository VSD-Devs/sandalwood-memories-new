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

export interface Memorial {
  id: string
  title: string
  full_name: string
  slug: string
  birth_date: string | null
  death_date: string | null
  biography: string | null
  cover_image_url: string | null
  profile_image_url: string | null
  created_by: string
  created_at: string
  updated_at: string
  is_public: boolean
  status: "active" | "pending" | "archived"
  is_alive?: boolean
  burial_location?: string | null
}

export interface User {
  id: string
  email: string
  name: string
  created_at: string
  updated_at: string
}

export interface Tribute {
  id: string
  memorial_id: string
  author_name: string
  author_email: string | null
  message: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
}

export interface Media {
  id: string
  memorial_id: string
  file_url: string
  file_type: "image" | "video" | "document"
  title: string | null
  description: string | null
  uploaded_by: string
  created_at: string
}

// Memorial operations
export async function getMemorials(limit = 50, offset = 0) {
  try {
    const result = await getSql()`
      SELECT m.*, u.name as creator_name, u.email as creator_email
      FROM memorials m
      LEFT JOIN users u ON m.created_by = u.id
      ORDER BY m.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `
    return result as (Memorial & { creator_name: string; creator_email: string })[]
  } catch (error) {
    console.warn('Database not available, returning empty array:', error)
    return []
  }
}

export async function getMemorialById(id: string) {
  try {
    const result = await getSql()`
      SELECT m.*, u.name as creator_name, u.email as creator_email
      FROM memorials m
      LEFT JOIN users u ON m.created_by = u.id
      WHERE m.id = ${id}
    `
    return result[0] as (Memorial & { creator_name: string; creator_email: string }) | undefined
  } catch (error) {
    console.warn('Database not available:', error)
    return undefined
  }
}

export async function getMemorialBySlug(slug: string) {
  try {
    const result = await getSql()`
      SELECT m.*, u.name as creator_name, u.email as creator_email
      FROM memorials m
      LEFT JOIN users u ON m.created_by = u.id
      WHERE m.slug = ${slug}
    `
    return result[0] as (Memorial & { creator_name: string; creator_email: string }) | undefined
  } catch (error) {
    // If slug column doesn't exist yet, return undefined
    console.error('Error in getMemorialBySlug:', error)
    return undefined
  }
}

export async function checkSlugExists(slug: string, excludeId?: string) {
  const sql = getSql()
  let result
  
  if (excludeId) {
    result = await sql`
      SELECT COUNT(*) as count FROM memorials 
      WHERE slug = ${slug} AND id != ${excludeId}
    `
  } else {
    result = await sql`
      SELECT COUNT(*) as count FROM memorials 
      WHERE slug = ${slug}
    `
  }
  
  return parseInt(result[0]?.count || '0') > 0
}

export async function updateMemorialStatus(id: string, status: "active" | "pending" | "archived") {
  await getSql()`
    UPDATE memorials 
    SET status = ${status}, updated_at = NOW()
    WHERE id = ${id}
  `
}

export async function deleteMemorial(id: string) {
  await getSql()`DELETE FROM memorials WHERE id = ${id}`
}

// User operations
export async function getUsers(limit = 50, offset = 0) {
  const result = await getSql()`
    SELECT * FROM neon_auth.users_sync
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `
  return result as User[]
}

// Tribute operations
export async function getTributes(limit = 50, offset = 0) {
  const result = await getSql()`
    SELECT t.*, m.title as memorial_title, m.full_name
    FROM tributes t
    LEFT JOIN memorials m ON t.memorial_id = m.id
    ORDER BY t.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `
  return result as (Tribute & { memorial_title: string; full_name: string })[]
}

export async function approveTribute(id: string) {
  await getSql()`
    UPDATE tributes 
    SET status = 'approved', updated_at = NOW()
    WHERE id = ${id}
  `
}

export async function rejectTribute(id: string) {
  await getSql()`
    UPDATE tributes 
    SET status = 'rejected', updated_at = NOW()
    WHERE id = ${id}
  `
}

export async function deleteTribute(id: string) {
  await getSql()`DELETE FROM tributes WHERE id = ${id}`
}

// Statistics
export async function getDashboardStats() {
  const sql = getSql()
  const [memorialStats, userStats, tributeStats] = await Promise.all([
    sql`SELECT COUNT(*) as total, status FROM memorials GROUP BY status`,
    sql`SELECT COUNT(*) as total FROM neon_auth.users_sync`,
    sql`SELECT COUNT(*) as total, status FROM tributes GROUP BY status`,
  ])

  return {
    memorials: memorialStats.reduce(
      (acc: any, row: any) => {
        acc[row.status] = Number.parseInt(row.total)
        return acc
      },
      { active: 0, pending: 0, archived: 0 },
    ),
    users: Number.parseInt(userStats[0]?.total || "0"),
    tributes: tributeStats.reduce(
      (acc: any, row: any) => {
        acc[row.status] = Number.parseInt(row.total)
        return acc
      },
      { approved: 0, pending: 0, rejected: 0 },
    ),
  }
}
