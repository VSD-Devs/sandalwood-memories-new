import { NextResponse, type NextRequest } from "next/server"
import { getAuthenticatedUser } from "@/lib/auth-helpers"
import { createAccessRequest, getAccessRequestsForOwner, setAccessRequestStatus } from "@/lib/memorial-access"

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { id } = await context.params
    const requests = await getAccessRequestsForOwner(id, user.id)
    return NextResponse.json(requests)
  } catch (err) {
    const message = (err as Error)?.message || ""
    if (message.includes("ownership")) {
      return NextResponse.json({ error: "Only the memorial owner can view requests" }, { status: 403 })
    }
    console.error("Load access requests error:", err)
    return NextResponse.json({ error: "Failed to load access requests" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const user = await getAuthenticatedUser(request)
    const body = await request.json().catch(() => ({}))

    const requesterEmail = (body?.email || user?.email || "").trim() || null
    const requesterName = (body?.name || user?.name || "").trim() || null
    const message = (body?.message || "").trim() || null

    const result = await createAccessRequest({
      memorialId: id,
      requesterUserId: user?.id || null,
      requesterEmail,
      requesterName,
      message,
    })

    return NextResponse.json({
      status: result.status,
      requestId: result.requestId,
      already: result.already || false,
      canView: result.canView || false,
    })
  } catch (err) {
    const message = (err as Error)?.message || ""
    if (message.includes("Memorial not found")) {
      return NextResponse.json({ error: "Memorial not found" }, { status: 404 })
    }
    if (message.toLowerCase().includes("email")) {
      return NextResponse.json({ error: message || "Email is required" }, { status: 400 })
    }
    console.error("Create access request error:", err)
    return NextResponse.json({ error: "Failed to submit access request" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { requestId, status } = body || {}

    if (!requestId || (status !== "approved" && status !== "declined")) {
      return NextResponse.json({ error: "requestId and status are required" }, { status: 400 })
    }

    const { id } = await context.params
    const updated = await setAccessRequestStatus(id, user.id, requestId, status)

    return NextResponse.json({ status: updated.status, requestId: updated.id })
  } catch (err) {
    const message = (err as Error)?.message || ""
    if (message.includes("ownership")) {
      return NextResponse.json({ error: "Only the memorial owner can update requests" }, { status: 403 })
    }
    console.error("Update access request error:", err)
    return NextResponse.json({ error: "Failed to update access request" }, { status: 500 })
  }
}





