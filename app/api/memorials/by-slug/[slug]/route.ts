import { NextResponse, type NextRequest } from "next/server"
import { getMemorialBySlug } from "@/lib/database"
import { getAuthenticatedUser } from "@/lib/auth-helpers"

export async function GET(
  request: NextRequest, 
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params
    
    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 })
    }

    // Get memorial by slug
    const memorial = await getMemorialBySlug(slug)
    
    if (!memorial) {
      return NextResponse.json({ error: "Memorial not found" }, { status: 404 })
    }

    // Check authentication for ownership/collaboration info
    const user = await getAuthenticatedUser(request)
    
    // Add ownership information if user is authenticated
    const isOwner = user && (memorial.created_by === user.id || memorial.owner_user_id === user.id)
    
    const responseData = {
      ...memorial,
      isOwner: !!isOwner
    }

    return NextResponse.json(responseData)
  } catch (err) {
    console.error("Get memorial by slug error:", err)
    const details = (err as any)?.message || String(err)
    return NextResponse.json({ error: "Failed to fetch memorial", details }, { status: 500 })
  }
}
