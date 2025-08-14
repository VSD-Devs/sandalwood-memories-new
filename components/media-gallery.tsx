"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Play, ImageIcon, Video, Calendar, X, ChevronLeft, ChevronRight } from "lucide-react"
import { format } from "date-fns"

interface MediaItem {
  id: string
  type: "photo" | "video"
  url: string
  thumbnail?: string
  title: string
  description?: string
  date: Date
  uploadedBy: string
}

interface MediaGalleryProps {
  media: MediaItem[]
  title?: string
}

export default function MediaGallery({ media, title = "Photos & Videos" }: MediaGalleryProps) {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [filter, setFilter] = useState<"all" | "photo" | "video">("all")

  const filteredMedia = media.filter((item) => filter === "all" || item.type === filter)
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
              variant={filter === "photo" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("photo")}
              className={filter !== "photo" ? "bg-transparent" : ""}
            >
              <ImageIcon className="h-4 w-4 mr-1" />
              Photos ({media.filter((m) => m.type === "photo").length})
            </Button>
            <Button
              variant={filter === "video" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("video")}
              className={filter !== "video" ? "bg-transparent" : ""}
            >
              <Video className="h-4 w-4 mr-1" />
              Videos ({media.filter((m) => m.type === "video").length})
            </Button>
          </div>
        </div>

        {filteredMedia.length === 0 ? (
          <div className="py-10">
            <div className="rounded-xl border border-dashed border-border p-8 md:p-12 bg-gradient-to-br from-primary/5 to-accent/5">
              <div className="max-w-xl mx-auto text-center">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-white/80 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <ImageIcon className="h-7 w-7 md:h-8 md:w-8 text-primary" />
                </div>
                <h3 className="font-serif text-xl md:text-2xl text-foreground mb-2">{isEmpty ? "Start their gallery" : "No items match this filter"}</h3>
                <p className="text-sm md:text-base text-muted-foreground">
                  {isEmpty
                    ? "Add cherished photos and short videos to bring their story to life. If you don't have any yet, this space will fill up as friends and family contribute."
                    : "Try switching filters or add new items."}
                </p>
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
                <img
                  src={item.thumbnail || item.url}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />

                {/* Media type indicator */}
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="bg-black/50 text-white border-0">
                    {item.type === "video" ? <Video className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
                  </Badge>
                </div>

                {/* Play button for videos */}
                {item.type === "video" && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center group-hover:bg-black/70 transition-colors">
                      <Play className="h-6 w-6 text-white ml-1" />
                    </div>
                  </div>
                )}

                {/* Overlay with info */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-white text-sm font-medium truncate">{item.title}</p>
                    <div className="flex items-center space-x-2 text-xs text-white/80">
                      <Calendar className="h-3 w-3" />
                      <span>{format(item.date, "MMM yyyy")}</span>
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
                  {selectedMedia.type === "photo" ? (
                    <img
                      src={selectedMedia.url || "/placeholder.svg"}
                      alt={selectedMedia.title}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <video src={selectedMedia.url} controls className="max-w-full max-h-full" autoPlay />
                  )}
                </div>

                {/* Media info */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                  <h3 className="text-white text-lg font-semibold mb-2">{selectedMedia.title}</h3>
                  {selectedMedia.description && <p className="text-white/80 mb-2">{selectedMedia.description}</p>}
                  <div className="flex items-center space-x-4 text-sm text-white/60">
                    <span>{format(selectedMedia.date, "MMMM d, yyyy")}</span>
                    <span>•</span>
                    <span>Shared by {selectedMedia.uploadedBy}</span>
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
