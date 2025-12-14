import { NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { supabase } from "@/lib/database"
import sharp from "sharp"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const type = formData.get("type") as "image" | "video"
    const userId = formData.get("userId") as string
    const memorialId = formData.get("memorialId") as string

    if (!file || !type || !userId || !memorialId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate file
    const maxSize = 500 * 1024 * 1024 // 500MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size must be less than 500MB" },
        { status: 400 }
      )
    }

    const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    const allowedVideoTypes = ["video/mp4", "video/webm", "video/quicktime"]

    if (type === "image" && !allowedImageTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported image format" },
        { status: 400 }
      )
    }

    if (type === "video" && !allowedVideoTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported video format" },
        { status: 400 }
      )
    }

    let processedFile: {
      file_url: string
      file_type: string
      original_filename: string
      file_size: number
      thumbnail_url?: string
      duration?: number
    }

    if (type === "image") {
      processedFile = await processImage(file)
    } else {
      processedFile = await processVideo(file)
    }

    // Store in database
    const { data, error } = await supabase
      .from("memorial_media")
      .insert({
        memorial_id: memorialId,
        file_url: processedFile.file_url,
        file_type: processedFile.file_type,
        original_filename: processedFile.original_filename,
        file_size: processedFile.file_size,
        uploaded_by: userId,
        thumbnail_url: processedFile.thumbnail_url,
        duration: processedFile.duration,
      })
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        { error: "Failed to save media" },
        { status: 500 }
      )
    }

    return NextResponse.json({ item: data })
  } catch (error) {
    console.error("Media processing error:", error)
    return NextResponse.json(
      { error: "Failed to process media" },
      { status: 500 }
    )
  }
}

async function processImage(file: File): Promise<{
  file_url: string
  file_type: string
  original_filename: string
  file_size: number
}> {
  // Convert file to buffer
  const buffer = Buffer.from(await file.arrayBuffer())

  // Process with Sharp for optimization
  const optimizedBuffer = await sharp(buffer)
    .resize(1920, 1080, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: 85 })
    .toBuffer()

  // Upload to blob storage
  const filename = `optimized-${Date.now()}-${file.name}`
  const blob = await put(filename, optimizedBuffer, {
    access: "public",
  })

  return {
    file_url: blob.url,
    file_type: "image",
    original_filename: file.name,
    file_size: optimizedBuffer.length,
  }
}

async function processVideo(file: File): Promise<{
  file_url: string
  file_type: string
  original_filename: string
  file_size: number
  thumbnail_url?: string
  duration?: number
}> {
  // For now, just upload the video as-is
  // In production, you'd use FFmpeg to compress
  const buffer = Buffer.from(await file.arrayBuffer())
  const filename = `video-${Date.now()}-${file.name}`
  const blob = await put(filename, buffer, {
    access: "public",
  })

  // Generate thumbnail (simplified - in production use FFmpeg)
  // For now, we'll skip thumbnail generation on server
  return {
    file_url: blob.url,
    file_type: "video",
    original_filename: file.name,
    file_size: file.size,
  }
}
