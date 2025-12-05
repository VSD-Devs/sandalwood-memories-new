import { NextRequest, NextResponse } from "next/server"
import { getUserSubscription } from "@/lib/subscription"
import { getUserUsage } from "@/lib/usage-limits"
import { getAuthenticatedUser } from "@/lib/auth-helpers"

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = user.id

    // Get user subscription and usage
    const [subscription, usage] = await Promise.all([
      getUserSubscription(userId),
      getUserUsage(userId)
    ])

    return NextResponse.json({
      planType: subscription?.plan_type || "free",
      status: subscription?.status || "active",
      usage
    })
  } catch (error) {
    console.error("Failed to fetch usage data:", error)
    return NextResponse.json(
      { error: "Failed to fetch usage data" },
      { status: 500 }
    )
  }
}
