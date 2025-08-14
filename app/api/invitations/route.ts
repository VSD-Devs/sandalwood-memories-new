import { type NextRequest, NextResponse } from "next/server"
import { createInvitation, getInvitationsByMemorial } from "@/lib/invitations"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { memorial_id, email, role, message } = body

    // In a real app, you'd get the user ID from the session
    const inviter_id = "sample-user-id"

    const invitation = await createInvitation({
      memorial_id,
      inviter_id,
      email,
      role,
      message,
    })

    // In a real app, you'd send an email here
    console.log(`Invitation sent to ${email} for memorial ${memorial_id}`)

    return NextResponse.json(invitation)
  } catch (error) {
    console.error("Error creating invitation:", error)
    return NextResponse.json({ error: "Failed to create invitation" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const memorial_id = searchParams.get("memorial_id")

    if (!memorial_id) {
      return NextResponse.json({ error: "Memorial ID required" }, { status: 400 })
    }

    const invitations = await getInvitationsByMemorial(memorial_id)
    return NextResponse.json(invitations)
  } catch (error) {
    console.error("Error fetching invitations:", error)
    return NextResponse.json({ error: "Failed to fetch invitations" }, { status: 500 })
  }
}
