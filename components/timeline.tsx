"use client"

import { useState, useMemo } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, MapPin, Heart, Star, BookOpen, PartyPopper, Plus, Upload, X, Trash2, Edit, ImageIcon, Video, FileText, Link, Filter, Search, ChevronDown, Grid, List } from "lucide-react"
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
  created_at: string
}

interface MediaItem {
  id: string
  file_url: string
  file_type: "image" | "video" | "document"
  title?: string | null
  description?: string | null
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
    color: "bg-indigo-500",
    bgColor: "bg-indigo-50",
    textColor: "text-indigo-800",
    borderColor: "border-indigo-300"
  },
  achievement: {
    label: "Achievement", 
    icon: Star,
    color: "bg-amber-500",
    bgColor: "bg-amber-50",
    textColor: "text-amber-800",
    borderColor: "border-amber-300"
  },
  memory: {
    label: "Memory",
    icon: BookOpen,
    color: "bg-rose-500", 
    bgColor: "bg-rose-50",
    textColor: "text-rose-800",
    borderColor: "border-rose-300"
  },
  celebration: {
    label: "Celebration",
    icon: PartyPopper,
    color: "bg-emerald-500",
    bgColor: "bg-emerald-50", 
    textColor: "text-emerald-800",
    borderColor: "border-emerald-300"
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
  const [viewMode, setViewMode] = useState<"full" | "compact">("full")
  const [showFilters, setShowFilters] = useState(false)
  const [itemsToShow, setItemsToShow] = useState(10)
  const ITEMS_PER_PAGE = 10
  
  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "", 
    category: "milestone" as TimelineCategory,
    selectedMediaId: ""
  })

  // Media upload state
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string>("")
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

  // Always show template for better UX
  const showTemplate = true

  // Helper function to get media item by ID
  const getMediaById = (mediaId: string | null) => {
    if (!mediaId) return null
    return media.find(item => item.id === mediaId) || null
  }

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


  const handleStageClick = (stage: typeof timelineStages[0]) => {
    setForm({
      title: stage.title,
      description: "",
      date: "",
      category: stage.category,
      selectedMediaId: ""
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
      selectedMediaId: event.media_id || ""
    })
    setEditingEvent(event)
    setSelectedStage(null)
    resetMediaState()
    setIsModalOpen(true)
  }

  const resetMediaState = () => {
    setMediaFile(null)
    setMediaPreview("")
    setYoutubeUrl("")
    setMediaUploadMode("select")
  }

  const handleMediaFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      alert('Please select an image or video file')
      return
    }
    
    // Validate file size
    const maxSize = file.type.startsWith('image/') ? 10 * 1024 * 1024 : 500 * 1024 * 1024
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024))
      alert(`File too large. Maximum size: ${maxSizeMB}MB`)
      return
    }
    
    setMediaFile(file)
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setMediaPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setMediaPreview("")
    }
  }


  const resetForm = () => {
    setForm({
      title: "",
      description: "", 
      date: "",
      category: "milestone",
      selectedMediaId: ""
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

      // Handle direct media upload
      if (mediaUploadMode === "upload" && mediaFile) {
        setUploadingMedia(true)
        try {
          // Upload file to media system
          const formData = new FormData()
          formData.append('file', mediaFile)
          formData.append('title', `Timeline: ${form.title}`)
          formData.append('description', form.description || '')
          
          const uploadResponse = await fetch(`/api/memorials/${memorialId}/media/upload`, {
            method: 'POST',
            body: formData,
          })
          
          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json()
            const fileUrl = uploadData.items?.[0]?.file_url || uploadData.file_url || uploadData.url
            
            if (fileUrl) {
              // Save to media database
              const mediaResponse = await fetch(`/api/memorials/${memorialId}/media`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  items: [{
                    file_url: fileUrl,
                    file_type: mediaFile.type.startsWith('image/') ? 'image' : 'video',
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
                  finalMediaId = newMediaItem.id
                  // Notify parent component about new media
                  onMediaUpload?.(newMediaItem)
                }
              }
            }
          } else {
            throw new Error('Failed to upload media')
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
              finalMediaId = newMediaItem.id
              // Notify parent component about new media
              onMediaUpload?.(newMediaItem)
            }
          }
        } catch (error) {
          console.error('YouTube URL save failed:', error)
          alert('Failed to save YouTube video. Please try again.')
          return
        }
      }

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
            media_id: finalMediaId || null
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
                description: form.description.trim() || null,
                event_date: form.date || null,
                category: form.category,
                media_id: finalMediaId || null
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
          media_id: finalMediaId || null
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

  return (
    <Card className="border-0 shadow-lg bg-white">
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between mb-6">
          <CardTitle className="font-serif text-2xl font-semibold text-slate-900">Life Timeline</CardTitle>
          <div className="flex items-center gap-2">
            {events.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            )}
            {canEdit && !showTemplate && (
              <Button onClick={() => setIsModalOpen(true)} size="sm" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Event
              </Button>
            )}
          </div>
        </div>

        {/* Filter Controls */}
        {showFilters && events.length > 0 && (
          <div className="space-y-4 p-4 bg-slate-50 rounded-lg border">
            <div className="flex flex-wrap items-center gap-4">
              {/* Search */}
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search timeline events..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={handleCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.entries(categoryConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Year Filter */}
              {availableYears.length > 0 && (
                <Select value={yearFilter} onValueChange={handleYearFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {availableYears.map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 border rounded-md">
                <Button
                  variant={viewMode === "full" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("full")}
                  className="rounded-r-none"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "compact" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("compact")}
                  className="rounded-l-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
              </div>

              {/* Clear Filters */}
              {(searchQuery || categoryFilter !== "all" || yearFilter !== "all") && (
                <Button variant="outline" size="sm" onClick={handleClearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>

            {/* Quick Year Navigation */}
            {availableYears.length > 0 && (
              <div className="border-t pt-3">
                <div className="text-xs text-slate-500 mb-2">Quick jump to decade:</div>
                <div className="flex flex-wrap gap-1">
                  {Array.from(new Set(availableYears.map(year => Math.floor(year / 10) * 10))).map(decade => (
                    <Button
                      key={decade}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Find first year in this decade that has events
                        const yearInDecade = availableYears.find(year => Math.floor(year / 10) * 10 === decade)
                        if (yearInDecade) {
                          handleYearFilter(yearInDecade.toString())
                        }
                      }}
                      className="text-xs px-2 py-1 h-6"
                    >
                      {decade}s
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Results Summary */}
            <div className="text-sm text-slate-600">
              {filteredAndPaginatedEvents.totalFiltered !== filteredAndPaginatedEvents.totalUnfiltered ? (
                <span>
                  Showing {Math.min(itemsToShow, filteredAndPaginatedEvents.totalFiltered)} of {filteredAndPaginatedEvents.totalFiltered} filtered events 
                  ({filteredAndPaginatedEvents.totalUnfiltered} total)
                </span>
              ) : (
                <span>
                  Showing {Math.min(itemsToShow, filteredAndPaginatedEvents.totalFiltered)} of {filteredAndPaginatedEvents.totalFiltered} events
                </span>
              )}
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-8">
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h3 className="font-serif text-xl text-slate-800 mb-2">Life Timeline</h3>
            <p className="text-slate-600">Click on any life stage to add events, or create custom events.</p>
          </div>
          
          {/* Combined Timeline - Chronologically ordered events and template stages */}
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200"></div>

            <div className="space-y-6">
              {(() => {
                // Create a combined list of events and template stages, sorted chronologically
                const items = []
                
                // Add filtered events instead of all events
                filteredAndPaginatedEvents.events.forEach(event => {
                  items.push({
                    type: 'event',
                    data: event,
                    sortDate: event.event_date ? new Date(event.event_date).getTime() : Date.now()
                  })
                })
                
                // Add template stages that don't have matching events
                timelineStages.forEach(stage => {
                  const hasMatchingEvent = events.some(event => 
                    event.category === stage.category && 
                    (event.title.toLowerCase().includes(stage.title.toLowerCase().split(' ')[0]) ||
                     stage.title.toLowerCase().includes(event.title.toLowerCase().split(' ')[0]))
                  )
                  
                  if (!hasMatchingEvent) {
                    // For template stages without events, use a default sort position based on typical life stage timing
                    const stageSortDates = {
                      'Early Life': new Date('1950-01-01').getTime(),
                      'Education': new Date('1970-01-01').getTime(),
                      'Career': new Date('1990-01-01').getTime(),
                      'Family Life': new Date('1995-01-01').getTime(),
                      'Achievements': new Date('2000-01-01').getTime(),
                      'Retirement': new Date('2015-01-01').getTime(),
                      'Later Years': new Date('2020-01-01').getTime()
                    }
                    
                    items.push({
                      type: 'template',
                      data: stage,
                      sortDate: stageSortDates[stage.title] || Date.now()
                    })
                  }
                })
                
                // Sort all items chronologically
                return items.sort((a, b) => a.sortDate - b.sortDate).map((item, index) => {
                  if (item.type === 'event') {
                    const event = item.data as TimelineEvent
                    const config = getCategoryConfig(event.category)
                    const Icon = config.icon
                    
                    if (viewMode === 'compact') {
                      // Compact view rendering
                      return (
                        <div key={event.id} className="relative flex items-center space-x-4 py-2">
                          {/* Small timeline dot */}
                          <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow-sm ${config.color}`}>
                            <Icon className="h-3 w-3 text-white" />
                          </div>

                          {/* Compact event content */}
                          <div className="flex-1 min-w-0">
                            <div className="bg-white rounded-md p-3 shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-200">
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-serif text-sm font-semibold text-slate-900 truncate">
                                    {event.title}
                                  </h4>
                                  <div className="flex items-center space-x-3 text-xs text-slate-600 mt-1">
                                    <span>{formatEventDate(event.event_date)}</span>
                                    <Badge variant="outline" className={`text-xs ${config.bgColor} ${config.textColor} ${config.borderColor}`}>
                                      {config.label}
                                    </Badge>
                                  </div>
                                </div>
                                {canEdit && (
                                  <div className="flex gap-1 ml-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleEditEvent(event)}
                                      className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleDeleteEvent(event.id)}
                                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    
                    // Full view rendering (existing)
                    return (
                    <div key={event.id} className="relative flex items-start space-x-6">
                      {/* Timeline dot */}
                      <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-4 border-white shadow-lg ${config.color}`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>

                      {/* Event content */}
                      <div className="flex-1 min-w-0 pb-6">
                        <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-200">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-serif text-lg font-semibold text-slate-900 mb-1">
                                {event.title}
                              </h3>
                              <div className="flex items-center space-x-4 text-sm text-slate-600">
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>{formatEventDate(event.event_date)}</span>
                                </div>
                              </div>
                            </div>
                            <Badge variant="outline" className={`${config.bgColor} ${config.textColor} ${config.borderColor}`}>
                              {config.label}
                            </Badge>
                          </div>

                          {event.description && (
                            <p className="text-slate-700 leading-relaxed mb-4">{event.description}</p>
                          )}

                          {/* Event media - only in full view */}
                          <TimelineEventMedia
                            eventId={event.id}
                            eventTitle={event.title}
                            eventDate={event.event_date}
                            primaryMediaId={event.media_id}
                            allMedia={media}
                          />

                          {/* Action buttons */}
                          {canEdit && (
                            <div className="flex justify-end gap-2 pt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditEvent(event)}
                                className="text-blue-600 hover:text-blue-700 hover:border-blue-300 hover:bg-blue-50"
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteEvent(event.id)}
                                className="text-red-600 hover:text-red-700 hover:border-red-300 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    )
                  } else {
                    // Template stage without events
                    const stage = item.data as any
                    const config = getCategoryConfig(stage.category)
                    const Icon = config.icon
                    
                    return (
                      <div key={stage.title} className="relative flex items-start space-x-6">
                        {/* Timeline dot */}
                        <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-4 border-white shadow-lg ${config.color}`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>

                        {/* Stage content */}
                        <div className="flex-1 min-w-0 pb-6">
                          <div 
                            className="bg-gradient-to-br from-slate-50 to-white rounded-lg p-6 border border-dashed border-slate-300 hover:border-slate-400 hover:shadow-md transition-all duration-200 cursor-pointer group"
                            onClick={() => canEdit && handleStageClick(stage)}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h3 className="font-serif text-lg font-semibold text-slate-800 group-hover:text-slate-900 transition-colors">
                                  {stage.title}
                                </h3>
                                <p className="text-sm text-slate-600 group-hover:text-slate-700 mt-1 transition-colors">
                                  {stage.description}
                                </p>
                              </div>
                              <Badge variant="outline" className={`${config.bgColor} ${config.textColor} ${config.borderColor}`}>
                                {config.label}
                              </Badge>
                            </div>
                            
                            {canEdit && (
                              <div className="flex items-center justify-center py-4 text-slate-500 group-hover:text-slate-700 transition-colors">
                                <div className="flex items-center space-x-2">
                                  <Calendar className="h-4 w-4" />
                                  <span className="text-sm font-medium">Click to add details</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  }
                })
              })()}
            </div>
          </div>
          
          {/* Load More Button */}
          {filteredAndPaginatedEvents.hasMore && (
            <div className="text-center pt-6">
              <Button 
                onClick={handleLoadMore}
                variant="outline"
                className="text-slate-600 hover:text-slate-900"
              >
                <ChevronDown className="h-4 w-4 mr-2" />
                Load More Events ({filteredAndPaginatedEvents.totalFiltered - itemsToShow} remaining)
              </Button>
            </div>
          )}

          {/* Add Custom Event Button */}
          {canEdit && (
            <div className="text-center pt-6">
              <Button 
                onClick={() => setIsModalOpen(true)} 
                variant="outline" 
                className="text-slate-600 hover:text-slate-900"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Custom Event
              </Button>
            </div>
          )}
        </div>
      </CardContent>

      {/* Add Event Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-semibold">
              {editingEvent ? "Edit Timeline Event" : selectedStage ? "Add Life Event" : "Add Timeline Event"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Graduated from University"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="month"
                    value={form.date}
                    onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))}
                    placeholder="YYYY-MM"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={form.category} 
                    onValueChange={(value: TimelineCategory) => setForm(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Tell the story of this moment..."
                  rows={3}
                />
              </div>

              {/* Media Selection */}
              <div className="space-y-4">
                <Label>Photo or Video (Optional)</Label>
                
                {/* Media Mode Selection */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={mediaUploadMode === "select" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMediaUploadMode("select")}
                    className="flex items-center gap-2"
                  >
                    <ImageIcon className="h-4 w-4" />
                    Select Existing
                  </Button>
                  <Button
                    type="button"
                    variant={mediaUploadMode === "upload" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMediaUploadMode("upload")}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Upload New
                  </Button>
                  <Button
                    type="button"
                    variant={mediaUploadMode === "youtube" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMediaUploadMode("youtube")}
                    className="flex items-center gap-2"
                  >
                    <Link className="h-4 w-4" />
                    YouTube URL
                  </Button>
                </div>

                {/* Select Existing Media */}
                {mediaUploadMode === "select" && (
                  <Select 
                    value={form.selectedMediaId || "none"} 
                    onValueChange={(value) => setForm(prev => ({ ...prev, selectedMediaId: value === "none" ? "" : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select existing media" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <div className="flex items-center gap-2">
                          <X className="h-4 w-4" />
                          No media
                        </div>
                      </SelectItem>
                      {media.length > 0 ? (
                        media.map((mediaItem) => (
                          <SelectItem key={mediaItem.id} value={mediaItem.id}>
                            <div className="flex items-center gap-2">
                              {mediaItem.file_type === "video" ? (
                                <Video className="h-4 w-4 text-blue-600" />
                              ) : mediaItem.file_type === "document" ? (
                                <FileText className="h-4 w-4 text-gray-600" />
                              ) : (
                                <ImageIcon className="h-4 w-4 text-green-600" />
                              )}
                              {mediaItem.title || `${mediaItem.file_type} file`}
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-media-available" disabled>
                          <div className="flex items-center gap-2">
                            <X className="h-4 w-4" />
                            No media available
                          </div>
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}

                {/* Upload New Media */}
                {mediaUploadMode === "upload" && (
                  <div className="space-y-3">
                    {mediaPreview ? (
                      <div className="relative">
                        <img
                          src={mediaPreview}
                          alt="Preview"
                          className="w-full h-32 object-cover rounded-lg border border-slate-200"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            setMediaFile(null)
                            setMediaPreview("")
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : mediaFile ? (
                      <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border">
                        <Video className="h-5 w-5 text-blue-600" />
                        <span className="text-sm font-medium">{mediaFile.name}</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setMediaFile(null)
                            setMediaPreview("")
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                        <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm text-slate-600 mb-2">Upload a photo or video</p>
                        <Input
                          type="file"
                          accept="image/*,video/*"
                          onChange={handleMediaFileSelect}
                          className="max-w-xs mx-auto"
                        />
                        <p className="text-xs text-slate-500 mt-2">
                          Images up to 10MB, videos up to 500MB
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* YouTube URL */}
                {mediaUploadMode === "youtube" && (
                  <div className="space-y-2">
                    <Input
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      type="url"
                    />
                    {youtubeUrl && !isYouTubeUrl(youtubeUrl) && (
                      <p className="text-sm text-red-600">Please enter a valid YouTube URL</p>
                    )}
                    <p className="text-xs text-slate-500">
                      Paste a YouTube video URL. We recommend setting your video as "Unlisted" for privacy.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  resetForm()
                  setIsModalOpen(false)
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !form.title.trim() || !form.date || !form.date.trim()}
              >
                {isSubmitting 
                  ? uploadingMedia 
                    ? "Uploading media..." 
                    : (editingEvent ? "Updating..." : "Adding...")
                  : (editingEvent ? "Update Event" : "Add Event")
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
