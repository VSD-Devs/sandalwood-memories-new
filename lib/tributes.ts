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
 * Ensure the tribute object always carries both boolean and string status fields.
 * This makes the API consistent even if the database schema differs between
 * environments (e.g. `status` text vs `is_approved` boolean).
 */
function normalizeTribute(tribute: any): Tribute {
  const derivedStatus: TributeStatus =
    tribute?.status ||
    (tribute?.is_approved === false ? 'pending' : 'approved')

  const derivedIsApproved =
    typeof tribute?.is_approved === 'boolean'
      ? tribute.is_approved
      : derivedStatus === 'approved'

  return {
    ...tribute,
    status: derivedStatus,
    is_approved: derivedIsApproved,
  }
}

/**
 * Create a new tribute
 */
export async function createTribute(data: TributeCreateData): Promise<Tribute> {
  const basePayload = {
    memorial_id: data.memorial_id,
    author_name: data.author_name,
    author_email: data.author_email || null,
    message: data.message,
  }

  const moderationPayload = {
    status: 'approved' as TributeStatus,
    is_approved: true, // backward compatibility with earlier schema
  }

  // Only attach optional fields if provided to avoid schema mismatches
  const optionalPayload: Record<string, string | null> = {}
  if (data.ip_address) optionalPayload.ip_address = data.ip_address
  if (data.user_agent) optionalPayload.user_agent = data.user_agent

  const payloadVariants: Array<Record<string, any>> = [
    { ...basePayload, ...optionalPayload, ...moderationPayload },
    { ...basePayload, ...moderationPayload },
    { ...basePayload },
  ]

  let lastError: any = null

  for (const payload of payloadVariants) {
    const { data: tribute, error } = await supabase
      .from('tributes')
      .insert(payload)
      .select()
      .single()

    if (!error && tribute) {
      return normalizeTribute(tribute)
    }

    lastError = error

    // Only retry on missing-column style errors; anything else should surface immediately
    const message = error?.message?.toLowerCase?.() || ''
    const looksLikeSchemaGap =
      message.includes('schema cache') ||
      message.includes('does not exist') ||
      message.includes('column')

    if (!looksLikeSchemaGap) {
      break
    }
  }

  throw new Error(`Failed to create tribute: ${lastError?.message || 'Unknown error'}`)
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

  // Apply status filter
  if (status === 'approved') {
    query = query.eq('is_approved', true)
  } else if (status === 'pending') {
    query = query.eq('is_approved', false)
  }
  // 'all' or 'rejected' means no additional filter needed for now

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
