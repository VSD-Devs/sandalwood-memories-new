import { NextResponse, type NextRequest } from "next/server"
import { supabase } from "@/lib/database"
import { getAuthenticatedUser, requireAuth } from "@/lib/auth-helpers"
import { generateTemplateBiography } from "@/lib/biography-template"
import { generateSlug, ensureUniqueSlug } from "@/lib/slug-utils"

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

    // Generate unique slug for the memorial
    const baseSlug = generateSlug(full_name)
    const { data: existingSlugs } = await supabase
      .from('memorials')
      .select('slug')
      .like('slug', baseSlug + '%')

    const existingSlugsList = existingSlugs?.map(row => row.slug).filter(Boolean) || []
    const uniqueSlug = ensureUniqueSlug(baseSlug, existingSlugsList)

    // Insert memorial with proper ownership and slug
    const { data: memorial, error } = await supabase
      .from('memorials')
      .insert({
        full_name,
        title,
        slug: uniqueSlug,
        birth_date,
        death_date,
        biography: finalBiography,
        created_by: user.id,
        profile_image_url,
        cover_image_url,
        is_alive,
        burial_location
      })
      .select('id, slug')
      .single()

    if (error) {
      console.error('Error creating memorial:', error)
      throw new Error("Failed to create memorial")
    }

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

      const { data: memorials, error } = await supabase
        .from('memorials')
        .select(`
          *,
          users (
            name,
            email
          )
        `)
        .or(`created_by.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching user memorials:', error)
        return NextResponse.json([])
      }

      const result = memorials?.map(memorial => ({
        ...memorial,
        creator_name: memorial.users?.name || '',
        creator_email: memorial.users?.email || '',
        users: undefined // Remove the nested users object
      })) || []

      return NextResponse.json(result)
    } else {
      // Public memorial listing
      const { data: memorials, error } = await supabase
        .from('memorials')
        .select(`
          *,
          users (
            name,
            email
          )
        `)
        .eq('is_public', true)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching public memorials:', error)
        return NextResponse.json([])
      }

      const result = memorials?.map(memorial => ({
        ...memorial,
        creator_name: memorial.users?.name || '',
        creator_email: memorial.users?.email || '',
        users: undefined // Remove the nested users object
      })) || []

      return NextResponse.json(result)
    }
  } catch (err) {
    console.error("List memorials error:", err)
    const details = (err as any)?.message || String(err)
    return NextResponse.json({ error: "Failed to list memorials", details }, { status: 500 })
  }
}


