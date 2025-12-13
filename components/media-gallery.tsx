"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Play, ImageIcon, Video, Calendar, X, ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { format } from "date-fns"
import MediaUsageIndicator from "./media-usage-indicator"
import LazyImage from "./lazy-image"
import LazyVideo from "./lazy-video"

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

interface MediaGalleryProps {
  media: MediaItem[]
  title?: string
  onUploadClick?: () => void
  canUpload?: boolean
  memorialId?: string | number
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

export default function MediaGallery({ media, title = "Photos & Videos", onUploadClick, canUpload = false, memorialId }: MediaGalleryProps) {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [filter, setFilter] = useState<"all" | "image" | "video" | "document">("all")

  const filteredMedia = media.filter((item) => filter === "all" || item.file_type === filter)
  const isEmpty = (media?.length || 0) === 0

  const openLightbox = (item: MediaItem, index: number) => {
    setSelectedMedia(item)
    setCurrentIndex(index)
  }

  const navigateMedia = (direction: "prev" | "next") => {
    const newIndex =
      direction === "prev"
        ? (currentIndex - 1 + filteredMedia.length) % filteredMedia.length
        : (currentIndex + 1) % filteredMedia.length

    setCurrentIndex(newIndex)
    setSelectedMedia(filteredMedia[newIndex])
  }

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-3 md:gap-4 mb-6 md:mb-8">
        <div>
          <h2 className="font-serif text-xl md:text-3xl lg:text-4xl text-slate-900 mb-1 md:mb-2 leading-tight">{title}</h2>
          <p className="text-slate-700 text-sm md:text-base lg:text-lg font-medium">{media.length} {media.length === 1 ? 'item' : 'items'}</p>
        </div>
        {media.length > 0 && (
          <div className="flex items-center gap-2 md:gap-3">
            <Button
              variant={filter === "all" ? "default" : "ghost"}
              size="default"
              onClick={() => setFilter("all")}
              className={`${filter === "all" ? "bg-slate-900 text-white hover:bg-slate-800" : "text-slate-700"} text-xs md:text-sm lg:text-base px-3 md:px-4 py-2 h-9 md:h-10 touch-manipulation`}
            >
              All
            </Button>
            <Button
              variant={filter === "image" ? "default" : "ghost"}
              size="default"
              onClick={() => setFilter("image")}
              className={`${filter === "image" ? "bg-slate-900 text-white hover:bg-slate-800" : "text-slate-700"} text-xs md:text-sm lg:text-base px-3 md:px-4 py-2 h-9 md:h-10 touch-manipulation`}
            >
              Photos
            </Button>
            <Button
              variant={filter === "video" ? "default" : "ghost"}
              size="default"
              onClick={() => setFilter("video")}
              className={`${filter === "video" ? "bg-slate-900 text-white hover:bg-slate-800" : "text-slate-700"} text-xs md:text-sm lg:text-base px-3 md:px-4 py-2 h-9 md:h-10 touch-manipulation`}
            >
              Videos
            </Button>
          </div>
        )}
      </div>

      {/* Usage Indicator for authenticated users who can upload */}
      {canUpload && memorialId && (
        <div className="mb-4 md:mb-6 pb-4 md:pb-6 border-b border-slate-200">
          <MediaUsageIndicator
            memorialId={memorialId}
            photoCount={media.filter((m) => m.file_type === "image").length}
            videoCount={media.filter((m) => m.file_type === "video").length}
          />
        </div>
      )}

        {filteredMedia.length === 0 ? (
          <div className="py-12 md:py-16 text-center">
            <p className="text-slate-600 text-sm md:text-base lg:text-lg mb-4 md:mb-6">
              {isEmpty 
                ? "No photos or videos yet." 
                : filter === "video" 
                  ? "No videos yet." 
                  : filter === "image" 
                    ? "No photos yet."
                    : "No items match this filter."}
            </p>
            {canUpload && onUploadClick && (isEmpty || filter === "video" || filter === "image") && (
              <Button 
                onClick={onUploadClick}
                variant="outline"
                className="border-slate-300 text-slate-800 hover:bg-slate-50 text-sm md:text-base h-10 md:h-10 touch-manipulation"
              >
                {filter === "video" ? (
                  <>
                    <Video className="h-4 w-4 mr-2" />
                    Add Videos
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Add Photos
                  </>
                )}
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
            {filteredMedia.map((item, index) => (
              <div
                key={item.id}
                className="relative group cursor-pointer rounded-lg overflow-hidden bg-muted aspect-square touch-manipulation"
                onClick={() => openLightbox(item, index)}
              >
                {/* Display appropriate content based on file type */}
                {item.file_type === "image" ? (
                  <LazyImage
                    src={item.file_url}
                    alt={item.title || item.original_filename || "Uploaded image"}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : item.file_type === "video" ? (
                  // Check if it's a YouTube URL
                  isYouTubeUrl(item.file_url) ? (
                    <div className="w-full h-full bg-gray-900 flex items-center justify-center relative">
                    <div className="text-center text-white">
                      <Video className="h-12 w-12 mx-auto mb-2 opacity-80" />
                      <p className="text-base opacity-90">YouTube Video</p>
                      </div>
                    </div>
                  ) : (
                    <LazyVideo
                      src={item.file_url}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                  )
                ) : (
                  // Document placeholder
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl mb-2">📄</div>
                      <p className="text-sm md:text-base text-muted-foreground truncate">
                        {item.original_filename || "Document"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Media type indicator */}
                <div className="absolute top-1.5 right-1.5 md:top-2 md:right-2">
                  <Badge variant="secondary" className="bg-black/60 text-white border-0 text-xs px-1.5 md:px-2 py-0.5 md:py-1">
                    {item.file_type === "video" ? (
                      <Video className="h-3 w-3" />
                    ) : item.file_type === "document" ? (
                      <span className="text-xs">PDF</span>
                    ) : (
                      <ImageIcon className="h-3 w-3" />
                    )}
                  </Badge>
                </div>

                {/* Play button for videos */}
                {item.file_type === "video" && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-black/50 rounded-full flex items-center justify-center group-hover:bg-black/70 transition-colors">
                      <Play className="h-5 w-5 md:h-6 md:w-6 text-white ml-0.5 md:ml-1" />
                    </div>
                  </div>
                )}

                {/* Overlay with info */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-white text-base font-semibold truncate">
                      {item.title || item.original_filename || `${item.file_type} file`}
                    </p>
                    <div className="flex items-center space-x-2 text-sm md:text-base text-white/80">
                      <Calendar className="h-3 w-3" />
                      <span>{format(new Date(item.created_at), "MMM yyyy")}</span>
                      {item.file_size && (
                        <>
                          <span>•</span>
                          <span>{(item.file_size / (1024 * 1024)).toFixed(1)}MB</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Lightbox Modal */}
        <Dialog open={!!selectedMedia} onOpenChange={() => setSelectedMedia(null)}>
          <DialogContent className="max-w-4xl w-full h-full md:h-[80vh] p-0 bg-black border-0 rounded-none md:rounded-lg">
            <VisuallyHidden>
              <DialogTitle>
                {selectedMedia ? `View ${selectedMedia.title}` : "Media Viewer"}
              </DialogTitle>
            </VisuallyHidden>
            {selectedMedia && (
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Close button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-3 right-3 md:top-4 md:right-4 z-10 text-white hover:bg-white/20 h-10 w-10 md:h-9 md:w-9 touch-manipulation"
                  onClick={() => setSelectedMedia(null)}
                  aria-label="Close"
                >
                  <X className="h-5 w-5 md:h-4 md:w-4" />
                </Button>

                {/* Navigation buttons */}
                {filteredMedia.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 h-12 w-12 md:h-10 md:w-10 touch-manipulation"
                      onClick={() => navigateMedia("prev")}
                      aria-label="Previous"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 h-12 w-12 md:h-10 md:w-10 touch-manipulation"
                      onClick={() => navigateMedia("next")}
                      aria-label="Next"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                  </>
                )}

                {/* Media content */}
                <div className="w-full h-full flex items-center justify-center p-4 md:p-8">
                  {selectedMedia.file_type === "image" ? (
                    <LazyImage
                      src={selectedMedia.file_url || "/placeholder.svg"}
                      alt={selectedMedia.title || selectedMedia.original_filename || "Image"}
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
                        title={selectedMedia.title || "YouTube Video"}
                      />
                    ) : (
                      <LazyVideo
                        src={selectedMedia.file_url}
                        controls
                        className="max-w-full max-h-full"
                        autoPlay
                        muted={false}
                      />
                    )
                  ) : (
                    // Document viewer - open in new tab
                    <div className="text-center px-4">
                      <div className="text-5xl md:text-6xl mb-3 md:mb-4">📄</div>
                      <h3 className="text-white text-lg md:text-xl mb-3 md:mb-4">
                        {selectedMedia.title || selectedMedia.original_filename || "Document"}
                      </h3>
                      <Button
                        onClick={() => window.open(selectedMedia.file_url, '_blank')}
                        className="bg-white text-black hover:bg-gray-200 h-10 md:h-10 touch-manipulation"
                      >
                        Open Document
                      </Button>
                    </div>
                  )}
                </div>

                {/* Media info */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 md:p-6">
                  <h3 className="text-white text-base md:text-lg font-semibold mb-1 md:mb-2">
                    {selectedMedia.title || selectedMedia.original_filename || `${selectedMedia.file_type} file`}
                  </h3>
                  {selectedMedia.description && (
                    <p className="text-white/80 mb-1 md:mb-2 text-sm md:text-base">{selectedMedia.description}</p>
                  )}
                  <div className="flex items-center flex-wrap space-x-2 md:space-x-4 text-xs md:text-sm text-white/60">
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
    </div>
  )
}
