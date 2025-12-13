import { NextResponse, type NextRequest } from "next/server"
import { getTributes, createTribute, getClientIP, verifySession, checkMemorialOwnership } from "@/lib/tributes"
import { getSessionCookieName } from "@/lib/auth"
import { cookies } from "next/headers"
import { getMemorialAccess } from "@/lib/memorial-access"

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const { searchParams } = new URL(request.url)
    const includePending = searchParams.get("include_pending") === "1"
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(getSessionCookieName())?.value
    const user = await verifySession(sessionToken)
    const access = await getMemorialAccess(id, user?.id)

    if (!access) {
      return NextResponse.json({ error: "Memorial not found" }, { status: 404 })
    }

    if (!access.canView) {
      return NextResponse.json({ error: "This memorial is private", requiresAccess: true, requestStatus: access.requestStatus }, { status: 403 })
    }

    // Check if user is the memorial owner (for viewing pending tributes)
    let isOwner = false
    if (includePending && user) {
      isOwner = await checkMemorialOwnership(id, user.id)
    }

    // Get approved tributes (all tributes are now auto-approved)
    const tributes = await getTributes(id, {
      include_pending: false, // No longer needed since all are auto-approved
      limit,
      offset
    })

    return NextResponse.json(tributes, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60', // Cache for 30 seconds, serve stale for 1 minute
      }
    })
  } catch (err) {
    console.error("Fetch tributes error:", err)
    return NextResponse.json({ error: "Failed to fetch tributes" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(getSessionCookieName())?.value
    const user = await verifySession(sessionToken)
    const access = await getMemorialAccess(id, user?.id)

    if (!access) {
      return NextResponse.json({ error: "Memorial not found" }, { status: 404 })
    }

    if (!access.canView) {
      return NextResponse.json({ error: "This memorial is private", requiresAccess: true, requestStatus: access.requestStatus }, { status: 403 })
    }
    
    const { author_name, author_email, message } = body

    // Validation
    const errors: Record<string, string> = {}
    
    if (!author_name?.trim() || author_name.length < 2) {
      errors.author_name = "Please enter your name (at least 2 characters)"
    }
    
    if (author_name?.length > 100) {
      errors.author_name = "Name is too long (maximum 100 characters)"
    }

    if (author_email && !/^\S+@\S+\.\S+$/.test(author_email)) {
      errors.author_email = "Please enter a valid email address"
    }

    if (!message?.trim() || message.length < 5) {
      errors.message = "Please write a message (at least 5 characters)"
    }

    if (message?.length > 2000) {
      errors.message = "Message is too long (maximum 2000 characters)"
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: errors 
      }, { status: 400 })
    }

    // Get client information for spam prevention (temporarily disabled)
    // const ip_address = getClientIP(request)
    // const user_agent = request.headers.get("user-agent") || undefined

    // Create the tribute
    const tribute = await createTribute({
      memorial_id: id,
      author_name: author_name.trim(),
      author_email: author_email?.trim() || undefined,
      message: message.trim()
      // ip_address,
      // user_agent
    })

    return NextResponse.json({
      id: tribute.id,
      author_name: tribute.author_name,
      message: tribute.message,
      status: tribute.status,
      created_at: tribute.created_at
    })
  } catch (err) {
    console.error("Create tribute error:", err)
    
    // Handle specific database errors
    if (err instanceof Error) {
      if (err.message.includes("memorial_id") && err.message.includes("foreign key")) {
        return NextResponse.json({ error: "Memorial not found" }, { status: 404 })
      }
    }
    
    return NextResponse.json({ 
      error: "Failed to create tribute", 
      details: err instanceof Error ? err.message : "Unknown error"
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const { searchParams } = new URL(request.url)
    const tributeId = searchParams.get("tributeId")

    if (!tributeId) {
      return NextResponse.json({ error: "Tribute ID is required" }, { status: 400 })
    }

    // Check if user is the memorial owner
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(getSessionCookieName())?.value
    const user = await verifySession(sessionToken)
    
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const isOwner = await checkMemorialOwnership(id, user.id)
    if (!isOwner) {
      return NextResponse.json({ error: "Only memorial owners can delete tributes" }, { status: 403 })
    }

    // Delete the tribute using the existing function from lib/tributes
    const { deleteTribute } = await import("@/lib/tributes")
    await deleteTribute(tributeId, id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Delete tribute error:", err)
    return NextResponse.json({ 
      error: "Failed to delete tribute", 
      details: err instanceof Error ? err.message : "Unknown error"
    }, { status: 500 })
  }
}
