import { neon } from "@neondatabase/serverless"
import { getUserSubscription } from "./subscription"

function getSql() {
  const candidates = [process.env.DATABASE_URL, process.env.POSTGRES_URL, process.env.DATABASE_URL_UNPOOLED]
  let url = candidates.find((v) => typeof v === "string" && v.trim().length > 0)
  if (!url) return null
  url = url.trim()
  if (url.startsWith("postgres://")) {
    url = url.replace("postgres://", "postgresql://")
  }
  return neon(url)
}

function isDatabaseAvailable(): boolean {
  return Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL_UNPOOLED)
}

export interface UsageLimits {
  maxMemorials: number
  maxPhotosPerMemorial: number
  maxVideoSizeMB: number
  maxTotalStorageMB: number
  maxTimelineEvents: number
}

export const PLAN_LIMITS: Record<string, UsageLimits> = {
  free: {
    maxMemorials: 1,
    maxPhotosPerMemorial: 10,
    maxVideoSizeMB: 0, // No videos for free
    maxTotalStorageMB: 10,
    maxTimelineEvents: 5,
  },
  premium: {
    maxMemorials: -1, // Unlimited
    maxPhotosPerMemorial: 500,
    maxVideoSizeMB: 2048, // 2GB per memorial
    maxTotalStorageMB: -1, // Unlimited
    maxTimelineEvents: -1, // Unlimited
  },
  fully_managed: {
    maxMemorials: -1, // Unlimited
    maxPhotosPerMemorial: -1, // Unlimited
    maxVideoSizeMB: -1, // Unlimited
    maxTotalStorageMB: -1, // Unlimited
    maxTimelineEvents: -1, // Unlimited
  },
}

export interface UserUsage {
  memorialCount: number
  totalStorageMB: number
  memorialUsage: Array<{
    memorial_id: number
    media_count: number
    media_size_mb: number
    timeline_events: number
  }>
}

export async function getUserUsage(userId: string): Promise<UserUsage> {
  if (!isDatabaseAvailable()) {
    return {
      memorialCount: 0,
      totalStorageMB: 0,
      memorialUsage: [],
    }
  }

  // Get memorial count
  const sql = getSql()!
  const memorialCountResult = await sql`
    SELECT COUNT(*) as count FROM memorials WHERE created_by = ${userId}
  `
  const memorialCount = Number.parseInt(memorialCountResult[0]?.count || "0")

  // Get usage per memorial
  const memorialUsageResult = (await sql`
    SELECT 
      memorial_id,
      media_count,
      media_size_mb,
      timeline_events
    FROM memorial_usage 
    WHERE user_id = ${userId}
  `) as Array<{ memorial_id: number; media_count: number; media_size_mb: number; timeline_events: number }>

  // Calculate total storage
  const totalStorageMB = memorialUsageResult.reduce(
    (total, usage) => total + Number.parseFloat(String(usage.media_size_mb ?? "0")),
    0,
  )

  return {
    memorialCount,
    totalStorageMB,
    memorialUsage: memorialUsageResult,
  }
}

export async function checkUsageLimits(
  userId: string,
  action: string,
  data?: any,
): Promise<{
  allowed: boolean
  message?: string
  upgradeRequired?: boolean
}> {
  if (!isDatabaseAvailable()) {
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

    case "upload_media":
      const { files, memorialId } = data
      const memorialUsage = usage.memorialUsage.find((u) => u.memorial_id === memorialId)
      const currentMediaCount = memorialUsage?.media_count || 0
      const currentStorageMB = memorialUsage?.media_size_mb || 0

      // Check photo count limit
      const photoFiles = files.filter((f: File) => f.type.startsWith("image/"))
      if (limits.maxPhotosPerMemorial !== -1 && currentMediaCount + photoFiles.length > limits.maxPhotosPerMemorial) {
        return {
          allowed: false,
          message: `Free plan allows only ${limits.maxPhotosPerMemorial} photos per memorial. You're trying to upload ${photoFiles.length} more photos.`,
          upgradeRequired: true,
        }
      }

      // Check video uploads for free plan
      const videoFiles = files.filter((f: File) => f.type.startsWith("video/"))
      if (planType === "free" && videoFiles.length > 0) {
        return {
          allowed: false,
          message: "Video uploads are not available on the free plan. Upgrade to Premium to upload videos.",
          upgradeRequired: true,
        }
      }

      // Check total storage limit
      const newStorageMB = files.reduce((total: number, file: File) => total + file.size / 1024 / 1024, 0)
      if (limits.maxTotalStorageMB !== -1 && usage.totalStorageMB + newStorageMB > limits.maxTotalStorageMB) {
        return {
          allowed: false,
          message: `Free plan allows only ${limits.maxTotalStorageMB}MB total storage. This upload would exceed your limit.`,
          upgradeRequired: true,
        }
      }
      break

    case "add_timeline_event":
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

  return { allowed: true }
}

export async function updateMemorialUsage(
  userId: string,
  memorialId: number,
  updates: {
    mediaCount?: number
    mediaSizeMB?: number
    timelineEvents?: number
  },
) {
  if (!isDatabaseAvailable()) {
    return
  }

  const { mediaCount, mediaSizeMB, timelineEvents } = updates

  const sql = getSql()!
  await sql`
    INSERT INTO memorial_usage (user_id, memorial_id, media_count, media_size_mb, timeline_events, updated_at)
    VALUES (${userId}, ${memorialId}, ${mediaCount || 0}, ${mediaSizeMB || 0}, ${timelineEvents || 0}, NOW())
    ON CONFLICT (memorial_id)
    DO UPDATE SET
      media_count = COALESCE(${mediaCount}, memorial_usage.media_count),
      media_size_mb = COALESCE(${mediaSizeMB}, memorial_usage.media_size_mb),
      timeline_events = COALESCE(${timelineEvents}, memorial_usage.timeline_events),
      updated_at = NOW()
  `
}
