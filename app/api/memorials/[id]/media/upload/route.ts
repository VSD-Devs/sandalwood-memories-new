import { NextResponse, type NextRequest } from "next/server"
import { put } from "@vercel/blob"
import { getAuthenticatedUser } from "@/lib/auth-helpers"
import { getMemorialAccess } from "@/lib/memorial-access"

// Enhanced server-side validation with type-specific size limits
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg", 
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/avi",
  "application/pdf",
])

// Size limits in bytes - matching frontend limits
const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB for images
const MAX_VIDEO_SIZE = 500 * 1024 * 1024 // 500MB for videos  
const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024 // 5MB for documents

function getMaxFileSize(fileType: string): number {
  if (fileType.startsWith('image/')) return MAX_IMAGE_SIZE
  if (fileType.startsWith('video/')) return MAX_VIDEO_SIZE
  return MAX_DOCUMENT_SIZE
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const access = await getMemorialAccess(id, user.id)
    if (!access) {
      return NextResponse.json({ error: "Memorial not found" }, { status: 404 })
    }

    if (!access.isOwner && !access.isCollaborator) {
      return NextResponse.json({ error: "You do not have permission to upload media" }, { status: 403 })
    }
    
    // Validate memorial ID format
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return NextResponse.json({ error: "Invalid memorial ID" }, { status: 400 })
    }

    const form = await request.formData()
    
    // Accept either multiple entries named "file" or a single "files"
    const entries = ([] as File[])
      .concat((form.getAll("file") as File[]) || [])
      .concat((form.getAll("files") as File[]) || [])
    
    // Sanitize and validate metadata
    const uploader = String(form.get("uploaded_by") || "").trim() || null
    const title = String(form.get("title") || "").trim() || null
    const description = String(form.get("description") || "").trim() || null

    // Validate title length if provided
    if (title && title.length > 200) {
      return NextResponse.json({ error: "Title too long (max 200 characters)" }, { status: 400 })
    }
    
    // Validate description length if provided
    if (description && description.length > 1000) {
      return NextResponse.json({ error: "Description too long (max 1000 characters)" }, { status: 400 })
    }

    const files = entries.filter((v): v is File => typeof v === "object" && typeof (v as any).arrayBuffer === "function")
    if (files.length === 0) return NextResponse.json({ error: "No files provided" }, { status: 400 })

    // Enhanced file validation
    for (const f of files) {
      if (!ALLOWED_TYPES.has(f.type)) {
        return NextResponse.json({ 
          error: `Unsupported file type: ${f.type}. Supported types: images, videos, PDFs` 
        }, { status: 400 })
      }
      
      const maxSize = getMaxFileSize(f.type)
      if (typeof f.size === "number" && f.size > maxSize) {
        const maxSizeMB = Math.round(maxSize / (1024 * 1024))
        const fileSizeMB = Math.round(f.size / (1024 * 1024))
        return NextResponse.json({ 
          error: `File "${f.name}" is too large (${fileSizeMB}MB). Maximum size for ${f.type.split('/')[0]}s: ${maxSizeMB}MB` 
        }, { status: 400 })
      }
    }

    // Upload to Blob storage (public)
    const uploaded = await Promise.all(
      files.map(async (file, index) => {
        try {
          // Create a safe filename with timestamp and index
          const timestamp = Date.now()
          const fileExtension = file.name.split('.').pop() || ''
          const safeName = file.name
            .replace(/[^a-zA-Z0-9._-]/g, "_")
            .substring(0, 100) // Limit filename length
          const keyBase = `${timestamp}-${index}-${safeName}`
          
          const blob = await put(`memorials/${id}/${keyBase}` as `${string}/${string}` as any, file, {
            access: "public",
            addRandomSuffix: true,
          })
          
          return {
            success: true,
            file_url: blob.url,
            file_type: file.type.startsWith("video/")
              ? "video"
              : file.type === "application/pdf"
              ? "document"
              : "image",
            title: title || file.name,
            description,
            uploaded_by: uploader,
            original_filename: file.name,
            file_size: file.size,
          }
        } catch (e) {
          console.error("Blob upload failed for file:", file.name, e)
          
          // Check if we have Vercel Blob configuration
          const hasVercelBlob = process.env.BLOB_READ_WRITE_TOKEN
          
          if (!hasVercelBlob) {
            // Development fallback - return a placeholder data URL for images only
            if (file.type.startsWith('image/')) {
              try {
                const buf = Buffer.from(await file.arrayBuffer())
                if (buf.length > 1024 * 1024) { // Don't create data URLs for files > 1MB
                  throw new Error('File too large for fallback storage')
                }
                const dataUrl = `data:${file.type};base64,${buf.toString("base64")}`
                return {
                  success: true,
                  file_url: dataUrl,
                  file_type: "image",
                  title: title || file.name,
                  description,
                  uploaded_by: uploader,
                  original_filename: file.name,
                  file_size: file.size,
                  warning: "Using data URL fallback (no Blob storage configured)",
                }
              } catch (fallbackError) {
                console.error('Fallback failed:', fallbackError)
              }
            }
          }
          
          // Return error for this file
          return {
            success: false,
            error: `Failed to upload ${file.name}: ${e instanceof Error ? e.message : 'Unknown error'}`,
            file_name: file.name,
          }
        }
      })
    )

    // Separate successful uploads from failures
    const successful = uploaded.filter(item => item.success)
    const failed = uploaded.filter(item => !item.success)
    
    // Return response with success/failure details
    const response: any = {
      items: successful,
      uploaded_count: successful.length,
      total_count: files.length,
    }
    
    if (failed.length > 0) {
      response.errors = failed.map(item => ({
        file_name: item.file_name,
        error: item.error
      }))
      response.partial_success = true
    }
    
    // If no files succeeded, return an error status
    if (successful.length === 0) {
      return NextResponse.json({
        error: "All uploads failed",
        details: response.errors
      }, { status: 400 })
    }
    
    return NextResponse.json(response, { 
      status: failed.length > 0 ? 207 : 200 // 207 Multi-Status for partial success
    })
  } catch (err) {
    console.error("Upload error:", err)
    return NextResponse.json({ 
      error: "Failed to upload media", 
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 })
  }
}


