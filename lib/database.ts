import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// For backwards compatibility with existing queries
function getSql() {
  return supabase
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
  is_approved: boolean
  created_at: string
  updated_at?: string
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
    const { data, error } = await supabase
      .from('memorials')
      .select(`
        *,
        users (
          name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.warn('Database error:', error)
      return []
    }

    return data?.map(memorial => ({
      ...memorial,
      creator_name: memorial.users?.name || '',
      creator_email: memorial.users?.email || '',
      users: undefined // Remove the nested users object
    })) as (Memorial & { creator_name: string; creator_email: string })[]
  } catch (error) {
    console.warn('Database not available, returning empty array:', error)
    return []
  }
}

export async function getMemorialById(id: string) {
  try {
    const { data, error } = await supabase
      .from('memorials')
      .select(`
        *,
        users (
          name,
          email
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.warn('Database error:', error)
      return undefined
    }

    return {
      ...data,
      creator_name: data.users?.name || '',
      creator_email: data.users?.email || '',
      users: undefined // Remove the nested users object
    } as (Memorial & { creator_name: string; creator_email: string })
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
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.warn('Database error:', error)
    return []
  }

  return data as User[]
}

// Tribute operations
export async function getTributes(limit = 50, offset = 0) {
  const { data, error } = await supabase
    .from('tributes')
    .select(`
      *,
      memorials (
        title,
        full_name
      )
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.warn('Database error:', error)
    return []
  }

  return data?.map(tribute => ({
    ...tribute,
    memorial_title: tribute.memorials?.title || '',
    full_name: tribute.memorials?.full_name || '',
    memorials: undefined // Remove the nested memorials object
  })) as (Tribute & { memorial_title: string; full_name: string })[]
}

export async function approveTribute(id: string) {
  const { error } = await supabase
    .from('tributes')
    .update({ is_approved: true, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to approve tribute: ${error.message}`)
  }
}

export async function rejectTribute(id: string) {
  const { error } = await supabase
    .from('tributes')
    .update({ is_approved: false, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to reject tribute: ${error.message}`)
  }
}

export async function deleteTribute(id: string) {
  const { error } = await supabase
    .from('tributes')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete tribute: ${error.message}`)
  }
}

// Statistics
export async function getDashboardStats() {
  const [memorialStats, userStats, tributeStats] = await Promise.all([
    supabase.from('memorials').select('status'),
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('tributes').select('is_approved'),
  ])

  // Process memorial stats
  const memorialCounts = { active: 0, pending: 0, archived: 0 }
  if (memorialStats.data) {
    memorialStats.data.forEach((row: any) => {
      if (row.status in memorialCounts) {
        memorialCounts[row.status as keyof typeof memorialCounts]++
      }
    })
  }

  // Process tribute stats
  const tributeCounts = { approved: 0, pending: 0, rejected: 0 }
  if (tributeStats.data) {
    tributeStats.data.forEach((row: any) => {
      if (row.is_approved === true) {
        tributeCounts.approved++
      } else if (row.is_approved === false) {
        tributeCounts.rejected++ // Assuming false means rejected, but this might need adjustment
      } else {
        tributeCounts.pending++
      }
    })
  }

  return {
    memorials: memorialCounts,
    users: userStats.count || 0,
    tributes: tributeCounts,
  }
}
