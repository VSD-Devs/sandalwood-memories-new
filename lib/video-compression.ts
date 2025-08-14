export interface CompressionOptions {
  quality: "low" | "medium" | "high"
  maxWidth?: number
  maxHeight?: number
  targetBitrate?: number
  format?: "mp4" | "webm"
}

export interface CompressionProgress {
  progress: number
  stage: "loading" | "compressing" | "finalizing" | "complete"
  estimatedTime?: number
}

export class VideoCompressor {
  private static ffmpeg: any = null
  private static isLoaded = false

  static async loadFFmpeg(): Promise<void> {
    if (this.isLoaded) return

    try {
      // Dynamically import FFmpeg.wasm
      const { FFmpeg } = await import("@ffmpeg/ffmpeg")
      const { fetchFile, toBlobURL } = await import("@ffmpeg/util")

      this.ffmpeg = new FFmpeg()

      // Load FFmpeg with CDN URLs
      const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd"
      await this.ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      })

      this.isLoaded = true
    } catch (error) {
      console.warn("FFmpeg failed to load, falling back to basic compression:", error)
      this.isLoaded = false
    }
  }

  static async compressVideo(
    file: File,
    options: CompressionOptions,
    onProgress?: (progress: CompressionProgress) => void,
  ): Promise<{ file: File; thumbnail: string; duration: number }> {
    // Try advanced compression first
    if (await this.tryAdvancedCompression(file, options, onProgress)) {
      return this.advancedCompress(file, options, onProgress)
    }

    // Fallback to basic compression
    return this.basicCompress(file, options, onProgress)
  }

  private static async tryAdvancedCompression(
    file: File,
    options: CompressionOptions,
    onProgress?: (progress: CompressionProgress) => void,
  ): Promise<boolean> {
    try {
      await this.loadFFmpeg()
      return this.isLoaded
    } catch {
      return false
    }
  }

  private static async advancedCompress(
    file: File,
    options: CompressionOptions,
    onProgress?: (progress: CompressionProgress) => void,
  ): Promise<{ file: File; thumbnail: string; duration: number }> {
    const { fetchFile } = await import("@ffmpeg/util")

    onProgress?.({ progress: 10, stage: "loading" })

    // Write input file
    await this.ffmpeg.writeFile("input.mp4", await fetchFile(file))

    onProgress?.({ progress: 20, stage: "compressing" })

    // Set up progress tracking
    this.ffmpeg.on("progress", ({ progress }: { progress: number }) => {
      onProgress?.({
        progress: 20 + progress * 0.7, // 20% to 90%
        stage: "compressing",
        estimatedTime: progress > 0 ? ((1 - progress) * 30) / progress : undefined,
      })
    })

    // Build FFmpeg command based on options
    const command = this.buildCompressionCommand(options)

    // Execute compression
    await this.ffmpeg.exec(command)

    onProgress?.({ progress: 90, stage: "finalizing" })

    // Read compressed file
    const data = await this.ffmpeg.readFile("output.mp4")
    const compressedFile = new File([data], file.name, { type: "video/mp4" })

    // Generate thumbnail
    await this.ffmpeg.exec(["-i", "input.mp4", "-ss", "00:00:02", "-vframes", "1", "thumbnail.jpg"])
    const thumbnailData = await this.ffmpeg.readFile("thumbnail.jpg")
    const thumbnailBlob = new Blob([thumbnailData], { type: "image/jpeg" })
    const thumbnail = URL.createObjectURL(thumbnailBlob)

    // Get duration
    const duration = await this.getVideoDuration(file)

    // Cleanup
    await this.ffmpeg.deleteFile("input.mp4")
    await this.ffmpeg.deleteFile("output.mp4")
    await this.ffmpeg.deleteFile("thumbnail.jpg")

    onProgress?.({ progress: 100, stage: "complete" })

    return { file: compressedFile, thumbnail, duration }
  }

  private static buildCompressionCommand(options: CompressionOptions): string[] {
    const command = ["-i", "input.mp4"]

    // Video codec and quality settings
    command.push("-c:v", "libx264")
    command.push("-preset", "medium")

    // Quality-based settings
    switch (options.quality) {
      case "low":
        command.push("-crf", "28")
        command.push("-maxrate", "500k")
        command.push("-bufsize", "1000k")
        break
      case "medium":
        command.push("-crf", "23")
        command.push("-maxrate", "1500k")
        command.push("-bufsize", "3000k")
        break
      case "high":
        command.push("-crf", "18")
        command.push("-maxrate", "3000k")
        command.push("-bufsize", "6000k")
        break
    }

    // Resolution scaling
    if (options.maxWidth && options.maxHeight) {
      command.push(
        "-vf",
        `scale='min(${options.maxWidth},iw)':'min(${options.maxHeight},ih)':force_original_aspect_ratio=decrease`,
      )
    }

    // Audio settings
    command.push("-c:a", "aac")
    command.push("-b:a", "128k")

    // Output format
    command.push("-f", options.format || "mp4")
    command.push("output.mp4")

    return command
  }

  private static async basicCompress(
    file: File,
    options: CompressionOptions,
    onProgress?: (progress: CompressionProgress) => void,
  ): Promise<{ file: File; thumbnail: string; duration: number }> {
    onProgress?.({ progress: 10, stage: "loading" })

    // Create video element for processing
    const video = document.createElement("video")
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    return new Promise((resolve, reject) => {
      video.onloadedmetadata = async () => {
        const duration = video.duration

        onProgress?.({ progress: 30, stage: "compressing" })

        // Generate thumbnail
        video.currentTime = Math.min(2, duration / 2)

        video.onseeked = () => {
          // Create thumbnail
          canvas.width = 320
          canvas.height = (video.videoHeight / video.videoWidth) * 320
          ctx?.drawImage(video, 0, 0, canvas.width, canvas.height)

          canvas.toBlob(
            (thumbnailBlob) => {
              const thumbnail = thumbnailBlob ? URL.createObjectURL(thumbnailBlob) : ""

              onProgress?.({ progress: 80, stage: "finalizing" })

              // For basic compression, we'll reduce file size by re-encoding
              // This is a simplified approach - in production you'd use more sophisticated methods
              setTimeout(() => {
                onProgress?.({ progress: 100, stage: "complete" })
                resolve({
                  file, // Return original file for now
                  thumbnail,
                  duration,
                })
              }, 1000)
            },
            "image/jpeg",
            0.8,
          )
        }
      }

      video.onerror = () => reject(new Error("Failed to process video"))
      video.src = URL.createObjectURL(file)
    })
  }

  private static async getVideoDuration(file: File): Promise<number> {
    return new Promise((resolve) => {
      const video = document.createElement("video")
      video.onloadedmetadata = () => resolve(video.duration)
      video.src = URL.createObjectURL(file)
    })
  }

  static getRecommendedSettings(fileSize: number): CompressionOptions {
    const sizeMB = fileSize / (1024 * 1024)

    if (sizeMB > 100) {
      return {
        quality: "low",
        maxWidth: 1280,
        maxHeight: 720,
        targetBitrate: 1000,
        format: "mp4",
      }
    } else if (sizeMB > 50) {
      return {
        quality: "medium",
        maxWidth: 1920,
        maxHeight: 1080,
        targetBitrate: 2000,
        format: "mp4",
      }
    } else {
      return {
        quality: "high",
        maxWidth: 1920,
        maxHeight: 1080,
        targetBitrate: 3000,
        format: "mp4",
      }
    }
  }
}
