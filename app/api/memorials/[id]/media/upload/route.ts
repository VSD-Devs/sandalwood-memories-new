import { NextResponse, type NextRequest } from "next/server"
import { put } from "@vercel/blob"

// Basic server-side validation aligned with client validator
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime",
])
const MAX_SIZE_BYTES = 100 * 1024 * 1024 // 100MB per file

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const form = await request.formData()
    // Accept either multiple entries named "file" or a single "files"
    const entries = ([] as File[])
      .concat((form.getAll("file") as File[]) || [])
      .concat((form.getAll("files") as File[]) || [])
    const uploader = String(form.get("uploaded_by") || "") || null
    const title = String(form.get("title") || "") || null
    const description = String(form.get("description") || "") || null

    const files = entries.filter((v): v is File => typeof v === "object" && typeof (v as any).arrayBuffer === "function")
    if (files.length === 0) return NextResponse.json({ error: "No files provided" }, { status: 400 })

    // Validate files
    for (const f of files) {
      if (!ALLOWED_TYPES.has(f.type)) return NextResponse.json({ error: `Unsupported type: ${f.type}` }, { status: 400 })
      if (typeof f.size === "number" && f.size > MAX_SIZE_BYTES) return NextResponse.json({ error: "File too large" }, { status: 400 })
    }

    // Upload to Blob storage (public)
    const uploaded = await Promise.all(
      files.map(async (file) => {
        try {
          const keyBase = `${Date.now()}-${file.name}`.replace(/[^a-zA-Z0-9._-]/g, "_")
          const blob = await put(`memorials/${id}/${keyBase}` as `${string}/${string}` as any, file, {
            access: "public",
            addRandomSuffix: true,
          })
          return {
            success: true,
            file_url: blob.url,
            file_type: file.type.startsWith("video/") ? "video" : "image",
            title,
            description,
            uploaded_by: uploader,
          }
        } catch (e) {
          console.error("Blob upload failed", e)
          // As a last-resort fallback (local dev without Blob), return a data URL
          const buf = Buffer.from(await file.arrayBuffer())
          const dataUrl = `data:${file.type};base64,${buf.toString("base64")}`
          return {
            success: true,
            file_url: dataUrl,
            file_type: file.type.startsWith("video/") ? "video" : "image",
            title,
            description,
            uploaded_by: uploader,
            warning: "Using data URL fallback (no Blob storage configured)",
          }
        }
      })
    )

    return NextResponse.json({ items: uploaded })
  } catch (err) {
    console.error("Upload error:", err)
    return NextResponse.json({ error: "Failed to upload media" }, { status: 500 })
  }
}


