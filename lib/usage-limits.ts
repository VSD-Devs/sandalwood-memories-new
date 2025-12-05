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
    maxVideoSizeMB: 50, // 50MB per video for free users
    maxTotalStorageMB: 100, // Increased storage for videos
    maxTimelineEvents: -1, // Unlimited timeline events
  },
  premium: {
    maxMemorials: -1, // Unlimited
    maxPhotosPerMemorial: 500,
    maxVideosPerMemorial: 50, // 50 videos per memorial
    maxVideoSizeMB: 2048, // 2GB per memorial
    maxTotalStorageMB: -1, // Unlimited
    maxTimelineEvents: -1, // Unlimited
  },
  fully_managed: {
    maxMemorials: -1, // Unlimited
    maxPhotosPerMemorial: -1, // Unlimited
    maxVideosPerMemorial: -1, // Unlimited
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
    photo_count: number
    video_count: number
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

  // Get memorial count (exclude deleted memorials, check both created_by and owner_user_id)
  const sql = getSql()!
  const memorialCountResult = await sql`
    SELECT COUNT(*) as count 
    FROM memorials 
    WHERE (created_by = ${userId} OR owner_user_id = ${userId})
    AND (status IS NULL OR status != 'deleted')
  `
  const memorialCount = Number.parseInt(memorialCountResult[0]?.count || "0")

  // Get usage per memorial (handle missing photo_count/video_count columns gracefully)
  let memorialUsageResult: Array<{ memorial_id: number; media_count: number; photo_count: number; video_count: number; media_size_mb: number; timeline_events: number }>
  
  try {
    // Try to query with photo_count and video_count columns
    memorialUsageResult = (await sql`
      SELECT 
        memorial_id,
        media_count,
        COALESCE(photo_count, 0) as photo_count,
        COALESCE(video_count, 0) as video_count,
        media_size_mb,
        timeline_events
      FROM memorial_usage 
      WHERE user_id = ${userId}
    `) as Array<{ memorial_id: number; media_count: number; photo_count: number; video_count: number; media_size_mb: number; timeline_events: number }>
  } catch (error: any) {
    // If columns don't exist, query without them and set defaults
    if (error?.code === '42703' || error?.message?.includes('does not exist')) {
      const result = await sql`
        SELECT 
          memorial_id,
          media_count,
          media_size_mb,
          timeline_events
        FROM memorial_usage 
        WHERE user_id = ${userId}
      `
      memorialUsageResult = result.map((row: any) => ({
        memorial_id: row.memorial_id,
        media_count: row.media_count || 0,
        photo_count: 0, // Default to 0 if column doesn't exist
        video_count: 0, // Default to 0 if column doesn't exist
        media_size_mb: row.media_size_mb || 0,
        timeline_events: row.timeline_events || 0,
      }))
    } else {
      throw error
    }
  }

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
      const currentPhotoCount = memorialUsage?.photo_count || 0
      const currentVideoCount = memorialUsage?.video_count || 0
      const currentStorageMB = memorialUsage?.media_size_mb || 0

      // Check photo count limit
      const photoFiles = files.filter((f: File) => f.type.startsWith("image/"))
      if (limits.maxPhotosPerMemorial !== -1 && currentPhotoCount + photoFiles.length > limits.maxPhotosPerMemorial) {
        return {
          allowed: false,
          message: `Free plan allows only ${limits.maxPhotosPerMemorial} photos per memorial. You currently have ${currentPhotoCount} and are trying to upload ${photoFiles.length} more. Upgrade to Premium for unlimited photos.`,
          upgradeRequired: true,
        }
      }

      // Check video count limit
      const videoFiles = files.filter((f: File) => f.type.startsWith("video/"))
      if (limits.maxVideosPerMemorial !== -1 && currentVideoCount + videoFiles.length > limits.maxVideosPerMemorial) {
        return {
          allowed: false,
          message: `${planType === "free" ? "Free plan" : "Your plan"} allows only ${limits.maxVideosPerMemorial} video per memorial. You currently have ${currentVideoCount} and are trying to upload ${videoFiles.length} more. Upgrade to Premium for unlimited videos.`,
          upgradeRequired: planType === "free",
        }
      }

      // Check video file size for free plan
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
    photoCount?: number
    videoCount?: number
    mediaSizeMB?: number
    timelineEvents?: number
  },
) {
  if (!isDatabaseAvailable()) {
    return
  }

  const { mediaCount, photoCount, videoCount, mediaSizeMB, timelineEvents } = updates

  const sql = getSql()!
  
  // Try to update with photo_count and video_count, fall back to basic columns if they don't exist
  try {
    await sql`
      INSERT INTO memorial_usage (user_id, memorial_id, media_count, photo_count, video_count, media_size_mb, timeline_events, updated_at)
      VALUES (${userId}, ${memorialId}, ${mediaCount || 0}, ${photoCount || 0}, ${videoCount || 0}, ${mediaSizeMB || 0}, ${timelineEvents || 0}, NOW())
      ON CONFLICT (memorial_id)
      DO UPDATE SET
        media_count = COALESCE(${mediaCount}, memorial_usage.media_count),
        photo_count = COALESCE(${photoCount}, memorial_usage.photo_count),
        video_count = COALESCE(${videoCount}, memorial_usage.video_count),
        media_size_mb = COALESCE(${mediaSizeMB}, memorial_usage.media_size_mb),
        timeline_events = COALESCE(${timelineEvents}, memorial_usage.timeline_events),
        updated_at = NOW()
    `
  } catch (error: any) {
    // If photo_count/video_count columns don't exist, use basic update
    if (error?.code === '42703' || error?.message?.includes('does not exist')) {
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
    } else {
      throw error
    }
  }
}
