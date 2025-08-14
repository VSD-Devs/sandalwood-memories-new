import { type NextRequest, NextResponse } from "next/server"
import { getCollaboratorsByMemorial } from "@/lib/invitations"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const memorial_id = searchParams.get("memorial_id")

    if (!memorial_id) {
      return NextResponse.json({ error: "Memorial ID required" }, { status: 400 })
    }

    const collaborators = await getCollaboratorsByMemorial(memorial_id)
    return NextResponse.json(collaborators)
  } catch (error) {
    console.error("Error fetching collaborators:", error)
    return NextResponse.json({ error: "Failed to fetch collaborators" }, { status: 500 })
  }
}
