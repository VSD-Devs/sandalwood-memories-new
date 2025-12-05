"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Heart, Star, GraduationCap, Briefcase, Users, Baby, PartyPopper, BookOpen } from "lucide-react"
import { format } from "date-fns"

interface TimelineEvent {
  id: string
  title: string
  description: string
  date: Date
  type: "milestone" | "achievement" | "memory" | "celebration"
  category?: "milestone" | "achievement" | "memory" | "celebration"
  location?: string
  photos?: string[]
}

interface TimelineProps {
  events: TimelineEvent[]
  title?: string
  onEdit?: (event: TimelineEvent) => void
  onDelete?: (event: TimelineEvent) => void
  onAddEvent?: (stageId: string, stageData: any) => void
  sort?: boolean
  canEdit?: (event: TimelineEvent) => boolean
  canDelete?: (event: TimelineEvent) => boolean
  emptyState?: { title: string; description?: string }
}

const getEventIcon = (type: TimelineEvent["type"] | TimelineEvent["category"]) => {
  switch (type) {
    case "achievement":
      return <Star className="h-5 w-5" />
    case "milestone":
      return <Heart className="h-5 w-5" />
    case "memory":
      return <BookOpen className="h-5 w-5" />
    case "celebration":
      return <PartyPopper className="h-5 w-5" />
    default:
      return <Calendar className="h-5 w-5" />
  }
}

const getEventColor = (type: TimelineEvent["type"] | TimelineEvent["category"]) => {
  switch (type) {
    case "achievement":
      return "bg-amber-50 text-amber-800 border-amber-300"
    case "milestone":
      return "bg-indigo-50 text-indigo-800 border-indigo-300"
    case "memory":
      return "bg-rose-50 text-rose-800 border-rose-300"
    case "celebration":
      return "bg-emerald-50 text-emerald-800 border-emerald-300"
    default:
      return "bg-slate-50 text-slate-800 border-slate-300"
  }
}

const getDotColor = (type: TimelineEvent["type"] | TimelineEvent["category"]) => {
  switch (type) {
    case "achievement":
      return "bg-amber-500"
    case "milestone":
      return "bg-indigo-500"
    case "memory":
      return "bg-rose-500"
    case "celebration":
      return "bg-emerald-500"
    default:
      return "bg-slate-500"
  }
}

// Template timeline stages for new memorials
const timelineTemplate = [
  {
    id: "birth",
    title: "Birth",
    description: "Add details about their birth and early life",
    type: "milestone" as const,
    placeholder: true,
    icon: <Baby className="h-5 w-5" />
  },
  {
    id: "childhood",
    title: "Childhood & Early Years", 
    description: "Share memories from their childhood and family life",
    type: "memory" as const,
    placeholder: true,
    icon: <BookOpen className="h-5 w-5" />
  },
  {
    id: "education",
    title: "Education",
    description: "Add their school years, achievements, and learning journey",
    type: "achievement" as const,
    placeholder: true,
    icon: <GraduationCap className="h-5 w-5" />
  },
  {
    id: "career",
    title: "Career & Work Life",
    description: "Highlight their professional journey and accomplishments",
    type: "milestone" as const,
    placeholder: true,
    icon: <Briefcase className="h-5 w-5" />
  },
  {
    id: "family-life",
    title: "Family Life",
    description: "Important family milestones, relationships, and celebrations",
    type: "celebration" as const,
    placeholder: true,
    icon: <PartyPopper className="h-5 w-5" />
  },
  {
    id: "achievements",
    title: "Major Achievements",
    description: "Special accomplishments, awards, and proud moments",
    type: "achievement" as const,
    placeholder: true,
    icon: <Star className="h-5 w-5" />
  },
  {
    id: "later-years",
    title: "Later Years",
    description: "Retirement, hobbies, and golden years memories",
    type: "memory" as const,
    placeholder: true,
    icon: <BookOpen className="h-5 w-5" />
  }
]

export default function Timeline({ events, title = "Life Timeline", onEdit, onDelete, onAddEvent, sort = true, canEdit, canDelete, emptyState }: TimelineProps) {
  const sortedEvents = sort ? [...events].sort((a, b) => {
    const aTime = a.date && !isNaN(a.date.getTime()) ? a.date.getTime() : 0
    const bTime = b.date && !isNaN(b.date.getTime()) ? b.date.getTime() : 0
    return aTime - bTime
  }) : events
  const showTemplate = sortedEvents.length === 0

  return (
    <Card className="border-0 shadow-lg bg-white">
      <CardContent className="p-8">
        <h2 className="font-serif text-2xl font-semibold mb-8">{title}</h2>

        {showTemplate ? (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="font-serif text-xl text-foreground mb-2">Create Their Life Story</h3>
              <p className="text-muted-foreground">Add key moments and milestones to build a beautiful timeline</p>
            </div>
            
            {/* Template Timeline */}
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border/50"></div>

              <div className="space-y-6">
                {timelineTemplate.map((stage, index) => (
                  <div key={stage.id} className="relative flex items-start space-x-6">
                    {/* Timeline dot */}
                    <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-slate-200 to-slate-300 hover:from-slate-300 hover:to-slate-400 transition-all duration-200">
                      <div className="text-slate-600">{stage.icon}</div>
                    </div>

                    {/* Stage content */}
                    <div className="flex-1 min-w-0 pb-6">
                      <div 
                        className="bg-gradient-to-br from-slate-50 to-white rounded-lg p-6 border border-dashed border-slate-300 hover:border-slate-400 hover:shadow-md transition-all duration-200 cursor-pointer group"
                        onClick={() => onAddEvent && onAddEvent(stage.id, { 
                          title: stage.title, 
                          category: stage.type 
                        })}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-serif text-lg font-semibold text-slate-800 group-hover:text-slate-900 transition-colors">
                              {stage.title}
                            </h3>
                            <p className="text-sm text-slate-600 group-hover:text-slate-700 mt-1 transition-colors">{stage.description}</p>
                          </div>
                          <Badge variant="outline" className="opacity-60">
                            {stage.type}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-center py-4 text-slate-500 group-hover:text-slate-700 transition-colors">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span className="text-sm font-medium">Click to add details</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="text-center pt-6">
              <p className="text-sm text-muted-foreground">
                Start with any life stage that feels right. You can always add more events later.
              </p>
            </div>
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
                  className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-4 border-white shadow-lg ${getDotColor(event.type || event.category)}`}
                >
                  <div className="text-white">{getEventIcon(event.type || event.category)}</div>
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
                            <span>{event.date && !isNaN(event.date.getTime()) ? format(event.date, "MMMM yyyy") : "Date not specified"}</span>
                          </div>
                          {event.location && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-4 w-4" />
                              <span>{event.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className={getEventColor(event.type || event.category)}>
                        {event.type || event.category}
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
                            className="text-sm px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-all duration-200"
                            onClick={() => onEdit(event)}
                          >
                            Edit
                          </button>
                        )}
                        {onDelete && (!canDelete || canDelete(event)) && (
                          <button
                            aria-label={`Delete ${event.title}`}
                            className="text-sm px-3 py-1.5 rounded-md border border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200"
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
