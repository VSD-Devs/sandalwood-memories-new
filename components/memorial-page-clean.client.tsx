"use client"

import { useEffect, useState, useMemo } from "react"
import { Heart, Calendar, MapPin, User, Share2, MessageSquare, Plus, Clock, FileText, Camera, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { format } from "date-fns"
import MediaGallery from "@/components/media-gallery"
import DocumentList, { type DocumentItem } from "@/components/document-list"
import Timeline from "@/components/timeline"
import { PermissionGuard } from "@/components/permission-guard"
import { usePermissions, type Role, type UserPermissions } from "@/lib/permissions"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import TributeForm from "@/components/tributes/tribute-form"
import TributeList from "@/components/tributes/tribute-list"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import MediaUpload from "@/components/media-upload"

interface GalleryMediaItem {
  id: string
  type: "photo" | "video"
  url: string
  thumbnail?: string
  title: string
  description?: string
  date: Date
  uploadedBy: string
}

interface TimelineEvent {
  id: string
  title: string
  date: string
  description?: string
  category: "birth" | "education" | "career" | "family" | "achievement" | "milestone" | "other"
  imageUrl?: string
}

interface UITimelineEvent {
  id: string
  title: string
  date: string
  description: string
  category: string
  image_url?: string
}

export default function MemorialClient({ id }: { id: string }) {
  const [media, setMedia] = useState<GalleryMediaItem[]>([])
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [memorial, setMemorial] = useState<any | null>(null)
  const [timeline, setTimeline] = useState<UITimelineEvent[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Timeline management
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [newEventTitle, setNewEventTitle] = useState("")
  const [newEventDate, setNewEventDate] = useState("")
  const [newEventCategory, setNewEventCategory] = useState("milestone")
  const [newEventDescription, setNewEventDescription] = useState("")
  const [newEventImageUrl, setNewEventImageUrl] = useState("")
  const [newEventImageFile, setNewEventImageFile] = useState<File | null>(null)
  const [newEventImagePreview, setNewEventImagePreview] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState<{ title?: string; date?: string; image?: string }>({})
  const [editEvent, setEditEvent] = useState<UITimelineEvent | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const { toast } = useToast()
  
  // Tribute modal
  const [isTributeOpen, setIsTributeOpen] = useState(false)

  const [localOwn, setLocalOwn] = useState(false)
  const { user, isLoading } = useAuth()

  // Check permissions
  const userPermissions: UserPermissions = usePermissions(user?.id || null, memorial)

  const isOwner = useMemo(() => {
    if (!user || !memorial) return localOwn
    return (
      String(memorial.created_by) === String(user.id) ||
      String(memorial.owner_user_id) === String(user.id) ||
      localOwn
    )
  }, [user, memorial, localOwn])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/memorials/${id}`)
        if (!res.ok) throw new Error("Memorial not found")
        const data = await res.json()
        if (!cancelled) {
          setMemorial(data)
          
          // Check if we own this memorial locally (for memorials created in this browser)
          if (user?.id) {
            const scopedKey = `my-memorial-ids:${user.id}`
            const rawIds = localStorage.getItem(scopedKey) || "[]"
            try {
              const myIds: string[] = JSON.parse(rawIds)
              if (myIds.includes(id)) setLocalOwn(true)
            } catch {}
          }
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load memorial")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [id, user])

  // Fetch timeline events
  useEffect(() => {
    if (!memorial) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/memorials/${id}/timeline`)
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) setTimeline(Array.isArray(data) ? data : [])
      } catch {}
    })()
    return () => { cancelled = true }
  }, [id, memorial])

  // Timeline functions
  async function submitNewEvent() {
    const errors: typeof formErrors = {}
    if (!newEventTitle.trim()) errors.title = "Title is required"
    if (!newEventDate) errors.date = "Date is required"
    if (newEventImageFile && newEventImageFile.size > 10 * 1024 * 1024) {
      errors.image = "Image must be smaller than 10MB"
    }
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) return

    try {
      setSubmitting(true)
      let imageUrl = newEventImageUrl

      if (newEventImageFile) {
        const formData = new FormData()
        formData.append("file", newEventImageFile)
        formData.append("memorial_id", id)
        formData.append("title", `Timeline: ${newEventTitle}`)
        
        const uploadRes = await fetch(`/api/memorials/${id}/media/upload`, {
          method: "POST",
          body: formData,
        })
        
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json()
          imageUrl = uploadData.url
        }
      }

      const res = await fetch(`/api/memorials/${id}/timeline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newEventTitle.trim(),
          date: newEventDate,
          category: newEventCategory,
          description: newEventDescription.trim(),
          image_url: imageUrl,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to add event")
      }

      const newEvent = await res.json()
      setTimeline((prev) => prev ? [...prev, newEvent].sort((a, b) => {
        const aTime = a.date && !isNaN(new Date(a.date).getTime()) ? new Date(a.date).getTime() : 0
        const bTime = b.date && !isNaN(new Date(b.date).getTime()) ? new Date(b.date).getTime() : 0
        return aTime - bTime
      }) : [newEvent])
      
      // Reset form
      setNewEventTitle("")
      setNewEventDate("")
      setNewEventCategory("milestone")
      setNewEventDescription("")
      setNewEventImageUrl("")
      setNewEventImageFile(null)
      setNewEventImagePreview("")
      setIsAddOpen(false)
      
      toast({ title: "Event added", description: "Timeline event has been added successfully." })
    } catch (error: any) {
      console.error("Add event error:", error)
      toast({ title: "Failed to add event", description: error.message || "Please try again later.", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  async function updateEvent() {
    if (!editEvent) return
    
    try {
      setSubmitting(true)
      const res = await fetch(`/api/memorials/${id}/timeline/${editEvent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editEvent.title,
          date: editEvent.date,
          category: editEvent.category,
          description: editEvent.description,
          image_url: editEvent.image_url,
        }),
      })

      if (!res.ok) throw new Error("Failed to update event")

      const updatedEvent = await res.json()
      setTimeline((prev) => prev ? prev.map(e => e.id === editEvent.id ? updatedEvent : e) : [])
      setIsEditOpen(false)
      setEditEvent(null)
      
      toast({ title: "Event updated", description: "Timeline event has been updated successfully." })
    } catch (error: any) {
      console.error("Update event error:", error)
      toast({ title: "Failed to update event", description: error.message || "Please try again later.", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  async function deleteEvent(eventId: string) {
    try {
      const res = await fetch(`/api/memorials/${id}/timeline/${eventId}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Failed to delete event")

      setTimeline((prev) => prev ? prev.filter(e => e.id !== eventId) : [])
      toast({ title: "Event deleted", description: "Timeline event has been deleted." })
    } catch (error: any) {
      console.error("Delete event error:", error)
      toast({ title: "Failed to delete event", description: error.message || "Please try again later.", variant: "destructive" })
    }
  }

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setNewEventImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setNewEventImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      setNewEventImageUrl("") // Clear URL field if file is selected
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !memorial) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Memorial not found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {error || "This memorial doesn't exist or isn't accessible."}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <Card className="overflow-hidden">
            <div className="h-48 bg-gradient-to-br from-rose-100 via-pink-50 to-orange-100 relative">
              <div className="absolute inset-0 bg-black/10" />
              <div className="absolute bottom-6 left-6 text-white">
                <h1 className="font-serif text-4xl font-bold mb-2">{memorial.full_name}</h1>
                <div className="flex items-center gap-4 text-white/90">
                  {memorial.birth_date && memorial.death_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {format(new Date(memorial.birth_date), "MMM d, yyyy")} - {format(new Date(memorial.death_date), "MMM d, yyyy")}
                      </span>
                    </div>
                  )}
                  {memorial.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{memorial.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <CardContent className="p-6">
              {memorial.description && (
                <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                  {memorial.description}
                </p>
              )}
              
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => setIsTributeOpen(true)}
                  className="bg-rose-600 hover:bg-rose-700"
                >
                  <Heart className="h-4 w-4 mr-2" />
                  Leave a Tribute
                </Button>
                
                <Button variant="outline">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Memorial
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Timeline and Media */}
          <div className="lg:col-span-2 space-y-8">
            {/* Timeline Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-serif">
                  <Clock className="h-5 w-5 text-rose-600" />
                  Life Timeline
                  <PermissionGuard permissions={userPermissions} requiredPermission="edit">
                    <Button onClick={() => setIsAddOpen(true)} size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Event
                    </Button>
                  </PermissionGuard>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {timeline && (
                  <Timeline
                    events={timeline}
                    isOwner={isOwner}
                    onEdit={(event) => {
                      setEditEvent(event)
                      setIsEditOpen(true)
                    }}
                    onDelete={deleteEvent}
                  />
                )}
              </CardContent>
            </Card>

            {/* Media Gallery */}
            <MediaGallery 
              media={media} 
              title="Photos & Videos"
              onUploadClick={() => {/* Open upload modal */}}
              canUpload={isOwner}
            />
          </div>

          {/* Right Column - Tributes and Documents */}
          <div className="space-y-8">
            {/* Tributes */}
            <TributeList 
              memorialId={id}
              isOwner={isOwner}
            />

            {/* Documents */}
            <DocumentList 
              documents={documents}
              memorialId={id}
              canEdit={isOwner}
            />
          </div>
        </div>

        {/* Timeline Add Modal */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent className="sm:max-w-md bg-white border-0 shadow-2xl">
            <div className="space-y-4">
              <DialogTitle className="font-serif text-xl font-semibold">Add timeline event</DialogTitle>
              {/* Timeline form content - same as before */}
              <div className="space-y-2">
                <Label htmlFor="title">Event title</Label>
                <Input
                  id="title"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="e.g., Graduated from University"
                />
                {formErrors.title && <p className="text-sm text-red-600">{formErrors.title}</p>}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="month"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    placeholder="YYYY-MM"
                  />
                  {formErrors.date && <p className="text-sm text-red-600">{formErrors.date}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={newEventCategory} onValueChange={setNewEventCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="milestone">Milestone</SelectItem>
                      <SelectItem value="achievement">Achievement</SelectItem>
                      <SelectItem value="memory">Memory</SelectItem>
                      <SelectItem value="celebration">Celebration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={newEventDescription}
                  onChange={(e) => setNewEventDescription(e.target.value)}
                  placeholder="Tell the story of this moment..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={submitNewEvent} disabled={submitting}>
                  {submitting ? "Adding..." : "Add Event"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Tribute Modal */}
        <Dialog open={isTributeOpen} onOpenChange={setIsTributeOpen}>
          <DialogContent className="sm:max-w-2xl bg-white border-0 shadow-2xl">
            <DialogTitle className="font-serif text-xl font-semibold">Leave a Tribute</DialogTitle>
            <TributeForm 
              memorialId={id}
              onSuccess={() => setIsTributeOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
