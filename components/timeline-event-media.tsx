"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Play, ImageIcon, Video, Calendar, X, ChevronLeft, ChevronRight, Images, MoreHorizontal } from "lucide-react"
import { format } from "date-fns"

interface MediaItem {
  id: string
  memorial_id?: string
  file_url: string
  file_type: "image" | "video" | "document"
  title?: string | null
  description?: string | null
  uploaded_by?: string | null
  created_at: string
  original_filename?: string
  file_size?: number
}

interface TimelineEventMediaProps {
  eventId: string
  eventTitle: string
  eventDate: string | null
  primaryMediaId?: string | null
  allMedia: MediaItem[]
  className?: string
}

// Helper function to check if URL is YouTube
const isYouTubeUrl = (url: string): boolean => {
  return url.includes('youtube.com') || url.includes('youtu.be')
}

// Helper function to convert YouTube URL to embed URL
const getYouTubeEmbedUrl = (url: string): string => {
  let videoId = ''
  
  if (url.includes('youtube.com/watch?v=')) {
    videoId = url.split('v=')[1]?.split('&')[0] || ''
  } else if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1]?.split('?')[0] || ''
  }
  
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url
}

// Smart function to find related media for a timeline event
const findRelatedMedia = (
  eventTitle: string,
  eventDate: string | null,
  primaryMediaId: string | null,
  allMedia: MediaItem[]
): MediaItem[] => {
  const related: MediaItem[] = []
  
  // Always include the primary media if it exists
  if (primaryMediaId) {
    const primaryMedia = allMedia.find(m => m.id === primaryMediaId)
    if (primaryMedia) related.push(primaryMedia)
  }
  
  // Find additional related media based on various criteria
  const eventWords = eventTitle.toLowerCase().split(' ').filter(word => word.length > 2)
  const eventDateObj = eventDate ? new Date(eventDate) : null
  
  allMedia.forEach(media => {
    // Skip if already included as primary
    if (media.id === primaryMediaId) return
    
    let score = 0
    
    // Check title similarity
    const mediaTitle = (media.title || media.original_filename || '').toLowerCase()
    eventWords.forEach(word => {
      if (mediaTitle.includes(word)) score += 2
    })
    
    // Check if media title contains event-related terms
    if (mediaTitle.includes('timeline') || mediaTitle.includes(eventTitle.toLowerCase().substring(0, 8))) {
      score += 3
    }
    
    // Check date proximity (within 30 days)
    if (eventDateObj) {
      const mediaDate = new Date(media.created_at)
      const daysDiff = Math.abs((eventDateObj.getTime() - mediaDate.getTime()) / (1000 * 60 * 60 * 24))
      if (daysDiff <= 30) score += 1
      if (daysDiff <= 7) score += 2
    }
    
    // Include if score is high enough
    if (score >= 2) {
      related.push(media)
    }
  })
  
  // Remove duplicates and limit to 9 items for display
  const uniqueRelated = related.filter((item, index, self) => 
    index === self.findIndex(t => t.id === item.id)
  )
  
  return uniqueRelated.slice(0, 9)
}

export default function TimelineEventMedia({ 
  eventId, 
  eventTitle, 
  eventDate, 
  primaryMediaId, 
  allMedia, 
  className = "" 
}: TimelineEventMediaProps) {
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  const relatedMedia = findRelatedMedia(eventTitle, eventDate, primaryMediaId, allMedia)
  
  if (relatedMedia.length === 0) return null

  const primaryMedia = relatedMedia[0]
  const hasMultiple = relatedMedia.length > 1

  const openGallery = (startIndex = 0) => {
    setCurrentIndex(startIndex)
    setSelectedMedia(relatedMedia[startIndex])
    setGalleryOpen(true)
  }

  const navigateMedia = (direction: "prev" | "next") => {
    const newIndex =
      direction === "prev"
        ? (currentIndex - 1 + relatedMedia.length) % relatedMedia.length
        : (currentIndex + 1) % relatedMedia.length

    setCurrentIndex(newIndex)
    setSelectedMedia(relatedMedia[newIndex])
  }

  const renderMediaThumbnail = (media: MediaItem, size: 'large' | 'small' = 'large') => {
    const sizeClasses = size === 'large' 
      ? 'w-full h-48' 
      : 'w-full h-16'
    
    if (media.file_type === "image") {
      return (
        <img
          src={media.file_url}
          alt={media.title || eventTitle}
          className={`${sizeClasses} rounded-lg object-cover border border-slate-200 transition-opacity duration-200`}
          onError={(e) => {
            console.error('Failed to load image:', media.file_url)
            const target = e.currentTarget
            target.parentElement?.insertAdjacentHTML('afterbegin', 
              '<div class="absolute inset-0 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200"><span class="text-slate-500 text-sm">Image failed to load</span></div>'
            )
            target.style.display = 'none'
          }}
          loading="lazy"
        />
      )
    } else if (media.file_type === "video") {
      if (isYouTubeUrl(media.file_url)) {
        return (
          <div className={`${sizeClasses} bg-gray-900 rounded-lg flex items-center justify-center relative border border-slate-200`}>
            <div className="text-center text-white">
              <Video className={`${size === 'large' ? 'h-8 w-8' : 'h-4 w-4'} mx-auto mb-1 opacity-80`} />
              {size === 'large' && <p className="text-xs opacity-80">YouTube</p>}
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`${size === 'large' ? 'w-12 h-12' : 'w-6 h-6'} bg-black/50 rounded-full flex items-center justify-center`}>
                <Play className={`${size === 'large' ? 'h-6 w-6' : 'h-3 w-3'} text-white ml-0.5`} />
              </div>
            </div>
          </div>
        )
      } else {
        return (
          <div className="relative">
            <video
              src={media.file_url}
              className={`${sizeClasses} rounded-lg object-cover border border-slate-200`}
              muted
              playsInline
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`${size === 'large' ? 'w-12 h-12' : 'w-6 h-6'} bg-black/50 rounded-full flex items-center justify-center`}>
                <Play className={`${size === 'large' ? 'h-6 w-6' : 'h-3 w-3'} text-white ml-0.5`} />
              </div>
            </div>
          </div>
        )
      }
    }
    
    return null
  }

  return (
    <>
      <div className={`mb-4 ${className}`}>
        {hasMultiple ? (
          // Multiple media - show grid layout
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Images className="h-4 w-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">
                  {relatedMedia.length} related {relatedMedia.length === 1 ? 'item' : 'items'}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openGallery(0)}
                className="text-xs"
              >
                View All
              </Button>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {/* Main image - spans 2 columns */}
              <div 
                className="col-span-2 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => openGallery(0)}
              >
                {renderMediaThumbnail(primaryMedia, 'large')}
              </div>
              
              {/* Thumbnail grid for additional items */}
              <div className="space-y-2">
                {relatedMedia.slice(1, 3).map((media, index) => (
                  <div 
                    key={media.id}
                    className="cursor-pointer hover:opacity-90 transition-opacity relative"
                    onClick={() => openGallery(index + 1)}
                  >
                    {renderMediaThumbnail(media, 'small')}
                  </div>
                ))}
                
                {/* Show "+X more" overlay if there are more than 3 items */}
                {relatedMedia.length > 3 && (
                  <div 
                    className="w-full h-16 bg-black/50 rounded-lg flex items-center justify-center cursor-pointer hover:bg-black/60 transition-colors border border-slate-200"
                    onClick={() => openGallery(3)}
                  >
                    <div className="text-center text-white">
                      <MoreHorizontal className="h-4 w-4 mx-auto mb-1" />
                      <span className="text-xs">+{relatedMedia.length - 3}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Single media - show normal layout
          <div 
            className="cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => openGallery(0)}
          >
            {renderMediaThumbnail(primaryMedia, 'large')}
          </div>
        )}
      </div>

      {/* Gallery Modal */}
      <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
        <DialogContent className="max-w-4xl w-full h-[80vh] p-0 bg-black border-0">
          <VisuallyHidden>
            <DialogTitle>
              {selectedMedia ? `${eventTitle} - ${selectedMedia.title}` : `${eventTitle} Gallery`}
            </DialogTitle>
          </VisuallyHidden>
          {selectedMedia && (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Close button */}
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
                onClick={() => setGalleryOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>

              {/* Navigation buttons */}
              {relatedMedia.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                    onClick={() => navigateMedia("prev")}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                    onClick={() => navigateMedia("next")}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </>
              )}

              {/* Media content */}
              <div className="w-full h-full flex items-center justify-center p-8">
                {selectedMedia.file_type === "image" ? (
                  <img
                    src={selectedMedia.file_url}
                    alt={selectedMedia.title || eventTitle}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : selectedMedia.file_type === "video" ? (
                  isYouTubeUrl(selectedMedia.file_url) ? (
                    <iframe
                      src={getYouTubeEmbedUrl(selectedMedia.file_url)}
                      className="w-full aspect-video max-w-4xl"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={selectedMedia.title || eventTitle}
                    />
                  ) : (
                    <video 
                      src={selectedMedia.file_url} 
                      controls 
                      className="max-w-full max-h-full" 
                      autoPlay 
                    />
                  )
                ) : null}
              </div>

              {/* Media info */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-white text-lg font-semibold">
                    {selectedMedia.title || selectedMedia.original_filename || `${selectedMedia.file_type} file`}
                  </h3>
                  <Badge variant="secondary" className="bg-white/20 text-white border-0">
                    {currentIndex + 1} of {relatedMedia.length}
                  </Badge>
                </div>
                {selectedMedia.description && (
                  <p className="text-white/80 mb-2">{selectedMedia.description}</p>
                )}
                <div className="flex items-center space-x-4 text-sm text-white/60">
                  <span>{format(new Date(selectedMedia.created_at), "MMMM d, yyyy")}</span>
                  {selectedMedia.uploaded_by && (
                    <>
                      <span>•</span>
                      <span>Shared by {selectedMedia.uploaded_by}</span>
                    </>
                  )}
                  {selectedMedia.file_size && (
                    <>
                      <span>•</span>
                      <span>{(selectedMedia.file_size / (1024 * 1024)).toFixed(1)}MB</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
