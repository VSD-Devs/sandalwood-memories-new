"use client"

import { useState, useMemo } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Heart, Star, BookOpen, PartyPopper, Plus, Upload, X, Trash2, Edit, ImageIcon, Video, FileText, Link, Search, ChevronDown } from "lucide-react"
import { format } from "date-fns"
import TimelineEventMedia from "./timeline-event-media"

// Valid database categories only
type TimelineCategory = "milestone" | "achievement" | "memory" | "celebration"

interface TimelineEvent {
  id: string
  title: string
  description: string
  event_date: string | null
  category: TimelineCategory
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
  created_at?: string
  memorial_id?: string
  uploaded_by?: string | null
  original_filename?: string
  file_size?: number
}

interface TimelineProps {
  memorialId: string
  events: TimelineEvent[]
  media: MediaItem[]
  canEdit?: boolean
  onEventsChange?: (events: TimelineEvent[]) => void
  onMediaUpload?: (newMedia: MediaItem) => void
}

const categoryConfig = {
  milestone: {
    label: "Milestone",
    icon: Heart,
    color: "bg-[#1B3B5F]",
    bgColor: "bg-blue-50",
    textColor: "text-blue-900",
    borderColor: "border-blue-200"
  },
  achievement: {
    label: "Achievement", 
    icon: Star,
    color: "bg-[#1B3B5F]",
    bgColor: "bg-blue-50",
    textColor: "text-blue-900",
    borderColor: "border-blue-200"
  },
  memory: {
    label: "Memory",
    icon: BookOpen,
    color: "bg-[#1B3B5F]", 
    bgColor: "bg-blue-50",
    textColor: "text-blue-900",
    borderColor: "border-blue-200"
  },
  celebration: {
    label: "Celebration",
    icon: PartyPopper,
    color: "bg-[#1B3B5F]",
    bgColor: "bg-blue-50", 
    textColor: "text-blue-900",
    borderColor: "border-blue-200"
  }
}

const timelineStages = [
  {
    id: "birth",
    title: "Birth & Early Life",
    description: "Add details about their birth and childhood",
    category: "milestone" as TimelineCategory
  },
  {
    id: "education", 
    title: "Education",
    description: "School years, learning, and academic achievements",
    category: "achievement" as TimelineCategory
  },
  {
    id: "career",
    title: "Career & Work",
    description: "Professional journey and accomplishments", 
    category: "milestone" as TimelineCategory
  },
  {
    id: "family",
    title: "Family & Relationships",
    description: "Important relationships and family milestones",
    category: "celebration" as TimelineCategory
  },
  {
    id: "memories",
    title: "Special Memories",
    description: "Cherished moments and meaningful experiences",
    category: "memory" as TimelineCategory
  },
  {
    id: "achievements",
    title: "Major Achievements", 
    description: "Awards, recognitions, and proud accomplishments",
    category: "achievement" as TimelineCategory
  }
]

export default function Timeline({ memorialId, events, media, canEdit = false, onEventsChange, onMediaUpload }: TimelineProps) {
  const { user } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedStage, setSelectedStage] = useState<string | null>(null)
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null)
  
  // UX enhancement states
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<TimelineCategory | "all">("all")
  const [yearFilter, setYearFilter] = useState<string>("all")
  const [itemsToShow, setItemsToShow] = useState(10)
  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({})
  const ITEMS_PER_PAGE = 10
  
  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "", 
    category: "milestone" as TimelineCategory,
    selectedMediaId: "",
    galleryMediaIds: [] as string[],
  })

  // Media upload state
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([])
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [mediaUploadMode, setMediaUploadMode] = useState<"select" | "upload" | "youtube">("select")

  // Sort events by date, handling null dates safely
  const sortedEvents = [...events].sort((a, b) => {
    const dateA = a.event_date ? new Date(a.event_date).getTime() : 0
    const dateB = b.event_date ? new Date(b.event_date).getTime() : 0
    return dateA - dateB
  })

  // Get available years from events
  const availableYears = useMemo(() => {
    const years = new Set<number>()
    sortedEvents.forEach(event => {
      if (event.event_date) {
        const year = new Date(event.event_date).getFullYear()
        if (!isNaN(year)) {
          years.add(year)
        }
      }
    })
    return Array.from(years).sort((a, b) => a - b)
  }, [sortedEvents])

  const quickFilters = useMemo(
    () => [
      { key: "all", label: "All memories" },
      ...Object.entries(categoryConfig).map(([key, config]) => ({
        key,
        label: config.label
      }))
    ],
    []
  )

  // Filter and paginate events
  const filteredAndPaginatedEvents = useMemo(() => {
    let filtered = sortedEvents

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(query) ||
        (event.description && event.description.toLowerCase().includes(query))
      )
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(event => event.category === categoryFilter)
    }

    // Apply year filter
    if (yearFilter !== "all") {
      const selectedYear = parseInt(yearFilter)
      filtered = filtered.filter(event => {
        if (!event.event_date) return false
        const eventYear = new Date(event.event_date).getFullYear()
        return eventYear === selectedYear
      })
    }

    // Return filtered events with pagination info
    return {
      events: filtered.slice(0, itemsToShow),
      hasMore: filtered.length > itemsToShow,
      totalFiltered: filtered.length,
      totalUnfiltered: sortedEvents.length
    }
  }, [sortedEvents, searchQuery, categoryFilter, yearFilter, itemsToShow])

  const hasVisibleEvents = filteredAndPaginatedEvents.events.length > 0

  const groupedEvents = useMemo(() => {
    const buckets: Record<string, TimelineEvent[]> = {}

    filteredAndPaginatedEvents.events.forEach((event) => {
      const yearLabel = event.event_date
        ? new Date(event.event_date).getFullYear().toString()
        : "No date set"

      if (!buckets[yearLabel]) {
        buckets[yearLabel] = []
      }

      buckets[yearLabel].push(event)
    })

    return Object.entries(buckets)
      .map(([year, items]) => ({
        year,
        items: items.sort((a, b) => {
          const aDate = a.event_date ? new Date(a.event_date).getTime() : new Date(a.created_at).getTime()
          const bDate = b.event_date ? new Date(b.event_date).getTime() : new Date(b.created_at).getTime()
          return aDate - bDate
        })
      }))
      .sort((a, b) => {
        const aYear = a.year === "No date set" ? Number.POSITIVE_INFINITY : parseInt(a.year, 10)
        const bYear = b.year === "No date set" ? Number.POSITIVE_INFINITY : parseInt(b.year, 10)
        return aYear - bYear
      })
  }, [filteredAndPaginatedEvents.events])

  // Helper functions for UX enhancements
  const handleLoadMore = () => {
    setItemsToShow(prev => prev + ITEMS_PER_PAGE)
  }

  const handleClearFilters = () => {
    setSearchQuery("")
    setCategoryFilter("all")
    setYearFilter("all")
    setItemsToShow(ITEMS_PER_PAGE)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setItemsToShow(ITEMS_PER_PAGE) // Reset pagination when searching
  }

  const handleCategoryFilter = (category: TimelineCategory | "all") => {
    setCategoryFilter(category)
    setItemsToShow(ITEMS_PER_PAGE) // Reset pagination when filtering
  }

  const handleYearFilter = (year: string) => {
    setYearFilter(year)
    setItemsToShow(ITEMS_PER_PAGE) // Reset pagination when filtering
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

  const toggleEventDetails = (eventId: string) => {
    setExpandedEvents((prev) => ({
      ...prev,
      [eventId]: !prev[eventId]
    }))
  }

  const truncateText = (text: string, length = 200) => {
    if (!text) return ""
    return text.length > length ? `${text.slice(0, length)}…` : text
  }


  const handleStageClick = (stage: typeof timelineStages[0]) => {
    setForm({
      title: stage.title,
      description: "",
      date: "",
      category: stage.category,
      selectedMediaId: "",
      galleryMediaIds: [],
    })
    setSelectedStage(stage.id)
    setEditingEvent(null)
    setIsModalOpen(true)
  }

  const handleEditEvent = (event: TimelineEvent) => {
    setForm({
      title: event.title,
      description: event.description || "",
      date: event.event_date || "",
      category: event.category,
      selectedMediaId: event.media_id || event.gallery_media_ids?.[0] || "",
      galleryMediaIds: Array.isArray(event.gallery_media_ids)
        ? event.gallery_media_ids.filter((id): id is string => Boolean(id))
        : event.media_id
          ? [event.media_id]
          : [],
    })
    setEditingEvent(event)
    setSelectedStage(null)
    resetMediaState()
    setIsModalOpen(true)
  }

  const resetMediaState = () => {
    setMediaFiles([])
    setMediaPreviews([])
    setYoutubeUrl("")
    setMediaUploadMode("select")
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


  const resetForm = () => {
    setForm({
      title: "",
      description: "", 
      date: "",
      category: "milestone",
      selectedMediaId: "",
      galleryMediaIds: [],
    })
    setSelectedStage(null)
    setEditingEvent(null)
    resetMediaState()
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this timeline event?')) {
      return
    }

    try {
      const response = await fetch(`/api/memorials/${memorialId}/timeline/${eventId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to delete timeline event')
      }

      // Remove the event from the local state
      const updatedEvents = events.filter(event => event.id !== eventId)
      onEventsChange?.(updatedEvents)

    } catch (error) {
      console.error('Failed to delete timeline event:', error)
      alert('Failed to delete timeline event. Please try again.')
    }
  }

  const handleRemoveEventMedia = async (eventId: string, mediaId?: string) => {
    const targetEvent = events.find((event) => event.id === eventId)
    if (!targetEvent) return

    const removeId = mediaId || targetEvent.media_id
    if (!removeId) return

    if (!confirm('Remove this photo or video from this timeline entry?')) {
      return
    }

    const remainingGallery = Array.isArray(targetEvent.gallery_media_ids)
      ? targetEvent.gallery_media_ids.filter((id) => id && id !== removeId)
      : []
    const newCover = removeId === targetEvent.media_id ? (remainingGallery[0] || null) : targetEvent.media_id

    try {
      const response = await fetch(`/api/memorials/${memorialId}/timeline/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: targetEvent.title,
          description: targetEvent.description ?? null,
          event_date: targetEvent.event_date ?? null,
          category: targetEvent.category,
          media_id: newCover,
          gallery_media_ids: remainingGallery
        })
      })

      if (!response.ok) {
        throw new Error('Failed to detach media from timeline event')
      }

      const updatedEvents = events.map((event) =>
        event.id === eventId
          ? {
              ...event,
              media_id: newCover,
              gallery_media_ids: remainingGallery,
            }
          : event
      )
      onEventsChange?.(updatedEvents)
    } catch (error) {
      console.error('Failed to remove media from timeline event:', error)
      alert('Could not remove this photo or video. Please try again.')
    }
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

      if (editingEvent) {
        // Update existing event
        const response = await fetch(`/api/memorials/${memorialId}/timeline/${editingEvent.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            title: form.title.trim(),
            description: form.description.trim() || null,
            event_date: form.date.trim(),
            category: form.category,
            media_id: finalMediaId || null,
            gallery_media_ids: galleryIds,
          })
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to update timeline event')
        }
        
        // Update the event in the local state and maintain chronological order
        const updatedEvents = events.map(event => 
          event.id === editingEvent.id 
            ? {
                ...event,
                title: form.title.trim(),
                description: form.description.trim() || "",
                event_date: form.date || null,
                category: form.category,
                media_id: finalMediaId || null,
                gallery_media_ids: galleryIds,
              }
            : event
        ).sort((a, b) => {
          const dateA = a.event_date ? new Date(a.event_date).getTime() : 0
          const dateB = b.event_date ? new Date(b.event_date).getTime() : 0
          return dateA - dateB
        })
        onEventsChange?.(updatedEvents)
        
      } else {
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
      }
      
      resetForm()
      setIsModalOpen(false)
      
    } catch (error) {
      console.error(`Failed to ${editingEvent ? 'update' : 'create'} timeline event:`, error)
      alert(`Failed to ${editingEvent ? 'update' : 'create'} timeline event. Please try again.`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatEventDate = (dateString: string | null) => {
    if (!dateString) return "Date not specified"
    try {
      // Handle YYYY-MM format from month input
      if (dateString.match(/^\d{4}-\d{2}$/)) {
        const [year, month] = dateString.split('-')
        const date = new Date(parseInt(year), parseInt(month) - 1, 1)
        return format(date, "MMMM yyyy")
      }
      // Handle full date format for backwards compatibility
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return "Date not specified"
      return format(date, "MMMM yyyy")
    } catch {
      return "Date not specified" 
    }
  }

  const getCategoryConfig = (category: TimelineCategory) => {
    return categoryConfig[category] || categoryConfig.milestone
  }

  // Helper function to validate YouTube URLs
  const isYouTubeUrl = (url: string) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]{11}/
    return youtubeRegex.test(url)
  }

  const renderEventCard = (event: TimelineEvent, index: number, isLeft: boolean) => {
    const config = getCategoryConfig(event.category)
    const Icon = config.icon
    // Default to expanded so memories are visible until the user hides them
    const isExpanded = expandedEvents[event.id] ?? true
    const eventDate = event.event_date ? formatEventDate(event.event_date) : null

    return (
      <div 
        key={event.id} 
        className={`flex ${isLeft ? 'justify-start' : 'justify-end'} mb-8 md:mb-16`}
      >
        <div className={`w-full md:w-[45%] max-w-lg ${isLeft ? 'md:pr-8' : 'md:pl-8'} group`}>
          <div className="space-y-2 md:space-y-3">
            {eventDate && (
              <p className="text-xs md:text-sm font-semibold text-blue-800 mb-1">
                {eventDate}
              </p>
            )}
            <h5 className="font-serif text-lg md:text-xl lg:text-2xl font-semibold text-slate-900 leading-tight group-hover:text-blue-700 transition-colors">
              {event.title}
            </h5>
            {event.description && (
              <p className="text-slate-600 leading-relaxed text-sm md:text-[15px] lg:text-base">
                {isExpanded ? event.description : truncateText(event.description, 200)}
              </p>
            )}
            
            {isExpanded && (
              <div className="mt-3 md:mt-4">
                <TimelineEventMedia
                  eventId={event.id}
                  eventTitle={event.title}
                  eventDate={event.event_date}
                  primaryMediaId={event.media_id}
                  galleryMediaIds={event.gallery_media_ids || []}
                  allMedia={media.map(m => ({ ...m, created_at: m.created_at || new Date().toISOString() }))}
                  canEdit={canEdit}
                  onRemoveMedia={(mediaId) => handleRemoveEventMedia(event.id, mediaId)}
                />
              </div>
            )}

            {canEdit && (
              <div className="flex items-center gap-2 mt-3 md:mt-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex-wrap">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => toggleEventDetails(event.id)}
                  className="text-blue-600 hover:text-blue-700 h-9 md:h-8 text-xs touch-manipulation"
                >
                  {isExpanded ? "Hide details" : "View details"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEditEvent(event)}
                  className="text-blue-600 hover:text-blue-700 h-9 md:h-8 text-xs touch-manipulation"
                >
                  <Edit className="h-3 w-3 mr-1" aria-hidden />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteEvent(event.id)}
                  className="text-red-600 hover:text-red-700 h-9 md:h-8 text-xs touch-manipulation"
                >
                  <Trash2 className="h-3 w-3 mr-1" aria-hidden />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
      <div className="w-full">
      <div className="mb-8 md:mb-12">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div>
            <h2 className="font-serif text-xl md:text-2xl lg:text-3xl text-slate-900 mb-1 md:mb-2">Life remembered</h2>
            <p className="text-blue-600 text-xs md:text-sm">
              {filteredAndPaginatedEvents.totalUnfiltered} {filteredAndPaginatedEvents.totalUnfiltered === 1 ? 'memory' : 'memories'}
              {availableYears.length > 0 && ` · ${availableYears.length} ${availableYears.length === 1 ? 'year' : 'years'}`}
            </p>
          </div>
        </div>

        {(searchQuery || categoryFilter !== "all" || yearFilter !== "all") && (
          <div className="mb-6 md:mb-8 flex items-center gap-2 md:gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[180px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden />
              <Input
                placeholder="Search memories..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 border-slate-300 h-10 md:h-10 text-base"
              />
            </div>
            {(categoryFilter !== "all" || yearFilter !== "all" || searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-slate-600 hover:text-slate-900 h-10 md:h-9 touch-manipulation"
              >
                <X className="h-4 w-4 mr-1" />
                Clear filters
              </Button>
            )}
          </div>
        )}
      </div>
      
      <div className="space-y-10">
        {!hasVisibleEvents && (
          <div className="py-16 text-center">
            <p className="text-blue-600 mb-6">
              No memories yet. Begin the story with a treasured moment.
            </p>
            {canEdit && (
              <Button
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
                onClick={() => {
                  resetForm()
                  setIsModalOpen(true)
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add the first memory
              </Button>
            )}
          </div>
        )}


        {hasVisibleEvents && (
          <div className="relative rounded-xl md:rounded-2xl bg-gradient-to-b from-blue-50/50 via-white to-blue-50/30 px-3 py-6 md:px-8 md:py-12 border border-blue-100/50">
            {/* Vertical timeline line - hidden on mobile */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-blue-300/60 -translate-x-1/2 z-0" aria-hidden />
            
            {groupedEvents.map((group, groupIndex) => (
              <div key={group.year} className="relative mb-16 md:mb-32 last:mb-0">
                {/* Year separator - only show if not the first year */}
                {groupIndex > 0 && (
                  <div className="relative mb-12 md:mb-20 mt-6 md:mt-12">
                    <div className="absolute left-1/2 -translate-x-1/2 w-full flex items-center z-10">
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-blue-300/60 to-transparent"></div>
                      <div className="mx-2 md:mx-4 px-3 md:px-4 py-1 md:py-1.5 bg-white rounded-full border border-blue-200/60 shadow-sm">
                        <span className="text-xs md:text-sm font-semibold text-blue-700 whitespace-nowrap">
                          {group.year}
                        </span>
                      </div>
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-blue-300/60 to-transparent"></div>
                    </div>
                  </div>
                )}
                
                {/* Year in background */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full pointer-events-none z-0">
                  <div className="text-[80px] md:text-[180px] lg:text-[240px] font-bold text-blue-200/30 md:text-blue-200/40 leading-none tracking-tight text-center select-none">
                    {group.year}
                  </div>
                </div>
                
                {/* Events container */}
                <div className="relative z-10 pt-6 md:pt-16">
                  {group.items.map((event, eventIndex) => {
                    // Alternate left/right for each event using global index across all years
                    const globalIndex = groupedEvents.slice(0, groupIndex).reduce((acc, g) => acc + g.items.length, 0) + eventIndex
                    const isLeft = globalIndex % 2 === 0
                    const isLastInGroup = eventIndex === group.items.length - 1
                    return (
                      <div key={event.id} className="relative">
                        {renderEventCard(event, globalIndex, isLeft)}
                        {/* Add prompt between events */}
                        {canEdit && !isLastInGroup && (
                          <div className="flex justify-center md:absolute md:left-1/2 md:-translate-x-1/2 top-full mt-4 mb-4 md:mt-6 md:mb-6 z-20">
                            <button
                              onClick={() => {
                                resetForm()
                                setIsModalOpen(true)
                              }}
                              className="flex items-center justify-center w-11 h-11 md:w-10 md:h-10 rounded-full bg-white border-2 border-blue-300 hover:border-blue-500 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-110 touch-manipulation"
                              aria-label="Add memory"
                            >
                              <Plus className="h-5 w-5 text-blue-600 hover:text-blue-700 transition-colors" />
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {/* Add prompt at end of year group */}
                  {canEdit && group.items.length > 0 && (
                    <div className="flex justify-center md:absolute md:left-1/2 md:-translate-x-1/2 top-full mt-6 md:mt-8 mb-4 z-20">
                      <button
                        onClick={() => {
                          resetForm()
                          setIsModalOpen(true)
                        }}
                        className="flex items-center justify-center w-12 h-12 rounded-full bg-white border-2 border-blue-400 hover:border-blue-600 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110 touch-manipulation"
                        aria-label="Add memory"
                      >
                        <Plus className="h-6 w-6 text-blue-600 hover:text-blue-700 transition-colors" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {filteredAndPaginatedEvents.hasMore && (
          <div className="text-center pt-8">
            <Button 
              onClick={handleLoadMore}
              variant="ghost"
              className="text-blue-600 hover:text-blue-700"
            >
              Load more ({filteredAndPaginatedEvents.totalFiltered - itemsToShow} remaining)
            </Button>
          </div>
        )}

        {/* Add prompt at end of timeline */}
        {canEdit && hasVisibleEvents && (
          <div className="relative mt-8 md:mt-16">
            <div className="flex justify-center md:absolute md:left-1/2 md:-translate-x-1/2 top-0 z-20 pt-6 md:pt-0">
              <button
                onClick={() => {
                  resetForm()
                  setIsModalOpen(true)
                }}
                className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full bg-white border-2 border-blue-500 hover:border-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 touch-manipulation"
                aria-label="Add another memory"
              >
                <Plus className="h-6 w-6 md:h-7 md:w-7 text-blue-600 hover:text-blue-700 transition-colors" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Add Event Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-6xl w-full h-full md:h-auto md:max-h-[90vh] overflow-y-auto top-0 md:top-[52%] rounded-none md:rounded-lg p-4 md:p-6">
          <DialogHeader className="pb-4 md:pb-6">
            <DialogTitle className="font-serif text-2xl md:text-3xl font-semibold text-slate-900">
              {editingEvent ? "Edit Memory" : "Add a Memory"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 md:space-y-8">
            {/* Title Field */}
            <div className="space-y-2 md:space-y-3">
              <Label htmlFor="title" className="text-sm md:text-base font-semibold text-slate-900">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-2 md:space-y-3">
                <Label htmlFor="date" className="text-sm md:text-base font-semibold text-slate-900">
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
              
              <div className="space-y-2 md:space-y-3">
                <Label htmlFor="category" className="text-sm md:text-base font-semibold text-slate-900">
                  Type of memory
                </Label>
                <Select 
                  value={form.category} 
                  onValueChange={(value: TimelineCategory) => setForm(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key} className="text-base py-3">
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Description */}
            <div className="space-y-2 md:space-y-3">
              <Label htmlFor="description" className="text-sm md:text-base font-semibold text-slate-900">
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
              
              {/* Media Mode Selection - Simplified */}
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
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 md:gap-4 pt-4 md:pt-6 border-t border-slate-200">
              <Button
                variant="outline"
                onClick={() => {
                  resetForm()
                  setIsModalOpen(false)
                }}
                disabled={isSubmitting}
                size="lg"
                className="h-12 px-6 md:px-8 text-base touch-manipulation w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !form.title.trim() || !form.date || !form.date.trim()}
                size="lg"
                className="h-12 px-6 md:px-8 text-base bg-[#1B3B5F] hover:bg-[#1B3B5F]/90 touch-manipulation w-full sm:w-auto"
              >
                {isSubmitting 
                  ? uploadingMedia 
                    ? "Uploading..." 
                    : (editingEvent ? "Saving..." : "Adding...")
                  : (editingEvent ? "Save Changes" : "Add Memory")
                }
              </Button>
            </div>
          </div>
          </DialogContent>
        </Dialog>
    </div>
  )
}
