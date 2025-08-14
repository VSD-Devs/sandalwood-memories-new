import { toast } from "@/hooks/use-toast"

export interface ProcessedFile {
  id: string
  name: string
  type: string
  size: number
  url: string
  thumbnail?: string
  duration?: number
  compressed?: boolean
  dataUrl?: string
}

export class MediaProcessor {
  static async processImage(file: File): Promise<ProcessedFile> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      const img = new Image()

      img.onload = () => {
        // Calculate dimensions for compression (max 1920x1080)
        const maxWidth = 1920
        const maxHeight = 1080
        let { width, height } = img

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width *= ratio
          height *= ratio
        }

        canvas.width = width
        canvas.height = height

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height)

        const dataUrl = canvas.toDataURL("image/jpeg", 0.85)
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to compress image"))
              return
            }

            const url = URL.createObjectURL(blob)
            resolve({
              id: crypto.randomUUID(),
              name: file.name,
              type: file.type,
              size: blob.size,
              url,
              dataUrl,
              compressed: blob.size < file.size,
            })
          },
          "image/jpeg",
          0.85,
        )
      }

      img.onerror = () => reject(new Error("Failed to load image"))
      img.src = URL.createObjectURL(file)
    })
  }

  static async processVideo(file: File): Promise<ProcessedFile> {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video")
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")

      video.onloadedmetadata = () => {
        const duration = video.duration

        // Create thumbnail at 2 seconds or middle of video
        video.currentTime = Math.min(2, duration / 2)

        video.onseeked = () => {
          // Generate thumbnail
          canvas.width = 320
          canvas.height = (video.videoHeight / video.videoWidth) * 320
          ctx?.drawImage(video, 0, 0, canvas.width, canvas.height)

          canvas.toBlob(
            (thumbnailBlob) => {
              const thumbnailUrl = thumbnailBlob ? URL.createObjectURL(thumbnailBlob) : undefined

              // For now, we'll use the original video file
              // In production, you'd compress the video here
              const url = URL.createObjectURL(file)

              resolve({
                id: crypto.randomUUID(),
                name: file.name,
                type: file.type,
                size: file.size,
                url,
                thumbnail: thumbnailUrl,
                duration,
                compressed: false, // Would be true after actual compression
              })
            },
            "image/jpeg",
            0.8,
          )
        }
      }

      video.onerror = () => reject(new Error("Failed to load video"))
      video.src = URL.createObjectURL(file)
    })
  }

  static async compressVideo(file: File, quality: "low" | "medium" | "high" = "medium"): Promise<ProcessedFile> {
    // This is a simplified version - in production you'd use FFmpeg.wasm or similar
    toast({
      title: "Video Compression",
      description: "Video compression is processing in the background...",
    })

    // Simulate compression delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    return this.processVideo(file)
  }

  static validateFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 100 * 1024 * 1024 // 100MB
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "video/mp4",
      "video/webm",
      "video/quicktime",
    ]

    if (file.size > maxSize) {
      return { valid: false, error: "File size must be less than 100MB" }
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: "File type not supported" }
    }

    return { valid: true }
  }
}
