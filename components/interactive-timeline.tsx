"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Star, Heart, Award, Baby, Sparkles, Plus, Calendar, Upload, ImageIcon, Video, FileText, Link, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface TimelineEvent {
  id: string
  title: string
  description: string
  event_date: string | null
  category: "milestone" | "achievement" | "memory" | "celebration"
  media_id: string | null
  gallery_media_ids?: string[] | null
  created_at: string
}

interface MediaItem {
  id: string
  file_url: string
  file_type: "image" | "video" | "document"
  title?: string | null
  description?: string | null
}

interface InteractiveTimelineProps {
  events: TimelineEvent[]
  media: MediaItem[]
  canEdit?: boolean
  memorialId?: string
  onEventsChange?: (events: TimelineEvent[]) => void
  onMediaUpload?: (newMedia: MediaItem) => void
  externalModalOpen?: boolean
  onExternalModalClose?: () => void
}

// Map categories to types
const categoryToType = {
  milestone: "milestone" as const,
  achievement: "achievement" as const,
  memory: "memory" as const,
  celebration: "milestone" as const, // Map celebration to milestone
}

const typeIcons = {
  birth: Baby,
  milestone: Star,
  achievement: Award,
  memory: Heart,
  passing: Sparkles,
}

const typeColors = {
  birth: "bg-blue-50/90 text-blue-700 border-blue-200/60",
  milestone: "bg-blue-50/90 text-blue-700 border-blue-200/60",
  achievement: "bg-amber-50/90 text-amber-700 border-amber-200/60",
  memory: "bg-rose-50/90 text-rose-700 border-rose-200/60",
  passing: "bg-purple-50/90 text-purple-700 border-purple-200/60",
}

export function InteractiveTimeline({ events, media, canEdit = false, memorialId, onEventsChange, onMediaUpload, externalModalOpen = false, onExternalModalClose }: InteractiveTimelineProps) {
  const { user } = useAuth()
  const [activeIndex, setActiveIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const timelineRef = useRef<HTMLDivElement>(null)

  // Modal and form state
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Handle external modal control
  useEffect(() => {
    if (externalModalOpen !== isModalOpen) {
      setIsModalOpen(externalModalOpen)
      if (!externalModalOpen && onExternalModalClose) {
        onExternalModalClose()
      }
    }
  }, [externalModalOpen, isModalOpen, onExternalModalClose])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    category: "milestone" as TimelineEvent["category"],
    selectedMediaId: "",
    galleryMediaIds: [] as string[],
  })

  // Media upload state
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([])
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [mediaUploadMode, setMediaUploadMode] = useState<"select" | "upload" | "youtube">("select")

  // Transform events to include year and image
  const transformedEvents = events
    .map((event) => {
      const year = event.event_date ? new Date(event.event_date).getFullYear() : null
      if (!year || isNaN(year)) return null

      // Find image from media
      let image: string | undefined
      if (event.media_id) {
        const mediaItem = media.find((m) => m.id === event.media_id && m.file_type === "image")
        if (mediaItem) {
          image = mediaItem.file_url
        }
      }
      // If no primary media, check gallery
      if (!image && event.gallery_media_ids && event.gallery_media_ids.length > 0) {
        const galleryMedia = media.find(
          (m) => event.gallery_media_ids?.includes(m.id) && m.file_type === "image"
        )
        if (galleryMedia) {
          image = galleryMedia.file_url
        }
      }

      return {
        id: event.id,
        year,
        title: event.title,
        description: event.description || "",
        type: categoryToType[event.category] || "milestone",
        image,
      }
    })
    .filter((e): e is NonNullable<typeof e> => e !== null)
    .sort((a, b) => a.year - b.year)

  if (transformedEvents.length === 0) {
    return (
      <div className="py-24 text-center bg-white/60 backdrop-blur-sm rounded-3xl border border-slate-200/50 shadow-xl">
        <p className="text-slate-600 text-xl font-light mb-2">No timeline events yet.</p>
        <p className="text-slate-500 text-base">Memories will appear here as they're added.</p>
      </div>
    )
  }

  const activeEvent = transformedEvents[activeIndex]
  const Icon = typeIcons[activeEvent.type]

  const goToEvent = (index: number) => {
    if (index < 0 || index >= transformedEvents.length) return
    setDirection(index > activeIndex ? 1 : -1)
    setActiveIndex(index)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goToEvent(activeIndex + 1)
      if (e.key === "ArrowLeft") goToEvent(activeIndex - 1)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [activeIndex, transformedEvents.length])

  // Scroll active year marker into view
  useEffect(() => {
    if (timelineRef.current) {
      const activeMarker = timelineRef.current.querySelector(`[data-index="${activeIndex}"]`)
      if (activeMarker) {
        activeMarker.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" })
      }
    }
  }, [activeIndex])

  // Helper functions for modal
  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      date: "",
      category: "milestone",
      selectedMediaId: "",
      galleryMediaIds: [],
    })
    setMediaFiles([])
    setMediaPreviews([])
    setYoutubeUrl("")
    setMediaUploadMode("select")
  }

  const toggleGallerySelection = (mediaId: string) => {
    setForm((prev) => {
      const exists = prev.galleryMediaIds.includes(mediaId)
      const updated = exists
        ? prev.galleryMediaIds.filter((id) => id !== mediaId)
        : [...prev.galleryMediaIds, mediaId]

      const selectedMediaId = prev.selectedMediaId || (!exists ? mediaId : updated[0] || "")

      return {
        ...prev,
        galleryMediaIds: updated,
        selectedMediaId,
      }
    })
  }

  const setCoverMedia = (mediaId: string) => {
    setForm((prev) => ({
      ...prev,
      selectedMediaId: mediaId,
      galleryMediaIds: prev.galleryMediaIds.includes(mediaId)
        ? prev.galleryMediaIds
        : [...prev.galleryMediaIds, mediaId],
    }))
  }

  const handleMediaFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    const valid: File[] = []

    for (const file of files) {
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        alert("Please select images or videos only")
        return
      }
      const maxSize = file.type.startsWith("image/") ? 10 * 1024 * 1024 : 500 * 1024 * 1024
      if (file.size > maxSize) {
        const maxSizeMB = Math.round(maxSize / (1024 * 1024))
        alert(`File too large. Maximum size: ${maxSizeMB}MB`)
        return
      }
      valid.push(file)
    }

    setMediaPreviews([])
    valid.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onload = (ev) => {
          const result = ev.target?.result
          if (typeof result === "string") {
            setMediaPreviews((prev) => [...prev, result])
          }
        }
        reader.readAsDataURL(file)
      }
    })

    setMediaFiles(valid)
  }

  const isYouTubeUrl = (url: string) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]{11}/
    return youtubeRegex.test(url)
  }

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      alert('Please enter a title')
      return
    }

    if (!form.date || !form.date.trim()) {
      alert('Please select a date')
      return
    }

    // Validate YouTube URL if provided
    if (mediaUploadMode === "youtube" && youtubeUrl.trim() && !isYouTubeUrl(youtubeUrl.trim())) {
      alert('Please enter a valid YouTube URL')
      return
    }

    if (!memorialId) {
      alert('Memorial ID is required')
      return
    }

    try {
      setIsSubmitting(true)
      let finalMediaId = form.selectedMediaId
      let galleryIds = [...form.galleryMediaIds]

      const pushGalleryId = (id: string | null | undefined) => {
        if (!id) return
        galleryIds.push(id)
        if (!finalMediaId) {
          finalMediaId = id
        }
      }

      // Handle direct media upload
      if (mediaUploadMode === "upload" && mediaFiles.length > 0) {
        setUploadingMedia(true)
        try {
          for (const file of mediaFiles) {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('title', `Timeline: ${form.title}`)
            formData.append('description', form.description || '')

            const uploadResponse = await fetch(`/api/memorials/${memorialId}/media/upload`, {
              method: 'POST',
              body: formData,
            })

            if (!uploadResponse.ok) {
              throw new Error('Failed to upload media')
            }

            const uploadData = await uploadResponse.json()
            const fileUrl = uploadData.items?.[0]?.file_url || uploadData.file_url || uploadData.url

            if (!fileUrl) continue

            const mediaResponse = await fetch(`/api/memorials/${memorialId}/media`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                items: [{
                  file_url: fileUrl,
                  file_type: file.type.startsWith('image/') ? 'image' : 'video',
                  title: `Timeline: ${form.title}`,
                  description: form.description || null,
                  uploaded_by: user?.id || null
                }]
              })
            })

            if (mediaResponse.ok) {
              const savedMedia = await mediaResponse.json()
              const newMediaItem = savedMedia.items?.[0]
              if (newMediaItem) {
                pushGalleryId(newMediaItem.id)
                onMediaUpload?.(newMediaItem)
              }
            }
          }
        } catch (error) {
          console.error('Media upload failed:', error)
          alert('Failed to upload media. Please try again.')
          return
        } finally {
          setUploadingMedia(false)
        }
      }

      // Handle YouTube URL upload
      else if (mediaUploadMode === "youtube" && youtubeUrl.trim()) {
        try {
          // Save YouTube URL to media database
          const mediaResponse = await fetch(`/api/memorials/${memorialId}/media`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items: [{
                file_url: youtubeUrl.trim(),
                file_type: 'video',
                title: `Timeline: ${form.title}`,
                description: form.description || null,
                uploaded_by: user?.id || null
              }]
            })
          })

          if (mediaResponse.ok) {
            const savedMedia = await mediaResponse.json()
            const newMediaItem = savedMedia.items?.[0]
            if (newMediaItem) {
              pushGalleryId(newMediaItem.id)
              onMediaUpload?.(newMediaItem)
            }
          }
        } catch (error) {
          console.error('YouTube URL save failed:', error)
          alert('Failed to save YouTube video. Please try again.')
          return
        }
      }

      // If user selected existing items and no cover set, use first
      if (!finalMediaId && galleryIds.length > 0) {
        finalMediaId = galleryIds[0]
      }

      // Deduplicate gallery and ensure cover included
      galleryIds = Array.from(new Set([...(finalMediaId ? [finalMediaId] : []), ...galleryIds]))

      // Create new timeline event
      const requestData = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        event_date: form.date.trim(),
        category: form.category,
        media_id: finalMediaId || null,
        gallery_media_ids: galleryIds,
      }

      const response = await fetch(`/api/memorials/${memorialId}/timeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to create timeline event')
      }

      const newEvent = await response.json()

      // Update events list with the complete event object from API and sort chronologically
      const updatedEvents = [...events, newEvent].sort((a, b) => {
        const dateA = a.event_date ? new Date(a.event_date).getTime() : 0
        const dateB = b.event_date ? new Date(b.event_date).getTime() : 0
        return dateA - dateB
      })
      onEventsChange?.(updatedEvents)

      resetForm()
      setIsModalOpen(false)

    } catch (error) {
      console.error(`Failed to create timeline event:`, error)
      alert(`Failed to create timeline event. Please try again.`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  }

  return (
    <div className="w-full">
      {/* Year Navigation Bar */}
      <div className="relative mb-16">
        <div ref={timelineRef} className="flex items-center gap-3 overflow-x-auto pb-8 scrollbar-hide px-4 -mx-4">
          <div className="flex items-center gap-3 mx-auto">
            {transformedEvents.map((event, index) => (
              <button
                key={event.id}
                data-index={index}
                onClick={() => goToEvent(index)}
                className={cn(
                  "relative flex flex-col items-center justify-center px-6 py-3.5 rounded-2xl min-w-[90px] font-medium",
                  index === activeIndex
                    ? "bg-[#1B3B5F] text-white shadow-lg"
                    : "text-slate-700 bg-white/80 border border-slate-200/60 hover:bg-white hover:shadow-md",
                )}
              >
                <span className="text-lg font-semibold">{event.year}</span>
                {index === activeIndex && (
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-[#1B3B5F] shadow-lg" />
                )}
              </button>
            ))}
          </div>
        </div>
        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-slate-200/50 rounded-full overflow-hidden shadow-inner">
          <motion.div
            className="h-full bg-[#1B3B5F] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((activeIndex + 1) / transformedEvents.length) * 100}%` }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Main Content Card */}
      <div className="relative min-h-[600px] md:min-h-[550px] mb-16">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={activeIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute inset-0"
          >
            <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/60 shadow-2xl p-8 md:p-12 lg:p-16">
              <div className="grid gap-10 md:gap-12 lg:gap-16 md:grid-cols-2 items-center">
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 shadow-xl ring-2 ring-white/60 group">
                  {activeEvent.image ? (
                    <>
                      <img
                        src={activeEvent.image}
                        alt={activeEvent.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    </>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200">
                      <div className="text-center">
                        <Icon className="h-24 w-24 text-slate-400 mx-auto mb-4 opacity-60" />
                        <p className="text-slate-500 text-sm font-medium">No image available</p>
                      </div>
                    </div>
                  )}
                  <div className="absolute top-6 left-6">
                    <div
                      className={cn(
                        "flex items-center gap-2.5 px-4 py-2.5 rounded-full border text-sm font-semibold backdrop-blur-md shadow-xl",
                        typeColors[activeEvent.type],
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="capitalize">{activeEvent.type}</span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-col space-y-8">
                  <div>
                    <span className="text-7xl md:text-8xl lg:text-9xl font-serif font-light text-[#1B3B5F]/80 leading-none tracking-tight">
                      {activeEvent.year}
                    </span>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-serif text-3xl md:text-4xl lg:text-5xl text-slate-900 font-light leading-tight">
                      {activeEvent.title}
                    </h3>
                    {activeEvent.description && (
                      <p className="text-lg md:text-xl lg:text-2xl leading-relaxed text-slate-600 font-light">
                        {activeEvent.description}
                      </p>
                    )}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex items-center gap-4 pt-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => goToEvent(activeIndex - 1)}
                      disabled={activeIndex === 0}
                      className="h-14 w-14 rounded-full bg-white/90 border-slate-300/60 hover:bg-white hover:border-slate-400 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <div className="flex-1 text-center">
                      <div className="text-sm font-semibold text-slate-700">
                        {activeIndex + 1} of {transformedEvents.length}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">Use arrow keys to navigate</div>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => goToEvent(activeIndex + 1)}
                      disabled={activeIndex === transformedEvents.length - 1}
                      className="h-14 w-14 rounded-full bg-white/90 border-slate-300/60 hover:bg-white hover:border-slate-400 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Timeline Dots */}
      <div className="flex justify-center gap-2.5 pb-4">
        {transformedEvents.map((_, index) => (
          <button
            key={index}
            onClick={() => goToEvent(index)}
            className={cn(
              "h-2.5 rounded-full transition-colors duration-200",
              index === activeIndex
                ? "w-10 bg-[#1B3B5F] shadow-sm"
                : "w-2.5 bg-slate-300 hover:bg-slate-400",
            )}
            aria-label={`Go to event ${index + 1}`}
          />
        ))}
      </div>

      {/* Add Event Modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => {
        setIsModalOpen(open)
        if (!open && onExternalModalClose) {
          onExternalModalClose()
        }
      }}>
        <DialogContent className="max-w-6xl sm:max-w-6xl max-h-[90vh] overflow-y-auto top-[56%] sm:top-[52%]">
          <DialogHeader className="pb-6">
            <DialogTitle className="font-serif text-3xl font-semibold text-slate-900">
              Add a Memory
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-8">
            {/* Title Field */}
            <div className="space-y-3">
              <Label htmlFor="title" className="text-base font-semibold text-slate-900">
                What happened?
              </Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Graduated from University"
                className="h-12 text-base"
              />
            </div>

            {/* Date and Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="date" className="text-base font-semibold text-slate-900">
                  When did this happen? <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="date"
                  type="month"
                  value={form.date}
                  onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))}
                  placeholder="YYYY-MM"
                  className="h-12 text-base"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="category" className="text-base font-semibold text-slate-900">
                  Type of memory
                </Label>
                <Select
                  value={form.category}
                  onValueChange={(value: TimelineEvent["category"]) => setForm(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="milestone" className="text-base py-3">Milestone</SelectItem>
                    <SelectItem value="achievement" className="text-base py-3">Achievement</SelectItem>
                    <SelectItem value="memory" className="text-base py-3">Memory</SelectItem>
                    <SelectItem value="celebration" className="text-base py-3">Celebration</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <Label htmlFor="description" className="text-base font-semibold text-slate-900">
                Tell us about this memory <span className="text-slate-500 font-normal">(optional)</span>
              </Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Share the story of this special moment..."
                rows={5}
                className="text-base resize-none"
              />
            </div>

            {/* Media Selection */}
            <div className="space-y-4 border-t border-slate-200 pt-6">
              <Label className="text-base font-semibold text-slate-900">
                Add a photo or video <span className="text-slate-500 font-normal">(optional)</span>
              </Label>

              {/* Media Mode Selection */}
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant={mediaUploadMode === "select" ? "default" : "outline"}
                  size="lg"
                  onClick={() => setMediaUploadMode("select")}
                  className="h-12 px-6 text-base"
                >
                  <ImageIcon className="h-5 w-5 mr-2" />
                  Choose existing
                </Button>
                <Button
                  type="button"
                  variant={mediaUploadMode === "upload" ? "default" : "outline"}
                  size="lg"
                  onClick={() => setMediaUploadMode("upload")}
                  className="h-12 px-6 text-base"
                >
                  <Upload className="h-5 w-5 mr-2" />
                  Upload new
                </Button>
                <Button
                  type="button"
                  variant={mediaUploadMode === "youtube" ? "default" : "outline"}
                  size="lg"
                  onClick={() => setMediaUploadMode("youtube")}
                  className="h-12 px-6 text-base"
                >
                  <Link className="h-5 w-5 mr-2" />
                  YouTube link
                </Button>
              </div>

              {/* Select Existing Media */}
              {mediaUploadMode === "select" && (
                <div className="space-y-4">
                  {media.length === 0 ? (
                    <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center">
                      <p className="text-base text-slate-600">
                        No photos or videos available yet. Upload new to get started.
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto space-y-3 pr-2">
                      {media.map((mediaItem) => {
                        const isSelected = form.galleryMediaIds.includes(mediaItem.id)
                        const isCover = form.selectedMediaId === mediaItem.id
                        return (
                          <div
                            key={mediaItem.id}
                            className={`flex items-center gap-4 rounded-lg border-2 px-4 py-3 ${isSelected ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white"}`}
                          >
                            {mediaItem.file_type === "video" ? (
                              <Video className="h-6 w-6 text-blue-700" aria-hidden />
                            ) : mediaItem.file_type === "document" ? (
                              <FileText className="h-6 w-6 text-slate-600" aria-hidden />
                            ) : (
                              <ImageIcon className="h-6 w-6 text-green-700" aria-hidden />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-base font-medium text-slate-900 truncate">
                                {mediaItem.title || `${mediaItem.file_type} file`}
                              </p>
                              <p className="text-sm text-slate-500 truncate">
                                {mediaItem.file_type === "video" ? "Video" : "Image"} · {mediaItem.created_at ? new Date(mediaItem.created_at).toLocaleDateString() : "Unknown date"}
                              </p>
                            </div>
                            <Button
                              size="lg"
                              variant={isSelected ? "default" : "outline"}
                              onClick={() => toggleGallerySelection(mediaItem.id)}
                              className={`h-11 px-6 ${isSelected ? "bg-[#1B3B5F]" : ""}`}
                            >
                              {isSelected ? "Remove" : "Add"}
                            </Button>
                            {isSelected && (
                              <Button
                                size="lg"
                                variant={isCover ? "default" : "outline"}
                                aria-label="Set as cover"
                                onClick={() => setCoverMedia(mediaItem.id)}
                                className={`h-11 px-4 ${isCover ? "bg-[#1B3B5F] text-white" : ""}`}
                              >
                                {isCover ? "✓ Cover" : "Set cover"}
                              </Button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Upload New Media */}
              {mediaUploadMode === "upload" && (
                <div className="space-y-4">
                  {mediaPreviews.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {mediaPreviews.map((preview, idx) => (
                        <div key={idx} className="relative">
                          <img
                            src={preview}
                            alt={`Preview ${idx + 1}`}
                            className="w-full h-32 object-cover rounded-lg border-2 border-slate-200"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  {mediaFiles.length > 0 && (
                    <div className="flex items-center justify-between rounded-lg border-2 border-slate-200 bg-slate-50 px-4 py-3">
                      <span className="text-base text-slate-700 font-medium">
                        {mediaFiles.length} file{mediaFiles.length === 1 ? "" : "s"} selected
                      </span>
                      <Button
                        type="button"
                        size="lg"
                        variant="outline"
                        onClick={() => {
                          setMediaFiles([])
                          setMediaPreviews([])
                        }}
                        className="h-10"
                      >
                        Clear
                      </Button>
                    </div>
                  )}
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center bg-slate-50">
                    <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-base text-slate-700 mb-4 font-medium">Upload photos or videos</p>
                    <Input
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      onChange={handleMediaFileSelect}
                      className="max-w-md mx-auto h-12 text-base"
                    />
                    <p className="text-sm text-slate-600 mt-4">
                      Images up to 10MB each, videos up to 500MB each
                    </p>
                  </div>
                </div>
              )}

              {/* YouTube URL */}
              {mediaUploadMode === "youtube" && (
                <div className="space-y-3">
                  <Input
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    type="url"
                    className="h-12 text-base"
                  />
                  {youtubeUrl && !isYouTubeUrl(youtubeUrl) && (
                    <p className="text-base text-red-600">Please enter a valid YouTube URL</p>
                  )}
                  <p className="text-sm text-slate-600">
                    Paste a YouTube video URL. We recommend setting your video as "Unlisted" for privacy.
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 pt-6 border-t border-slate-200">
              <Button
                variant="outline"
                onClick={() => {
                  resetForm()
                  setIsModalOpen(false)
                }}
                disabled={isSubmitting}
                size="lg"
                className="h-12 px-8 text-base"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !form.title.trim() || !form.date || !form.date.trim()}
                size="lg"
                className="h-12 px-8 text-base bg-[#1B3B5F] hover:bg-[#1B3B5F]/90"
              >
                {isSubmitting
                  ? uploadingMedia
                    ? "Uploading..."
                    : "Adding..."
                  : "Add Memory"
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

