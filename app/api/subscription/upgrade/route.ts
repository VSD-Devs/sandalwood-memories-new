import { NextRequest, NextResponse } from "next/server"
import { upgradeToPremium } from "@/lib/subscription"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Upgrade to premium
    const subscription = await upgradeToPremium(userId)

    return NextResponse.json({
      success: true,
      subscription,
      message: "Successfully upgraded to Premium!"
    })

  } catch (error) {
    console.error("Upgrade error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
