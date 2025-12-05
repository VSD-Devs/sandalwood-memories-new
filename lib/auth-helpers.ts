import { type NextRequest } from "next/server"
import { getUserBySessionToken, getSessionCookieName } from "@/lib/auth"
import type { AuthUser } from "@/lib/auth"

/**
 * Get authenticated user from request session
 * Returns null if not authenticated
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<AuthUser | null> {
  try {
    const token = request.cookies.get(getSessionCookieName())?.value
    if (!token) return null
    
    const user = await getUserBySessionToken(token)
    return user
  } catch (error) {
    console.error("Authentication error:", error)
    return null
  }
}

/**
 * Require authentication for API endpoint
 * Throws error if user is not authenticated
 */
export async function requireAuth(request: NextRequest): Promise<AuthUser> {
  const user = await getAuthenticatedUser(request)
  if (!user) {
    throw new Error("Authentication required")
  }
  return user
}

/**
 * Check if user owns or can access a memorial
 * For now, we check if they're the owner (created_by or owner_user_id)
 * This can be extended later for collaborators
 */
export async function checkMemorialAccess(
  memorialId: string, 
  userId: string
): Promise<{ hasAccess: boolean; isOwner: boolean }> {
  const { neon } = await import("@neondatabase/serverless")
  
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

  try {
    const sql = getSql()
    const result = await sql`
      SELECT 
        id,
        created_by,
        owner_user_id,
        CASE 
          WHEN created_by = ${userId} OR owner_user_id = ${userId} THEN true
          ELSE false
        END as is_owner
      FROM memorials 
      WHERE id = ${memorialId}
      LIMIT 1
    `

    if (result.length === 0) {
      return { hasAccess: false, isOwner: false }
    }

    const memorial = result[0]
    const isOwner = Boolean(memorial.is_owner)
    
    // For now, access is same as ownership
    // Later we can extend this to check collaborators table
    return { hasAccess: isOwner, isOwner }
    
  } catch (error) {
    console.error("Memorial access check error:", error)
    return { hasAccess: false, isOwner: false }
  }
}

/**
 * Require memorial ownership for API endpoint
 * Throws error if user doesn't own the memorial
 */
export async function requireMemorialOwnership(
  memorialId: string, 
  userId: string
): Promise<void> {
  const { hasAccess, isOwner } = await checkMemorialAccess(memorialId, userId)
  
  if (!hasAccess || !isOwner) {
    throw new Error("Memorial ownership required")
  }
}



