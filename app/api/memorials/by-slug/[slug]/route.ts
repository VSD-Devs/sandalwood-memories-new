import { NextResponse, type NextRequest } from "next/server"
import { getMemorialBySlug } from "@/lib/database"
import { getAuthenticatedUser } from "@/lib/auth-helpers"
import { getMemorialAccessBySlug } from "@/lib/memorial-access"

export async function GET(
  request: NextRequest, 
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params
    
    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 })
    }

    // Check authentication for ownership/collaboration info
    const user = await getAuthenticatedUser(request)

    // Load access check and full memorial data in parallel for better performance
    // The access check loads core fields, and getMemorialBySlug loads full data
    // This is still faster than sequential calls
    const [access, memorial] = await Promise.all([
      getMemorialAccessBySlug(slug, user?.id),
      getMemorialBySlug(slug)
    ])

    if (!access || !memorial) {
      return NextResponse.json({ error: "Memorial not found" }, { status: 404 })
    }

    if (!access.canView) {
      return NextResponse.json({
        error: "This memorial is private",
        requiresAccess: true,
        memorialId: access.memorialId,
        memorialSlug: access.memorialSlug,
        accessStatus: access.accessStatus,
        requestStatus: access.requestStatus
      }, { status: 403 })
    }

    const responseData = {
      ...memorial,
      isOwner: !!access.isOwner,
      accessStatus: access.accessStatus,
      requestStatus: access.requestStatus
    }

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600', // Cache for 5 minutes, serve stale for 10 minutes
      }
    })
  } catch (err) {
    console.error("Get memorial by slug error:", err)
    const details = (err as any)?.message || String(err)
    return NextResponse.json({ error: "Failed to fetch memorial", details }, { status: 500 })
  }
}
