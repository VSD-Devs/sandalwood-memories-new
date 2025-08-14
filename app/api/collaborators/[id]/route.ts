import { type NextRequest, NextResponse } from "next/server"
import { removeCollaborator, updateCollaboratorRole } from "@/lib/invitations"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // In a real app, you'd validate permissions here
    const success = await removeCollaborator("memorial-id", params.id)

    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Failed to remove collaborator" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error removing collaborator:", error)
    return NextResponse.json({ error: "Failed to remove collaborator" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { role, memorial_id } = body

    // In a real app, you'd validate permissions here
    const success = await updateCollaboratorRole(memorial_id, params.id, role)

    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Failed to update role" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error updating collaborator role:", error)
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 })
  }
}
