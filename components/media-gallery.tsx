"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Play, ImageIcon, Video, Calendar, X, ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { format } from "date-fns"
import MediaUsageIndicator from "./media-usage-indicator"

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
    <Card className="border-0 shadow-lg bg-white">
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-2xl font-semibold">{title}</h2>
          <div className="flex items-center space-x-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
              className={filter !== "all" ? "bg-transparent" : ""}
            >
              All ({media.length})
            </Button>
            <Button
              variant={filter === "image" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("image")}
              className={filter !== "image" ? "bg-transparent" : ""}
            >
              <ImageIcon className="h-4 w-4 mr-1" />
              Photos ({media.filter((m) => m.file_type === "image").length})
            </Button>
            <Button
              variant={filter === "video" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("video")}
              className={filter !== "video" ? "bg-transparent" : ""}
            >
              <Video className="h-4 w-4 mr-1" />
              Videos ({media.filter((m) => m.file_type === "video").length})
            </Button>
            
            {/* Add upload button when filter is active and user can upload */}
            {canUpload && onUploadClick && (filter === "video" || filter === "image") && (
              <Button
                onClick={onUploadClick}
                size="sm"
                className="bg-primary hover:bg-primary/90 text-white ml-2"
              >
                <Plus className="h-4 w-4 mr-1" />
                {filter === "video" ? "Add Video" : "Add Photo"}
              </Button>
            )}
          </div>
        </div>

        {/* Usage Indicator for authenticated users who can upload */}
        {canUpload && memorialId && (
          <div className="mb-4 p-3 bg-slate-50 rounded-lg border">
            <MediaUsageIndicator
              memorialId={memorialId}
              photoCount={media.filter((m) => m.file_type === "image").length}
              videoCount={media.filter((m) => m.file_type === "video").length}
            />
          </div>
        )}

        {filteredMedia.length === 0 ? (
          <div className="py-10">
            <div className="rounded-xl border border-dashed border-border p-8 md:p-12 bg-gradient-to-br from-primary/5 to-accent/5">
              <div className="max-w-xl mx-auto text-center">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-white/80 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  {filter === "video" ? (
                    <Video className="h-7 w-7 md:h-8 md:w-8 text-primary" />
                  ) : filter === "image" ? (
                    <ImageIcon className="h-7 w-7 md:h-8 md:w-8 text-primary" />
                  ) : (
                    <ImageIcon className="h-7 w-7 md:h-8 md:w-8 text-primary" />
                  )}
                </div>
                <h3 className="font-serif text-xl md:text-2xl text-foreground mb-2">
                  {isEmpty 
                    ? "Start their gallery" 
                    : filter === "video" 
                      ? "No videos yet" 
                      : filter === "image" 
                        ? "No photos yet"
                        : "No items match this filter"
                  }
                </h3>
                <p className="text-sm md:text-base text-muted-foreground mb-6">
                  {isEmpty
                    ? "Add cherished photos and short videos to bring their story to life. If you don't have any yet, this space will fill up as friends and family contribute."
                    : filter === "video"
                      ? "Upload video files up to 500MB or add YouTube links to share video memories."
                      : filter === "image"
                        ? "Upload photos up to 10MB to share visual memories and moments."
                        : "Try switching filters or add new items."}
                </p>
                
                {/* Upload button for empty states */}
                {canUpload && onUploadClick && (isEmpty || filter === "video" || filter === "image") && (
                  <Button 
                    onClick={onUploadClick}
                    className="bg-primary hover:bg-primary/90 text-white"
                    size="lg"
                  >
                    {filter === "video" ? (
                      <>
                        <Video className="h-5 w-5 mr-2" />
                        Add Videos
                      </>
                    ) : filter === "image" ? (
                      <>
                        <ImageIcon className="h-5 w-5 mr-2" />
                        Add Photos
                      </>
                    ) : (
                      <>
                        <ImageIcon className="h-5 w-5 mr-2" />
                        Add First Photos
                      </>
                    )}
                  </Button>
                )}
              </div>
              <div className="mt-6 grid grid-cols-3 md:grid-cols-6 gap-3 opacity-80" aria-hidden>
                <div className="aspect-square rounded-lg bg-white/60" />
                <div className="aspect-square rounded-lg bg-white/60" />
                <div className="aspect-square rounded-lg bg-white/60" />
                <div className="aspect-square rounded-lg bg-white/60" />
                <div className="aspect-square rounded-lg bg-white/60" />
                <div className="aspect-square rounded-lg bg-white/60" />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredMedia.map((item, index) => (
              <div
                key={item.id}
                className="relative group cursor-pointer rounded-lg overflow-hidden bg-muted aspect-square"
                onClick={() => openLightbox(item, index)}
              >
                {/* Display appropriate content based on file type */}
                {item.file_type === "image" ? (
                  <img
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
                        <p className="text-sm opacity-80">YouTube Video</p>
                      </div>
                    </div>
                  ) : (
                    <video
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
                      <p className="text-xs text-muted-foreground truncate">
                        {item.original_filename || "Document"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Media type indicator */}
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="bg-black/50 text-white border-0">
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
                    <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center group-hover:bg-black/70 transition-colors">
                      <Play className="h-6 w-6 text-white ml-1" />
                    </div>
                  </div>
                )}

                {/* Overlay with info */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-white text-sm font-medium truncate">
                      {item.title || item.original_filename || `${item.file_type} file`}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-white/80">
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
          <DialogContent className="max-w-4xl w-full h-[80vh] p-0 bg-black border-0">
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
                  className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
                  onClick={() => setSelectedMedia(null)}
                >
                  <X className="h-4 w-4" />
                </Button>

                {/* Navigation buttons */}
                {filteredMedia.length > 1 && (
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
                      <video 
                        src={selectedMedia.file_url} 
                        controls 
                        className="max-w-full max-h-full" 
                        autoPlay 
                      />
                    )
                  ) : (
                    // Document viewer - open in new tab
                    <div className="text-center">
                      <div className="text-6xl mb-4">📄</div>
                      <h3 className="text-white text-xl mb-4">
                        {selectedMedia.title || selectedMedia.original_filename || "Document"}
                      </h3>
                      <Button
                        onClick={() => window.open(selectedMedia.file_url, '_blank')}
                        className="bg-white text-black hover:bg-gray-200"
                      >
                        Open Document
                      </Button>
                    </div>
                  )}
                </div>

                {/* Media info */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                  <h3 className="text-white text-lg font-semibold mb-2">
                    {selectedMedia.title || selectedMedia.original_filename || `${selectedMedia.file_type} file`}
                  </h3>
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
      </CardContent>
    </Card>
  )
}
