import { neon } from "@neondatabase/serverless"
import { getSessionCookieName, getUserBySessionToken } from "./auth"

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

export interface Tribute {
  id: string
  memorial_id: string
  author_name: string
  author_email?: string
  message: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
  moderated_by?: string
  moderated_at?: string
  ip_address?: string
  user_agent?: string
}

export interface TributeCreateData {
  memorial_id: string
  author_name: string
  author_email?: string
  message: string
  ip_address?: string
  user_agent?: string
}

/**
 * Create a new tribute
 */
export async function createTribute(data: TributeCreateData): Promise<Tribute> {
  const sql = getSql()
  if (!sql) throw new Error("Database not available")

  const tribute = await sql`
    INSERT INTO tributes (
      memorial_id, author_name, author_email, message, 
      ip_address, user_agent, status
    )
    VALUES (
      ${data.memorial_id}, ${data.author_name}, ${data.author_email || null}, ${data.message},
      ${data.ip_address || null}, ${data.user_agent || null}, 'approved'
    )
    RETURNING *
  `

  return tribute[0] as Tribute
}

/**
 * Get tributes for a memorial
 */
export async function getTributes(
  memorial_id: string, 
  options: { 
    include_pending?: boolean
    limit?: number
    offset?: number
  } = {}
): Promise<Tribute[]> {
  const sql = getSql()
  if (!sql) throw new Error("Database not available")

  const { include_pending = false, limit = 50, offset = 0 } = options

  let statusCondition = sql`WHERE memorial_id = ${memorial_id} AND status = 'approved'`
  if (include_pending) {
    statusCondition = sql`WHERE memorial_id = ${memorial_id} AND status IN ('approved', 'pending')`
  }

  const tributes = await sql`
    SELECT * FROM tributes 
    ${statusCondition}
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `

  return tributes as Tribute[]
}

/**
 * Get tributes for memorials owned by a user
 */
export async function getTributesForOwner(
  user_id: string,
  options: {
    status?: 'pending' | 'approved' | 'rejected' | 'all'
    limit?: number
    offset?: number
  } = {}
): Promise<Array<Tribute & { memorial_title?: string; memorial_full_name?: string }>> {
  const sql = getSql()
  if (!sql) throw new Error("Database not available")

  const { status = 'pending', limit = 100, offset = 0 } = options

  let statusCondition = sql``
  if (status === 'pending') statusCondition = sql`AND t.status = 'pending'`
  else if (status === 'approved') statusCondition = sql`AND t.status = 'approved'`  
  else if (status === 'rejected') statusCondition = sql`AND t.status = 'rejected'`
  // 'all' means no status filter

  const tributes = await sql`
    SELECT 
      t.*,
      m.title as memorial_title,
      m.full_name as memorial_full_name
    FROM tributes t
    JOIN memorials m ON m.id = t.memorial_id
    WHERE (m.created_by = ${user_id} OR m.owner_user_id = ${user_id})
      ${statusCondition}
    ORDER BY t.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `

  return tributes as Array<Tribute & { memorial_title?: string; memorial_full_name?: string }>
}

/**
 * Moderate a tribute (approve/reject)
 */
export async function moderateTribute(
  tribute_id: string,
  memorial_id: string,
  moderator_user_id: string,
  action: 'approve' | 'reject'
): Promise<void> {
  const sql = getSql()
  if (!sql) throw new Error("Database not available")

  const status = action === 'approve' ? 'approved' : 'rejected'

  await sql`
    UPDATE tributes 
    SET 
      status = ${status},
      moderated_by = ${moderator_user_id},
      moderated_at = NOW(),
      updated_at = NOW()
    WHERE id = ${tribute_id} AND memorial_id = ${memorial_id}
  `
}

/**
 * Delete a tribute
 */
export async function deleteTribute(tribute_id: string, memorial_id: string): Promise<void> {
  const sql = getSql()
  if (!sql) throw new Error("Database not available")

  await sql`
    DELETE FROM tributes 
    WHERE id = ${tribute_id} AND memorial_id = ${memorial_id}
  `
}

/**
 * Check if user owns a memorial
 */
export async function checkMemorialOwnership(memorial_id: string, user_id: string): Promise<boolean> {
  const sql = getSql()
  if (!sql) return false

  const result = await sql`
    SELECT 1 FROM memorials 
    WHERE id = ${memorial_id} 
      AND (created_by = ${user_id} OR owner_user_id = ${user_id})
    LIMIT 1
  `

  return result.length > 0
}

/**
 * Verify session token and get user
 */
export async function verifySession(token: string | undefined) {
  if (!token) return null
  try {
    return await getUserBySessionToken(token)
  } catch {
    return null
  }
}


/**
 * Get client IP address from request
 */
export function getClientIP(request: any): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
  )
}
