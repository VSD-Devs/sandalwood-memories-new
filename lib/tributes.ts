import { supabase } from "./database"
import { getSessionCookieName, getUserBySessionToken } from "./auth"

type TributeStatus = 'pending' | 'approved' | 'rejected'

export interface Tribute {
  id: string
  memorial_id: string
  author_name: string
  author_email?: string
  message: string
  is_approved?: boolean
  status?: TributeStatus
  created_at: string
  updated_at?: string
  // Temporarily optional until schema migration
  ip_address?: string
  user_agent?: string
}

export interface TributeCreateData {
  memorial_id: string
  author_name: string
  author_email?: string
  message: string
  // Temporarily disabled until schema migration
  // ip_address?: string
  // user_agent?: string
}

/**
 * Ensure the tribute object always carries the status field.
 */
function normalizeTribute(tribute: any): Tribute {
  // If status is present, use it.
  // If only is_approved is present (legacy), map it to status.
  // Default to pending.
  let derivedStatus: TributeStatus = 'pending';

  if (tribute?.status) {
    derivedStatus = tribute.status;
  } else if (typeof tribute?.is_approved === 'boolean') {
    derivedStatus = tribute.is_approved ? 'approved' : 'pending';
  }

  return {
    ...tribute,
    status: derivedStatus,
    is_approved: derivedStatus === 'approved', // Keep for backward compatibility if needed
    ip_address: tribute?.ip_address || undefined,
    user_agent: tribute?.user_agent || undefined,
  }
}

/**
 * Create a new tribute
 */
export async function createTribute(data: TributeCreateData): Promise<Tribute> {
  const payload: any = {
    memorial_id: data.memorial_id,
    author_name: data.author_name,
    author_email: data.author_email || null,
    message: data.message,
    is_approved: true, // Auto-approve by default as requested
  }

  // Temporarily skip ip_address and user_agent until schema is updated
  // if (data.ip_address) payload.ip_address = data.ip_address
  // if (data.user_agent) payload.user_agent = data.user_agent

  const { data: tribute, error } = await supabase
    .from('tributes')
    .insert(payload)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create tribute: ${error.message}`)
  }

  return normalizeTribute(tribute)
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
  const { include_pending = false, limit = 50, offset = 0 } = options

  let query = supabase
    .from('tributes')
    .select('*')
    .eq('memorial_id', memorial_id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  // Apply approval filter - use is_approved for legacy compatibility
  if (!include_pending) {
    query = query.eq('is_approved', true)
  }

  const { data: tributes, error } = await query

  if (error) {
    throw new Error(`Failed to fetch tributes: ${error.message}`)
  }

  return (tributes || []).map(normalizeTribute)
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
  const { status = 'pending', limit = 100, offset = 0 } = options

  let query = supabase
    .from('tributes')
    .select(`
      *,
      memorials (
        title,
        full_name
      )
    `)
    .or(`created_by.eq.${user_id}`)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  // Apply status filter - use is_approved for legacy compatibility
  if (status === 'approved') {
    query = query.eq('is_approved', true)
  } else if (status === 'pending') {
    query = query.eq('is_approved', false)
  } else if (status === 'rejected') {
    query = query.eq('is_approved', false) // For now, treat rejected as not approved
  }
  // 'all' means no additional filter needed

  const { data: tributes, error } = await query

  if (error) {
    throw new Error(`Failed to fetch tributes for owner: ${error.message}`)
  }

  return tributes?.map(tribute => ({
    ...normalizeTribute(tribute),
    memorial_title: tribute.memorials?.title || '',
    memorial_full_name: tribute.memorials?.full_name || '',
    memorials: undefined // Remove the nested memorials object
  })) as Array<Tribute & { memorial_title?: string; memorial_full_name?: string }>
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
  const is_approved = action === 'approve'

  const { error } = await supabase
    .from('tributes')
    .update({
      is_approved,
      updated_at: new Date().toISOString()
    })
    .eq('id', tribute_id)
    .eq('memorial_id', memorial_id)

  if (error) {
    throw new Error(`Failed to moderate tribute: ${error.message}`)
  }
}

/**
 * Delete a tribute
 */
export async function deleteTribute(tribute_id: string, memorial_id: string): Promise<void> {
  const { error } = await supabase
    .from('tributes')
    .delete()
    .eq('id', tribute_id)
    .eq('memorial_id', memorial_id)

  if (error) {
    throw new Error(`Failed to delete tribute: ${error.message}`)
  }
}

/**
 * Check if user owns a memorial
 */
export async function checkMemorialOwnership(memorial_id: string, user_id: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('memorials')
    .select('id')
    .eq('id', memorial_id)
    .or(`created_by.eq.${user_id}`)
    .single()

  return !error && !!data
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
