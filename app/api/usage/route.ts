import { NextRequest, NextResponse } from "next/server"
import { getUserSubscription } from "@/lib/subscription"
import { getUserUsage } from "@/lib/usage-limits"
import { getAuthenticatedUser } from "@/lib/auth-helpers"
import { supabase } from "@/lib/database"

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

    // For more accurate real-time data, also get fresh media counts
    // This ensures the usage indicator shows current state
    try {
      const { data: memorials } = await supabase
        .from("memorials")
        .select("id")
        .eq("created_by", userId)
        .neq("status", "deleted")

      if (memorials && memorials.length > 0) {
        const memorialIds = memorials.map(m => m.id)

        // Get real-time counts for all user's memorials
        const { data: mediaCounts } = await supabase
          .from("media")
          .select("memorial_id, file_type")
          .in("memorial_id", memorialIds)

        // Update usage data with real-time counts
        const realTimeUsage = usage.memorialUsage.map(memorialUsage => {
          const memorialMedia = mediaCounts?.filter(m => m.memorial_id === memorialUsage.memorial_id) || []
          return {
            ...memorialUsage,
            media_count: memorialMedia.length,
            photo_count: memorialMedia.filter(m => m.file_type === "image").length,
            video_count: memorialMedia.filter(m => m.file_type === "video").length,
          }
        })

        usage.memorialUsage = realTimeUsage
      }
    } catch (error) {
      console.warn("Failed to get real-time media counts:", error)
      // Fall back to usage table data
    }

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
