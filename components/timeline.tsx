"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Heart, Star, GraduationCap, Briefcase, Users, Baby } from "lucide-react"
import { format } from "date-fns"

interface TimelineEvent {
  id: string
  title: string
  description: string
  date: Date
  type: "birth" | "education" | "career" | "family" | "achievement" | "milestone" | "other"
  location?: string
  photos?: string[]
}

interface TimelineProps {
  events: TimelineEvent[]
  title?: string
  onEdit?: (event: TimelineEvent) => void
  onDelete?: (event: TimelineEvent) => void
  sort?: boolean
  canEdit?: (event: TimelineEvent) => boolean
  canDelete?: (event: TimelineEvent) => boolean
  emptyState?: { title: string; description?: string }
}

const getEventIcon = (type: TimelineEvent["type"]) => {
  switch (type) {
    case "birth":
      return <Baby className="h-5 w-5" />
    case "education":
      return <GraduationCap className="h-5 w-5" />
    case "career":
      return <Briefcase className="h-5 w-5" />
    case "family":
      return <Users className="h-5 w-5" />
    case "achievement":
      return <Star className="h-5 w-5" />
    case "milestone":
      return <Heart className="h-5 w-5" />
    default:
      return <Calendar className="h-5 w-5" />
  }
}

const getEventColor = (type: TimelineEvent["type"]) => {
  switch (type) {
    case "birth":
      return "bg-pink-100 text-pink-700 border-pink-200"
    case "education":
      return "bg-blue-100 text-blue-700 border-blue-200"
    case "career":
      return "bg-emerald-100 text-emerald-700 border-emerald-200"
    case "family":
      return "bg-rose-100 text-rose-700 border-rose-200"
    case "achievement":
      return "bg-amber-100 text-amber-700 border-amber-200"
    case "milestone":
      return "bg-indigo-100 text-indigo-700 border-indigo-200"
    default:
      return "bg-slate-100 text-slate-700 border-slate-200"
  }
}

export default function Timeline({ events, title = "Life Timeline", onEdit, onDelete, sort = true, canEdit, canDelete, emptyState }: TimelineProps) {
  const sortedEvents = sort ? [...events].sort((a, b) => a.date.getTime() - b.date.getTime()) : events

  return (
    <Card className="border-0 shadow-lg bg-white">
      <CardContent className="p-8">
        <h2 className="font-serif text-2xl font-semibold mb-8">{title}</h2>

        {sortedEvents.length === 0 && emptyState ? (
          <div className="rounded-xl border border-dashed border-border p-8 md:p-10 bg-gradient-to-br from-primary/5 to-accent/5">
            <h3 className="font-serif text-xl md:text-2xl text-foreground mb-2">{emptyState.title}</h3>
            {emptyState.description && (
              <p className="text-sm md:text-base text-muted-foreground">{emptyState.description}</p>
            )}
          </div>
        ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border"></div>

          <div className="space-y-8">
            {sortedEvents.map((event, index) => (
              <div key={event.id} className="relative flex items-start space-x-6">
                {/* Timeline dot */}
                <div
                  className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-4 border-white shadow-lg ${getEventColor(event.type).replace("text-", "bg-").replace("border-", "").split(" ")[0]}`}
                >
                  <div className="text-white">{getEventIcon(event.type)}</div>
                </div>

                {/* Event content */}
                <div className="flex-1 min-w-0 pb-8">
                  <div className="bg-memorial-card rounded-lg p-6 shadow-sm border border-border/50">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-serif text-lg font-semibold text-foreground mb-1">{event.title}</h3>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{format(event.date, "MMMM yyyy")}</span>
                          </div>
                          {event.location && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-4 w-4" />
                              <span>{event.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className={getEventColor(event.type)}>
                        {event.type}
                      </Badge>
                    </div>

                    <p className="text-foreground leading-relaxed mb-4">{event.description}</p>

                    {/* Event photos */}
                    {event.photos && event.photos.length > 0 && (
                      <div className="flex space-x-2 overflow-x-auto">
                        {event.photos.slice(0, 3).map((photo, photoIndex) => (
                          <img
                            key={photoIndex}
                            src={photo || "/placeholder.jpg"}
                            alt={`${event.title} photo ${photoIndex + 1}`}
                            className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border border-border"
                          />
                        ))}
                        {event.photos.length > 3 && (
                          <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground border border-border">
                            +{event.photos.length - 3}
                          </div>
                        )}
                      </div>
                    )}

                    {(onEdit || onDelete) && (
                      <div className="mt-4 flex gap-2 justify-end">
                        {onEdit && (!canEdit || canEdit(event)) && (
                          <button
                            aria-label={`Edit ${event.title}`}
                            className="text-sm px-3 py-1 rounded border border-border hover:bg-muted"
                            onClick={() => onEdit(event)}
                          >
                            Edit
                          </button>
                        )}
                        {onDelete && (!canDelete || canDelete(event)) && (
                          <button
                            aria-label={`Delete ${event.title}`}
                            className="text-sm px-3 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50"
                            onClick={() => onDelete(event)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        )}
      </CardContent>
    </Card>
  )
}
