"use client"

import { useState, useEffect } from "react"
import Timeline from "./timeline"

interface TimelineEvent {
  id: string
  title: string
  description: string
  event_date: string | null
  category: "milestone" | "achievement" | "memory" | "celebration"
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

interface TimelineWrapperProps {
  memorialId: string
  canEdit?: boolean
  media?: MediaItem[]
  onMediaUpload?: (newMedia: MediaItem) => void
}

export default function TimelineWrapper({ memorialId, canEdit = false, media = [], onMediaUpload }: TimelineWrapperProps) {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-600">Loading timeline...</div>
      </div>
    )
  }

  return (
    <Timeline
      memorialId={memorialId}
      events={events}
      media={media}
      canEdit={canEdit}
      onEventsChange={setEvents}
      onMediaUpload={onMediaUpload}
    />
  )
}
