"use client"

import { useState, useEffect } from "react"
import { InteractiveTimeline } from "./interactive-timeline"
import Timeline from "./timeline"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"

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

interface TimelineWrapperProps {
  memorialId: string
  canEdit?: boolean
  media?: MediaItem[]
  onMediaUpload?: (newMedia: MediaItem) => void
  onCountChange?: (count: number) => void
  externalModalOpen?: boolean
  onExternalModalClose?: () => void
}

export default function TimelineWrapper({ memorialId, canEdit = false, media = [], onMediaUpload, onCountChange, externalModalOpen, onExternalModalClose }: TimelineWrapperProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)

  // Load timeline events
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const response = await fetch(`/api/memorials/${memorialId}/timeline`)
        if (response.ok) {
          const data = await response.json()
          setEvents(Array.isArray(data) ? data : [])
        } else {
          console.error('Failed to load timeline events')
          setEvents([])
        }
      } catch (error) {
        console.error('Error loading timeline events:', error)
        setEvents([])
      } finally {
        setLoading(false)
      }
    }

    if (memorialId) {
      loadEvents()
    }
  }, [memorialId])

  useEffect(() => {
    onCountChange?.(events.length)
  }, [events, onCountChange])

  const handleEventsChange = (newEvents: TimelineEvent[]) => {
    setEvents(newEvents)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-lg">Loading timeline...</span>
        </div>
      </div>
    )
  }

  // Always show interactive timeline - it handles empty state

  // If no events and can't edit, show empty state
  if (events.length === 0) {
    return (
      <div className="py-24 text-center bg-white/60 backdrop-blur-sm rounded-3xl border border-slate-200/50 shadow-xl">
        <p className="text-slate-600 text-xl font-light mb-2">No timeline events yet.</p>
        <p className="text-slate-500 text-base">Memories will appear here as they're added.</p>
      </div>
    )
  }


  // Otherwise show interactive timeline
  return (
    <InteractiveTimeline
      events={events}
      media={media}
      canEdit={canEdit}
      memorialId={memorialId}
      onEventsChange={handleEventsChange}
      onMediaUpload={onMediaUpload}
      externalModalOpen={externalModalOpen}
      onExternalModalClose={onExternalModalClose}
    />
  )
}
