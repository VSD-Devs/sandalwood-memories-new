"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, X, ImageIcon, Video, Plus, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { checkUsageLimits } from "@/lib/usage-limits"
import UsageLimitModal from "./usage-limit-modal"
import { toast } from "sonner"

// File size limits in bytes
const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB for images
const MAX_VIDEO_SIZE = 500 * 1024 * 1024 // 500MB for videos
const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024 // 5MB for documents

interface FileUploadProgress {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
  result?: any
}

interface MediaUploadProps {
  onUpload?: (uploadedFiles: any[]) => void
  maxFiles?: number
  acceptedTypes?: string[]
  memorialId?: string | number
  triggerLabel?: string
  helperText?: string
}

export default function MediaUpload({
  onUpload,
  maxFiles = 10,
  acceptedTypes = ["image/*", "video/*", "application/pdf"],
  memorialId,
  triggerLabel,
  helperText,
}: MediaUploadProps) {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [limitModal, setLimitModal] = useState<{
    isOpen: boolean
    message: string
    upgradeRequired: boolean
  }>({
    isOpen: false,
    message: "",
    upgradeRequired: false,
  })
  const [uploadData, setUploadData] = useState({
    title: "",
    description: "",
    date: "",
  })
  
  const [videoUrl, setVideoUrl] = useState("")
  const [showUrlInput, setShowUrlInput] = useState(false)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  // Enhanced file validation
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file type
    const isValidType = acceptedTypes.some((type) => 
      file.type.match(type.replace("*", ".*"))
    )
    if (!isValidType) {
      return { valid: false, error: `Unsupported file type: ${file.type}` }
    }

    // Check file size based on type
    let maxSize = MAX_DOCUMENT_SIZE
    if (file.type.startsWith('image/')) {
      maxSize = MAX_IMAGE_SIZE
    } else if (file.type.startsWith('video/')) {
      maxSize = MAX_VIDEO_SIZE
    }

    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024))
      const fileSizeMB = Math.round(file.size / (1024 * 1024))
      
      if (file.type.startsWith('video/')) {
        return { 
          valid: false, 
          error: `Video too large (${fileSizeMB}MB). Maximum size: ${maxSizeMB}MB. For larger videos, upload to YouTube and share the link instead.` 
        }
      } else {
        return { 
          valid: false, 
          error: `File too large (${fileSizeMB}MB). Maximum size: ${maxSizeMB}MB` 
        }
      }
    }

    return { valid: true }
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      const files = Array.from(e.dataTransfer.files)
      const newProgress: FileUploadProgress[] = []

      for (const file of files.slice(0, maxFiles - uploadProgress.length)) {
        const validation = validateFile(file)
        newProgress.push({
          file,
          progress: 0,
          status: validation.valid ? 'pending' : 'error',
          error: validation.error
        })
      }

      setUploadProgress((prev) => [...prev, ...newProgress])
    },
    [acceptedTypes, maxFiles, uploadProgress.length],
  )

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newProgress: FileUploadProgress[] = []

    for (const file of files.slice(0, maxFiles - uploadProgress.length)) {
      const validation = validateFile(file)
      newProgress.push({
        file,
        progress: 0,
        status: validation.valid ? 'pending' : 'error',
        error: validation.error
      })
    }

    setUploadProgress((prev) => [...prev, ...newProgress])
  }

  const removeFile = (index: number) => {
    setUploadProgress((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadFile = async (fileProgress: FileUploadProgress, index: number): Promise<any> => {
    const { file } = fileProgress
    
    try {
      // Update status to uploading
      setUploadProgress(prev => prev.map((item, i) => 
        i === index ? { ...item, status: 'uploading', progress: 0 } : item
      ))

      // Create form data
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', uploadData.title)
      formData.append('description', uploadData.description)
      formData.append('uploaded_by', user?.id || '')

      // Upload to server with progress tracking
      const response = await fetch(`/api/memorials/${memorialId}/media/upload`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const result = await response.json()
      
      // Update progress to 100% and status to success
      setUploadProgress(prev => prev.map((item, i) => 
        i === index ? { 
          ...item, 
          status: 'success', 
          progress: 100,
          result: result.items?.[0] || result 
        } : item
      ))

      return result.items?.[0] || result

    } catch (error) {
      console.error('Upload error:', error)
      setUploadProgress(prev => prev.map((item, i) => 
        i === index ? { 
          ...item, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Upload failed'
        } : item
      ))
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !memorialId) return

    const validFiles = uploadProgress.filter(item => item.status === 'pending')
    if (validFiles.length === 0 && !videoUrl.trim()) return

    setIsUploading(true)

    try {
      // Check usage limits first
      const limitCheck = await checkUsageLimits(user.id, "upload_media", {
        files: validFiles.map(item => item.file),
        memorialId,
      })

      if (!limitCheck.allowed) {
        setLimitModal({
          isOpen: true,
          message: limitCheck.message || "Upload limit reached",
          upgradeRequired: limitCheck.upgradeRequired || false,
        })
        return
      }

      // Upload files sequentially to avoid overwhelming the server
      const uploadedFiles: any[] = []
      for (let i = 0; i < uploadProgress.length; i++) {
        const fileProgress = uploadProgress[i]
        if (fileProgress.status === 'pending') {
          try {
            const result = await uploadFile(fileProgress, i)
            uploadedFiles.push(result)
          } catch (error) {
            console.error(`Failed to upload ${fileProgress.file.name}:`, error)
          }
        }
      }

      // Handle YouTube URL if provided
      const allItems = [...uploadedFiles]
      if (videoUrl.trim()) {
        allItems.push({
          file_url: videoUrl.trim(),
          file_type: 'video',
          title: uploadData.title || 'YouTube Video',
          description: uploadData.description,
          uploaded_by: user.id
        })
      }

      // Save to database
      if (allItems.length > 0) {
        const saveResponse = await fetch(`/api/memorials/${memorialId}/media`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ items: allItems }),
        })

        if (!saveResponse.ok) {
          throw new Error('Failed to save media to database')
        }

        const savedItems = await saveResponse.json()
        
        // Call success callback
        if (onUpload) {
          onUpload(savedItems.items || allItems)
        }

        toast.success(`Successfully uploaded ${allItems.length} item${allItems.length > 1 ? 's' : ''}`)

        // Reset form
        setUploadProgress([])
        setUploadData({ title: "", description: "", date: "" })
        setVideoUrl("")
        setShowUrlInput(false)
        setIsOpen(false)
      }

    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Failed to upload files. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            {triggerLabel || "Add Photos & Videos"}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Upload Media</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Video Upload Guidance */}
            <Alert className="border-blue-200 bg-blue-50">
              <Video className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <div className="flex items-center justify-between">
                  <div>
                    <strong>Video uploads:</strong> Files up to 500MB are supported. For larger videos, consider uploading to YouTube (set as unlisted) and sharing the link instead.
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="ml-3 border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    {showUrlInput ? "Hide" : "Add"} Video URL
                  </Button>
                </div>
              </AlertDescription>
            </Alert>

            {/* YouTube URL Input */}
            {showUrlInput && (
              <div className="space-y-2 p-4 bg-gray-50 rounded-lg border">
                <Label htmlFor="video-url">YouTube Video URL</Label>
                <Input
                  id="video-url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="border-2 focus:border-primary"
                />
                <p className="text-xs text-muted-foreground">
                  Paste a YouTube video URL. We recommend setting your video as "Unlisted" for privacy.
                </p>
              </div>
            )}

            {/* File Upload Area */}
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                multiple
                accept={acceptedTypes.join(",")}
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />

              <div className="space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-medium">Drop files here or click to browse</p>
                  <p className="text-sm text-muted-foreground">
                    {helperText || "Images up to 10MB, videos up to 500MB, documents up to 5MB"}
                  </p>
                </div>
              </div>
            </div>

            {/* Selected Files with Progress */}
            {uploadProgress.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium">Selected Files ({uploadProgress.length})</h4>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {uploadProgress.map((fileProgress, index) => {
                    const { file, progress, status, error } = fileProgress
                    
                    const getFileIcon = () => {
                      if (file.type.startsWith("image/")) return <ImageIcon className="h-6 w-6" />
                      if (file.type.startsWith("video/")) return <Video className="h-6 w-6" />
                      return <FileText className="h-6 w-6" />
                    }

                    const getStatusIcon = () => {
                      switch (status) {
                        case 'uploading':
                          return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                        case 'success':
                          return <CheckCircle className="h-4 w-4 text-green-500" />
                        case 'error':
                          return <AlertCircle className="h-4 w-4 text-red-500" />
                        default:
                          return null
                      }
                    }

                    return (
                      <div key={index} className="p-3 bg-background rounded-lg border">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 text-primary">
                            {getFileIcon()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-medium truncate">{file.name}</p>
                              <div className="flex items-center space-x-2">
                                {getStatusIcon()}
                                {!isUploading && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeFile(index)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                              <span>{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                              {status === 'uploading' && (
                                <>
                                  <span>•</span>
                                  <span>{progress}%</span>
                                </>
                              )}
                            </div>
                            
                            {/* Progress bar */}
                            {status === 'uploading' && (
                              <Progress value={progress} className="mt-2 h-1" />
                            )}
                            
                            {/* Error message */}
                            {status === 'error' && error && (
                              <Alert className="mt-2">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription className="text-xs">
                                  {error}
                                </AlertDescription>
                              </Alert>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ... existing metadata fields ... */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Give your media a title"
                  value={uploadData.title}
                  onChange={(e) => setUploadData((prev) => ({ ...prev, title: e.target.value }))}
                  className="border-2 focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Add a description or story about these photos/videos"
                  value={uploadData.description}
                  onChange={(e) => setUploadData((prev) => ({ ...prev, description: e.target.value }))}
                  className="border-2 focus:border-primary resize-none"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date Taken (Optional)</Label>
                <Input
                  id="date"
                  type="date"
                  value={uploadData.date}
                  onChange={(e) => setUploadData((prev) => ({ ...prev, date: e.target.value }))}
                  className="border-2 focus:border-primary"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsOpen(false)}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={(uploadProgress.length === 0 && !videoUrl.trim()) || isUploading || (uploadProgress.length > 0 && uploadProgress.every(f => f.status !== 'pending'))}
                className="bg-primary hover:bg-primary/90"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  (() => {
                    const pendingFiles = uploadProgress.filter(f => f.status === 'pending').length
                    const hasUrl = videoUrl.trim()
                    
                    if (pendingFiles > 0 && hasUrl) {
                      return `Upload ${pendingFiles} File${pendingFiles === 1 ? '' : 's'} + Video URL`
                    } else if (pendingFiles > 0) {
                      return `Upload ${pendingFiles} File${pendingFiles === 1 ? '' : 's'}`
                    } else if (hasUrl) {
                      return 'Add Video URL'
                    } else {
                      return 'Upload'
                    }
                  })()
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <UsageLimitModal
        isOpen={limitModal.isOpen}
        onClose={() => setLimitModal({ isOpen: false, message: "", upgradeRequired: false })}
        message={limitModal.message}
        upgradeRequired={limitModal.upgradeRequired}
      />
    </>
  )
}
