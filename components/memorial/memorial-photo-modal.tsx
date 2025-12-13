"use client"

import { Camera, Loader2 } from "lucide-react"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

interface MemorialPhotoModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onUpload: (uploadedItems: any[]) => void
  memorialId?: string
  hasUploadLoaded: boolean
  MediaUploadComponent?: any
}

export default function MemorialPhotoModal({
  isOpen,
  onOpenChange,
  onUpload,
  memorialId,
  hasUploadLoaded,
  MediaUploadComponent
}: MemorialPhotoModalProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-4xl w-full h-full md:h-auto md:max-h-[90vh] overflow-y-auto top-0 md:top-[52%] rounded-none md:rounded-lg p-4 md:p-6">
        <DialogTitle className="font-serif text-2xl md:text-3xl font-semibold pb-4 md:pb-6">
          Add photo or video
        </DialogTitle>
        <div className="space-y-6">
          <div className="text-center border-2 border-dashed border-border rounded-lg p-10 bg-blue-50/40">
            <Camera className="h-16 w-16 text-[#1B3B5F] mx-auto mb-6" />
            <p className="text-slate-700 mb-6 text-lg">
              Upload photos and videos to share memories.
            </p>
            {hasUploadLoaded && MediaUploadComponent ? (
              <MediaUploadComponent
                memorialId={memorialId}
                onUpload={(uploadedItems: any[]) => {
                  onOpenChange(false)
                  onUpload(uploadedItems)
                }}
                triggerLabel="Upload media"
                helperText="Share photos, videos, or documents"
              />
            ) : (
              <div className="flex items-center justify-center py-8 text-slate-600 text-lg">
                <Loader2 className="mr-3 h-6 w-6 animate-spin" aria-hidden />
                <span>Loading the uploader…</span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}