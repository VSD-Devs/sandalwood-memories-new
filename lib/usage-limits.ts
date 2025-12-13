import { supabase } from "./database"
import { getUserSubscription } from "./subscription"

function hasSupabase() {
  return Boolean((process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY))
}

function nowIso() {
  return new Date().toISOString()
}

export interface UsageLimits {
  maxMemorials: number
  maxPhotosPerMemorial: number
  maxVideosPerMemorial: number
  maxVideoSizeMB: number
  maxTotalStorageMB: number
  maxTimelineEvents: number
}

export const PLAN_LIMITS: Record<string, UsageLimits> = {
  free: {
    maxMemorials: 1,
    maxPhotosPerMemorial: 3,
    maxVideosPerMemorial: 1,
    maxVideoSizeMB: 50,
    maxTotalStorageMB: 100,
    maxTimelineEvents: -1,
  },
  premium: {
    maxMemorials: -1,
    maxPhotosPerMemorial: 500,
    maxVideosPerMemorial: 50,
    maxVideoSizeMB: 2048,
    maxTotalStorageMB: -1,
    maxTimelineEvents: -1,
  },
  fully_managed: {
    maxMemorials: -1,
    maxPhotosPerMemorial: -1,
    maxVideosPerMemorial: -1,
    maxVideoSizeMB: -1,
    maxTotalStorageMB: -1,
    maxTimelineEvents: -1,
  },
}

export interface UserUsage {
  memorialCount: number
  totalStorageMB: number
  memorialUsage: Array<{
    memorial_id: number
    media_count: number
    photo_count: number
    video_count: number
    media_size_mb: number
    timeline_events: number
  }>
}

export async function getUserUsage(userId: string): Promise<UserUsage> {
  if (!hasSupabase()) {
    return { memorialCount: 0, totalStorageMB: 0, memorialUsage: [] }
  }

  let memorialCount = 0
  try {
    const { count, error } = await supabase
      .from("memorials")
      .select("id", { count: "exact", head: true })
      .eq("created_by", userId)
      .neq("status", "deleted")

    if (!error && typeof count === "number") {
      memorialCount = count
    }
  } catch (err) {
    console.warn("Failed to count memorials:", err)
  }

  let memorialUsage: UserUsage["memorialUsage"] = []

  try {
    const { data, error } = await supabase
      .from("memorial_usage")
      .select("memorial_id, media_count, photo_count, video_count, media_size_mb, timeline_events")
      .eq("user_id", userId)

    if (error && error.message?.includes("column") && error.message?.includes("does not exist")) {
      const fallback = await supabase
        .from("memorial_usage")
        .select("memorial_id, media_count, media_size_mb, timeline_events")
        .eq("user_id", userId)
      memorialUsage = (fallback.data || []).map((row: any) => ({
        memorial_id: row.memorial_id,
        media_count: row.media_count || 0,
        photo_count: 0,
        video_count: 0,
        media_size_mb: row.media_size_mb || 0,
        timeline_events: row.timeline_events || 0,
      }))
    } else if (error) {
      console.warn("Failed to read memorial usage:", error)
    } else {
      memorialUsage = (data || []).map((row: any) => ({
        memorial_id: row.memorial_id,
        media_count: row.media_count || 0,
        photo_count: row.photo_count || 0,
        video_count: row.video_count || 0,
        media_size_mb: row.media_size_mb || 0,
        timeline_events: row.timeline_events || 0,
      }))
    }
  } catch (err) {
    console.warn("Failed to read memorial usage:", err)
  }

  const totalStorageMB = memorialUsage.reduce((total, usage) => total + Number.parseFloat(String(usage.media_size_mb ?? "0")), 0)

  return { memorialCount, totalStorageMB, memorialUsage }
}

export async function checkUsageLimits(
  userId: string,
  action: string,
  data?: any,
): Promise<{ allowed: boolean; message?: string; upgradeRequired?: boolean }> {
  if (!hasSupabase()) {
    return { allowed: true }
  }

  const subscription = await getUserSubscription(userId)
  const planType = subscription?.plan_type || "free"
  const limits = PLAN_LIMITS[planType]
  const usage = await getUserUsage(userId)

  switch (action) {
    case "create_memorial":
      if (limits.maxMemorials !== -1 && usage.memorialCount >= limits.maxMemorials) {
        return {
          allowed: false,
          message: `Free plan allows only ${limits.maxMemorials} memorial. Upgrade to Premium for unlimited memorials.`,
          upgradeRequired: true,
        }
      }
      break

    case "upload_media": {
      const { files, memorialId } = data
      const memorialUsage = usage.memorialUsage.find((u) => u.memorial_id === memorialId)
      const currentPhotoCount = memorialUsage?.photo_count || 0
      const currentVideoCount = memorialUsage?.video_count || 0
      const currentStorageMB = memorialUsage?.media_size_mb || 0

      const photoFiles = files.filter((f: File) => f.type.startsWith("image/"))
      if (limits.maxPhotosPerMemorial !== -1 && currentPhotoCount + photoFiles.length > limits.maxPhotosPerMemorial) {
        return {
          allowed: false,
          message: `Free plan allows only ${limits.maxPhotosPerMemorial} photos per memorial. You currently have ${currentPhotoCount} and are trying to upload ${photoFiles.length} more. Upgrade to Premium for unlimited photos.`,
          upgradeRequired: true,
        }
      }

      const videoFiles = files.filter((f: File) => f.type.startsWith("video/"))
      if (limits.maxVideosPerMemorial !== -1 && currentVideoCount + videoFiles.length > limits.maxVideosPerMemorial) {
        return {
          allowed: false,
          message: `${planType === "free" ? "Free plan" : "Your plan"} allows only ${limits.maxVideosPerMemorial} video per memorial. You currently have ${currentVideoCount} and are trying to upload ${videoFiles.length} more. Upgrade to Premium for unlimited videos.`,
          upgradeRequired: planType === "free",
        }
      }

      if (planType === "free" && videoFiles.length > 0) {
        const videoFile = videoFiles[0]
        const videoSizeMB = videoFile.size / 1024 / 1024
        if (videoSizeMB > limits.maxVideoSizeMB) {
          return {
            allowed: false,
            message: `Free plan allows videos up to ${limits.maxVideoSizeMB}MB. Your video is ${Math.round(videoSizeMB)}MB. Upgrade to Premium for larger videos.`,
            upgradeRequired: true,
          }
        }
      }

      const newStorageMB = files.reduce((total: number, file: File) => total + file.size / 1024 / 1024, 0)
      if (limits.maxTotalStorageMB !== -1 && currentStorageMB + newStorageMB > limits.maxTotalStorageMB) {
        return {
          allowed: false,
          message: `Free plan allows only ${limits.maxTotalStorageMB}MB total storage. This upload would exceed your limit.`,
          upgradeRequired: true,
        }
      }
      break
    }

    case "add_timeline_event": {
      const memorialTimelineUsage = usage.memorialUsage.find((u) => u.memorial_id === data.memorialId)
      const currentEvents = memorialTimelineUsage?.timeline_events || 0

      if (limits.maxTimelineEvents !== -1 && currentEvents >= limits.maxTimelineEvents) {
        return {
          allowed: false,
          message: `Free plan allows only ${limits.maxTimelineEvents} timeline events per memorial. Upgrade to Premium for unlimited events.`,
          upgradeRequired: true,
        }
      }
      break
    }
  }

  return { allowed: true }
}

export async function updateMemorialUsage(
  userId: string,
  memorialId: string,
  updates: {
    mediaCount?: number
    photoCount?: number
    videoCount?: number
    mediaSizeMB?: number
    timelineEvents?: number
  },
) {
  if (!hasSupabase()) return

  const { mediaCount, photoCount, videoCount, mediaSizeMB, timelineEvents } = updates
  const basePayload: Record<string, any> = {
    user_id: userId,
    memorial_id: memorialId,
    updated_at: nowIso(),
  }

  if (mediaCount !== undefined) basePayload.media_count = mediaCount
  if (photoCount !== undefined) basePayload.photo_count = photoCount
  if (videoCount !== undefined) basePayload.video_count = videoCount
  if (mediaSizeMB !== undefined) basePayload.media_size_mb = mediaSizeMB
  if (timelineEvents !== undefined) basePayload.timeline_events = timelineEvents

  const existing = await supabase
    .from("memorial_usage")
    .select("id")
    .eq("memorial_id", memorialId)
    .eq("user_id", userId)
    .maybeSingle()

  const apply = async (payload: Record<string, any>) => {
    if (existing.data?.id) {
      return supabase.from("memorial_usage").update(payload).eq("id", existing.data.id)
    }
    return supabase.from("memorial_usage").insert(payload)
  }

  let result = await apply(basePayload)
  if (result.error && result.error.message?.includes("column") && result.error.message?.includes("does not exist")) {
    const fallbackPayload = { ...basePayload }
    delete fallbackPayload.photo_count
    delete fallbackPayload.video_count
    result = await apply(fallbackPayload)
  }

  if (result.error) {
    console.warn("Failed to update memorial usage:", result.error)
  }
}
