"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Upload, X, ImageIcon, Video, Plus } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { checkUsageLimits } from "@/lib/usage-limits"
import UsageLimitModal from "./usage-limit-modal"

interface MediaUploadProps {
  onUpload?: (files: File[]) => void
  maxFiles?: number
  acceptedTypes?: string[]
  memorialId?: string | number
}

export default function MediaUpload({
  onUpload,
  maxFiles = 10,
  acceptedTypes = ["image/*", "video/*"],
  memorialId,
}: MediaUploadProps) {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
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

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      const files = Array.from(e.dataTransfer.files)
      const validFiles = files.filter((file) => acceptedTypes.some((type) => file.type.match(type.replace("*", ".*"))))

      setSelectedFiles((prev) => [...prev, ...validFiles].slice(0, maxFiles))
    },
    [acceptedTypes, maxFiles],
  )

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setSelectedFiles((prev) => [...prev, ...files].slice(0, maxFiles))
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !memorialId || selectedFiles.length === 0) return

    setLoading(true)
    try {
      const limitCheck = await checkUsageLimits(user.id, "upload_media", {
        files: selectedFiles,
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

      if (onUpload) {
        onUpload(selectedFiles)
      }

      // Reset form
      setSelectedFiles([])
      setUploadData({ title: "", description: "", date: "" })
      setIsOpen(false)
    } catch (error) {
      console.error("Error checking upload limits:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Add Photos & Videos
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Upload Media</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                  <p className="text-sm text-muted-foreground">Support for images and videos up to 50MB each</p>
                </div>
              </div>
            </div>

            {/* Selected Files */}
            {selectedFiles.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium">Selected Files ({selectedFiles.length})</h4>
                <div className="grid grid-cols-2 gap-4 max-h-40 overflow-y-auto">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-memorial-bg rounded-lg">
                      <div className="flex-shrink-0">
                        {file.type.startsWith("image/") ? (
                          <ImageIcon className="h-8 w-8 text-primary" />
                        ) : (
                          <Video className="h-8 w-8 text-accent" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
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
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={selectedFiles.length === 0 || loading}
                className="bg-primary hover:bg-primary/90"
              >
                {loading
                  ? "Checking..."
                  : `Upload ${selectedFiles.length} ${selectedFiles.length === 1 ? "File" : "Files"}`}
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
