import { NextResponse, type NextRequest } from "next/server"
import { supabase } from "@/lib/database"
import { getAuthenticatedUser } from "@/lib/auth-helpers"

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const user = await getAuthenticatedUser(request)

    // Get the memorial with creator info
    const { data: memorial, error } = await supabase
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

    if (error || !memorial) {
      return NextResponse.json({ error: "Memorial not found" }, { status: 404 })
    }

    // Check access permissions
    const isOwner = user && String(memorial.created_by) === String(user.id)

    // For now, allow public access to all memorials
    // Later we can add privacy controls here
    const canAccess = true // memorial.is_public || isOwner || (user && memorial.allow_public_access)

    if (!canAccess) {
      return NextResponse.json({ error: "Memorial not found" }, { status: 404 })
    }

    // Return the memorial data
    return NextResponse.json({
      ...memorial,
      creator_name: memorial.users?.name || '',
      creator_email: memorial.users?.email || '',
      users: undefined, // Remove the nested users object
      // Add computed fields
      isOwner: Boolean(isOwner),
      canEdit: Boolean(isOwner),
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
    } = body

    // Check if user owns this memorial
    const { data: memorial, error: checkError } = await supabase
      .from('memorials')
      .select('created_by')
      .eq('id', id)
      .single()

    if (checkError || !memorial) {
      return NextResponse.json({ error: "Memorial not found" }, { status: 404 })
    }

    const isOwner = String(memorial.created_by) === String(user.id)

    if (!isOwner) {
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
    const { data: memorial, error: checkError } = await supabase
      .from('memorials')
      .select('created_by')
      .eq('id', id)
      .single()

    if (checkError || !memorial) {
      return NextResponse.json({ error: "Memorial not found" }, { status: 404 })
    }

    const isOwner = String(memorial.created_by) === String(user.id)

    if (!isOwner) {
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
