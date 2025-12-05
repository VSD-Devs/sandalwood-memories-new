import { type NextRequest } from "next/server"
import { getUserBySessionToken, getSessionCookieName } from "@/lib/auth"
import { supabase } from "@/lib/database"
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
 * For now, we check if they're the owner (created_by)
 * This can be extended later for collaborators
 */
export async function checkMemorialAccess(
  memorialId: string,
  userId: string
): Promise<{ hasAccess: boolean; isOwner: boolean }> {
  try {
    const { data: memorial, error } = await supabase
      .from('memorials')
      .select('id, created_by')
      .eq('id', memorialId)
      .single()

    if (error || !memorial) {
      return { hasAccess: false, isOwner: false }
    }

    const isOwner = String(memorial.created_by) === String(userId)

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



