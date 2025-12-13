import { NextResponse, type NextRequest } from "next/server"
import { supabase } from "@/lib/database"
import { getAuthenticatedUser } from "@/lib/auth-helpers"
import { getMemorialAccess } from "@/lib/memorial-access"

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const user = await getAuthenticatedUser(request)

    // Load memorial and access check in parallel for better performance
    const [memorialResult, access] = await Promise.all([
      supabase
        .from('memorials')
        .select(`
          *,
          users (
            name,
            email
          )
        `)
        .eq('id', id)
        .single(),
      getMemorialAccess(id, user?.id)
    ])

    const { data: memorial, error } = memorialResult

    if (error || !memorial || !access) {
      return NextResponse.json({ error: "Memorial not found" }, { status: 404 })
    }

    if (!access.canView) {
      return NextResponse.json({
        error: "This memorial is private",
        requiresAccess: true,
        memorialId: memorial.id,
        memorialSlug: memorial.slug,
        is_public: memorial.is_public,
        accessStatus: access.accessStatus,
        requestStatus: access.requestStatus
      }, { status: 403 })
    }

    // Return the memorial data with caching headers
    return NextResponse.json({
      ...memorial,
      creator_name: memorial.users?.name || '',
      creator_email: memorial.users?.email || '',
      users: undefined, // Remove the nested users object
      isOwner: Boolean(access.isOwner),
      canEdit: Boolean(access.isOwner || access.isCollaborator),
      accessStatus: access.accessStatus,
      requestStatus: access.requestStatus
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600', // Cache for 5 minutes, serve stale for 10 minutes
      }
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
      is_public,
    } = body

    // Check if user owns this memorial
    const access = await getMemorialAccess(id, user.id)
    if (!access) {
      return NextResponse.json({ error: "Memorial not found" }, { status: 404 })
    }

    if (!access.isOwner) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 })
    }

    // Update the memorial
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (full_name !== undefined) updateData.full_name = full_name
    if (title !== undefined) updateData.title = title
    if (birth_date !== undefined) updateData.birth_date = birth_date
    if (death_date !== undefined) updateData.death_date = death_date
    if (biography !== undefined) updateData.biography = biography
    if (theme !== undefined) updateData.theme = theme
    if (profile_image_url !== undefined) updateData.profile_image_url = profile_image_url
    if (cover_image_url !== undefined) updateData.cover_image_url = cover_image_url
    if (is_alive !== undefined) updateData.is_alive = is_alive
    if (burial_location !== undefined) updateData.burial_location = burial_location
    if (is_public !== undefined) updateData.is_public = Boolean(is_public)

    const { data: updatedMemorial, error: updateError } = await supabase
      .from('memorials')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating memorial:', updateError)
      throw new Error('Failed to update memorial')
    }

    return NextResponse.json(updatedMemorial)

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

    // Check if user owns this memorial
    const access = await getMemorialAccess(id, user.id)
    if (!access) {
      return NextResponse.json({ error: "Memorial not found" }, { status: 404 })
    }

    if (!access.isOwner) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 })
    }

    // For safety, just mark as deleted rather than actually deleting
    const { error: updateError } = await supabase
      .from('memorials')
      .update({
        status: 'deleted',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) {
      console.error('Error deleting memorial:', updateError)
      throw new Error('Failed to delete memorial')
    }

    return NextResponse.json({ message: "Memorial deleted successfully" })

  } catch (err) {
    console.error("Delete memorial error:", err)
    const details = (err as any)?.message || String(err)
    return NextResponse.json({ error: "Failed to delete memorial", details }, { status: 500 })
  }
}
