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

    // Check access first to avoid leaking private details
    const access = await getMemorialAccessBySlug(slug, user?.id)

    if (!access) {
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

    // Get memorial by slug now that access is confirmed
    const memorial = await getMemorialBySlug(slug)
    
    if (!memorial) {
      return NextResponse.json({ error: "Memorial not found" }, { status: 404 })
    }

    const responseData = {
      ...memorial,
      isOwner: !!access.isOwner,
      accessStatus: access.accessStatus,
      requestStatus: access.requestStatus
    }

    return NextResponse.json(responseData)
  } catch (err) {
    console.error("Get memorial by slug error:", err)
    const details = (err as any)?.message || String(err)
    return NextResponse.json({ error: "Failed to fetch memorial", details }, { status: 500 })
  }
}
