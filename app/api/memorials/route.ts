import { NextResponse, type NextRequest } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getAuthenticatedUser, requireAuth } from "@/lib/auth-helpers"
import { generateTemplateBiography } from "@/lib/biography-template"
import { generateSlug, ensureUniqueSlug } from "@/lib/slug-utils"

function getSql() {
  const rawCandidates = [process.env.DATABASE_URL, process.env.POSTGRES_URL, process.env.DATABASE_URL_UNPOOLED]
  const candidates = rawCandidates
    .filter((v) => typeof v === "string" && v.trim().length > 0)
    .map((v) => v!.trim().replace(/^postgres:\/\//, "postgresql://"))
  if (candidates.length === 0) {
    return null
  }
  for (const url of candidates) {
    try {
      return neon(url)
    } catch {}
  }
  return null
}

export async function POST(request: NextRequest) {
  try {
    // Require authentication for memorial creation
    const user = await requireAuth(request)
    
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
      is_alive = false,
      burial_location = null,
    } = body || {}

    if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL && !process.env.DATABASE_URL_UNPOOLED) {
      // Fallback: generate a client-only ID and return it so the UI can navigate
      return NextResponse.json({ id: crypto.randomUUID(), full_name, title, birth_date, death_date, biography, theme, is_alive })
    }

    if (!full_name || !title) {
      return NextResponse.json({ error: "full_name and title are required" }, { status: 400 })
    }

    // Generate template biography if none provided
    const finalBiography = biography || generateTemplateBiography({
      full_name,
      birth_date,
      death_date,
      is_alive
    })

    const sql = getSql()
    // Ensure new columns exist (safe if already present)
    try {
      await sql`ALTER TABLE memorials ADD COLUMN IF NOT EXISTS is_alive boolean DEFAULT false` 
    } catch {}
    try {
      await sql`ALTER TABLE memorials ADD COLUMN IF NOT EXISTS burial_location text` 
    } catch {}
    try {
      await sql`ALTER TABLE memorials ADD COLUMN IF NOT EXISTS owner_user_id UUID` 
    } catch {}
    try {
      await sql`ALTER TABLE memorials ADD COLUMN IF NOT EXISTS slug text` 
      await sql`CREATE INDEX IF NOT EXISTS idx_memorials_slug ON memorials(slug)`
    } catch {}

    // Generate unique slug for the memorial
    const baseSlug = generateSlug(full_name)
    const existingSlugs = await sql`SELECT slug FROM memorials WHERE slug LIKE ${baseSlug + '%'}`
    const existingSlugsList = existingSlugs.map((row: any) => row.slug).filter(Boolean)
    const uniqueSlug = ensureUniqueSlug(baseSlug, existingSlugsList)

    // Insert memorial with proper ownership and slug
    const result = await sql`
      INSERT INTO memorials (
        full_name, title, slug, birth_date, death_date, biography, 
        created_by, owner_user_id, profile_image_url, cover_image_url, 
        is_alive, burial_location
      )
      VALUES (
        ${full_name}, ${title}, ${uniqueSlug}, ${birth_date}, ${death_date}, ${finalBiography}, 
        ${user.id}, ${user.id}, ${profile_image_url}, ${cover_image_url}, 
        ${is_alive}, ${burial_location}
      )
      RETURNING id, title, full_name, slug, created_by, owner_user_id, created_at
    `

    const memorial = result?.[0]
    if (!memorial?.id) {
      throw new Error("Failed to create memorial - no ID returned")
    }
    
    return NextResponse.json({ 
      id: memorial.id,
      slug: memorial.slug,
      message: "Memorial created successfully" 
    })
    
  } catch (err) {
    console.error("Create memorial error:", err)
    const details = (err as any)?.message || String(err)
    
    // Handle authentication errors specifically
    if (details.includes("Authentication required")) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    
    return NextResponse.json({ error: "Failed to create memorial", details }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get("limit")
    const limit = Math.min(Number(limitParam || "50"), 100)
    const myMemorialsOnly = searchParams.get("my_memorials") === "true"

    const sql = getSql()
    if (!sql) {
      return NextResponse.json([])
    }
    let result

    if (myMemorialsOnly) {
      // For "my memorials" - require authentication and only return user's memorials
      let user
      try {
        user = await requireAuth(request)
      } catch (authError: any) {
        // Handle authentication errors specifically
        if (authError?.message?.includes("Authentication required")) {
          return NextResponse.json({ error: "Authentication required" }, { status: 401 })
        }
        throw authError
      }

      try {
        result = await sql`
          SELECT
            m.*,
            u.name as creator_name,
            u.email as creator_email
          FROM memorials m
          LEFT JOIN users u ON m.created_by = u.id
          WHERE m.owner_user_id = ${user.id} OR m.created_by = ${user.id}
          ORDER BY m.created_at DESC
          LIMIT ${limit}
        `
      } catch (error: any) {
        // Check if it's a connection error
        const errorMessage = error?.message || String(error)
        const isConnectionError =
          errorMessage.includes('fetch failed') ||
          errorMessage.includes('Connect Timeout') ||
          errorMessage.includes('UND_ERR_CONNECT_TIMEOUT') ||
          error?.code === 'UND_ERR_CONNECT_TIMEOUT' ||
          error?.cause?.code === 'UND_ERR_CONNECT_TIMEOUT'

        if (isConnectionError) {
          console.log("Database connection timeout for my memorials, returning empty array")
          return NextResponse.json([])
        }

        // If columns don't exist, try simpler query
        if (error?.message?.includes('column') || error?.code === '42703') {
          console.log("Some columns not found for my memorials, using basic query")
          try {
            result = await sql`
              SELECT m.*
              FROM memorials m
              WHERE m.owner_user_id = ${user.id} OR m.created_by = ${user.id}
              ORDER BY m.created_at DESC
              LIMIT ${limit}
            `
          } catch (basicError: any) {
            const basicErrorMessage = basicError?.message || String(basicError)
            const isBasicConnectionError =
              basicErrorMessage.includes('fetch failed') ||
              basicErrorMessage.includes('Connect Timeout') ||
              basicErrorMessage.includes('UND_ERR_CONNECT_TIMEOUT') ||
              basicError?.code === 'UND_ERR_CONNECT_TIMEOUT' ||
              basicError?.cause?.code === 'UND_ERR_CONNECT_TIMEOUT'

            if (isBasicConnectionError) {
              console.log("Database connection timeout in basic my memorials query, returning empty array")
              return NextResponse.json([])
            }

            // If owner_user_id column doesn't exist, fallback to created_by only
            console.log("owner_user_id column not found, using created_by only")
            try {
              result = await sql`
                SELECT m.*
                FROM memorials m
                WHERE m.created_by = ${user.id}
                ORDER BY m.created_at DESC
                LIMIT ${limit}
              `
            } catch (fallbackError: any) {
              const fallbackErrorMessage = fallbackError?.message || String(fallbackError)
              const isFallbackConnectionError =
                fallbackErrorMessage.includes('fetch failed') ||
                fallbackErrorMessage.includes('Connect Timeout') ||
                fallbackErrorMessage.includes('UND_ERR_CONNECT_TIMEOUT') ||
                fallbackError?.code === 'UND_ERR_CONNECT_TIMEOUT' ||
                fallbackError?.cause?.code === 'UND_ERR_CONNECT_TIMEOUT'

              if (isFallbackConnectionError) {
                console.log("Database connection timeout in fallback my memorials query, returning empty array")
                return NextResponse.json([])
              }
              throw fallbackError
            }
          }
        } else {
          throw error
        }
      }
    } else {
      // Public memorial listing - try with filters first, fallback to simple query if columns don't exist
      try {
        result = await sql`
          SELECT 
            m.*,
            u.name as creator_name, 
            u.email as creator_email
          FROM memorials m
          LEFT JOIN users u ON m.created_by = u.id
          WHERE m.is_public = true 
          AND m.status = 'active'
          ORDER BY m.created_at DESC
          LIMIT ${limit}
        `
      } catch (filterError: any) {
        // Check if it's a connection error - if so, return empty array gracefully
        const errorMessage = filterError?.message || String(filterError)
        const isConnectionError = 
          errorMessage.includes('fetch failed') ||
          errorMessage.includes('Connect Timeout') ||
          errorMessage.includes('UND_ERR_CONNECT_TIMEOUT') ||
          filterError?.code === 'UND_ERR_CONNECT_TIMEOUT' ||
          filterError?.cause?.code === 'UND_ERR_CONNECT_TIMEOUT'
        
        if (isConnectionError) {
          console.log("Database connection timeout, returning empty array")
          return NextResponse.json([])
        }

        // If columns don't exist, try without filters
        if (filterError?.message?.includes('column') || filterError?.code === '42703') {
          console.log("Columns is_public or status not found, using simple query")
          try {
            result = await sql`
              SELECT 
                m.*,
                u.name as creator_name, 
                u.email as creator_email
              FROM memorials m
              LEFT JOIN users u ON m.created_by = u.id
              ORDER BY m.created_at DESC
              LIMIT ${limit}
            `
          } catch (joinError: any) {
            // Check for connection errors in fallback too
            const joinErrorMessage = joinError?.message || String(joinError)
            const isJoinConnectionError = 
              joinErrorMessage.includes('fetch failed') ||
              joinErrorMessage.includes('Connect Timeout') ||
              joinErrorMessage.includes('UND_ERR_CONNECT_TIMEOUT') ||
              joinError?.code === 'UND_ERR_CONNECT_TIMEOUT' ||
              joinError?.cause?.code === 'UND_ERR_CONNECT_TIMEOUT'
            
            if (isJoinConnectionError) {
              console.log("Database connection timeout in fallback, returning empty array")
              return NextResponse.json([])
            }

            // If users table doesn't exist or JOIN fails, use simplest query
            console.log("Users table or JOIN not available, using basic query")
            try {
              result = await sql`
                SELECT m.*
                FROM memorials m
                ORDER BY m.created_at DESC
                LIMIT ${limit}
              `
            } catch (basicError: any) {
              // Final check for connection errors
              const basicErrorMessage = basicError?.message || String(basicError)
              const isBasicConnectionError = 
                basicErrorMessage.includes('fetch failed') ||
                basicErrorMessage.includes('Connect Timeout') ||
                basicErrorMessage.includes('UND_ERR_CONNECT_TIMEOUT') ||
                basicError?.code === 'UND_ERR_CONNECT_TIMEOUT' ||
                basicError?.cause?.code === 'UND_ERR_CONNECT_TIMEOUT'
              
              if (isBasicConnectionError) {
                console.log("Database connection timeout in basic query, returning empty array")
                return NextResponse.json([])
              }
              throw basicError
            }
          }
        } else {
          throw filterError
        }
      }
    }

    return NextResponse.json(result || [])
  } catch (err) {
    // Final catch for any remaining errors - check for connection errors here too
    const errorMessage = (err as any)?.message || String(err)
    const isConnectionError = 
      errorMessage.includes('fetch failed') ||
      errorMessage.includes('Connect Timeout') ||
      errorMessage.includes('UND_ERR_CONNECT_TIMEOUT') ||
      (err as any)?.code === 'UND_ERR_CONNECT_TIMEOUT' ||
      (err as any)?.cause?.code === 'UND_ERR_CONNECT_TIMEOUT'
    
    if (isConnectionError) {
      console.log("Database connection timeout in final catch, returning empty array")
      return NextResponse.json([])
    }

    console.error("List memorials error:", err)
    const details = (err as any)?.message || String(err)
    return NextResponse.json({ error: "Failed to list memorials", details }, { status: 500 })
  }
}


