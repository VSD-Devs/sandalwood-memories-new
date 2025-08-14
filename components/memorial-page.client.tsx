"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, Share2, Calendar, MapPin, Edit, Users } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { format } from "date-fns"
import MediaGallery from "@/components/media-gallery"
import Timeline from "@/components/timeline"
import { PermissionGuard } from "@/components/permission-guard"
import { usePermissions, type Role, type UserPermissions } from "@/lib/permissions"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import MediaUpload from "@/components/media-upload"
import QRCodeGenerator from "@/components/qr-code-generator"

const memorialData = {
  id: "1",
  name: "Eleanor Rose Thompson",
  subtitle: "Beloved Mother, Grandmother & Friend",
  birthDate: new Date("1945-03-15"),
  passedDate: new Date("2024-01-20"),
  biography:
    "Eleanor was a beacon of light in everyone's life. Born in a small town in Ohio, she grew up with a deep love for gardening, cooking, and bringing people together. She dedicated her life to her family and community, always putting others before herself.\n\nAs a mother of three and grandmother of seven, Eleanor's home was always filled with laughter, the smell of fresh-baked cookies, and unconditional love. She had a gift for making everyone feel special and welcomed. Her garden was her sanctuary, where she grew the most beautiful roses and vegetables that she generously shared with neighbours.\n\nEleanor volunteered at the local library for over 20 years, helping children discover the joy of reading. She believed in the power of education and kindness to change the world. Her legacy lives on in the countless lives she touched with her warmth, wisdom, and generous spirit.",
  profileImage: "/elderly-woman-smiling.png",
  coverImage: "/rose-garden.png",
  theme: "classic",
  relationship: "daughter",
  location: "Springfield, Ohio",
  tributes: [
    {
      id: 1,
      author: "Sarah Thompson",
      relationship: "Daughter",
      message:
        "Mum, your love and wisdom continue to guide us every day. Thank you for showing us what it means to live with grace and kindness.",
      date: new Date("2024-01-25"),
    },
    {
      id: 2,
      author: "Michael Chen",
      relationship: "Neighbour",
      message:
        "Mrs Thompson was the heart of our neighbourhood. Her garden was beautiful, but her heart was even more so. We miss her dearly.",
      date: new Date("2024-01-23"),
    },
  ],
}

type GalleryMediaItem = {
  id: string
  type: "photo" | "video"
  url: string
  thumbnail?: string
  title: string
  description?: string
  date: Date
  uploadedBy: string
}

const initialMedia: GalleryMediaItem[] = [
  {
    id: "1",
    type: "photo",
    url: "/elderly-woman-gardening.png",
    title: "In the Garden",
    description: "Eleanor tending to her beloved roses",
    date: new Date("2023-05-15"),
    uploadedBy: "Sarah Thompson",
  },
  {
    id: "2",
    type: "photo",
    url: "/family-gathering-dinner.png",
    title: "Family Dinner",
    description: "Last Thanksgiving with the whole family",
    date: new Date("2023-11-23"),
    uploadedBy: "Michael Thompson",
  },
  {
    id: "3",
    type: "video",
    url: "/elderly-woman-reading.png",
    thumbnail: "/elderly-woman-reading.png",
    title: "Reading to Grandchildren",
    description: "Eleanor reading her favourite story",
    date: new Date("2023-08-10"),
    uploadedBy: "Jennifer Chen",
  },
  {
    id: "4",
    type: "photo",
    url: "/elderly-woman-volunteering-library.png",
    title: "Library Volunteer",
    description: "At the Springfield Library book fair",
    date: new Date("2023-09-20"),
    uploadedBy: "Library Staff",
  },
]

type UITimelineEvent = {
  id: string
  title: string
  description: string
  date: Date
  type: "birth" | "education" | "career" | "family" | "achievement" | "milestone" | "other"
  location?: string
  photos?: string[]
}

export default function MemorialClient({ id }: { id: string }) {
  const [media, setMedia] = useState<GalleryMediaItem[]>([])
  const [memorial, setMemorial] = useState<any | null>(null)
  const [timeline, setTimeline] = useState<UITimelineEvent[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        // Fetch memorial core details
        const [memorialRes, timelineRes, mediaRes] = await Promise.all([
          fetch(`/api/memorials/${id}`),
          fetch(`/api/memorials/${id}/timeline`),
          fetch(`/api/memorials/${id}/media`),
        ])

        if (!memorialRes.ok) throw new Error(`Failed to fetch memorial: ${memorialRes.status}`)
        const memorialData = await memorialRes.json()
        if (!cancelled) setMemorial(memorialData)

        // Fetch timeline events (may be empty if none added yet)
        if (timelineRes.ok) {
          const timelineData: Array<any> = await timelineRes.json()
          const birthFallback = memorialData?.birth_date ? new Date(memorialData.birth_date) : new Date()
          const mapped: UITimelineEvent[] = (timelineData || []).map((e) => ({
            id: String(e.id),
            title: e.title || "Untitled",
            description: e.description || "",
            date: e.event_date ? safeDate(e.event_date, birthFallback) : birthFallback,
            type: mapCategoryToType(e.category),
            photos: e.image_url ? [e.image_url] : undefined,
          }))
          if (!cancelled) setTimeline(mapped)
        } else {
          if (!cancelled) setTimeline([])
        }

        // Fetch media items
        if (mediaRes.ok) {
          const mediaData: Array<any> = await mediaRes.json()
          const mappedMedia: GalleryMediaItem[] = (Array.isArray(mediaData) ? mediaData : mediaData?.items || []).map((m) => ({
            id: String(m.id || crypto.randomUUID()),
            type: String(m.file_type) === "video" ? "video" : "photo",
            url: m.file_url,
            thumbnail: m.thumbnail_url || undefined,
            title: m.title || "Untitled",
            description: m.description || "",
            date: m.created_at ? new Date(m.created_at) : new Date(),
            uploadedBy: m.uploaded_by || "",
          }))
          if (!cancelled) setMedia(mappedMedia)
        } else {
          if (!cancelled) setMedia([])
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load memorial")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  const displayName = useMemo(() => memorial?.full_name || "Memorial", [memorial])
  const displaySubtitle = useMemo(() => memorial?.title || "", [memorial])
  const displayBirth = useMemo(() => (memorial?.birth_date ? new Date(memorial.birth_date) : null), [memorial])
  const displayDeath = useMemo(() => (memorial?.death_date ? new Date(memorial.death_date) : null), [memorial])
  const displayBiography = useMemo(() => memorial?.biography || "", [memorial])
  const profileImage = memorial?.profile_image_url || "/placeholder-user.jpg"
  const coverImage = memorial?.cover_image_url || "/rose-garden.png"

  const memorialUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/memorial/${id}`

  const { user } = useAuth()
  const userPermissions: UserPermissions | null = useMemo(() => {
    if (!user || !memorial) return null
    const isOwner = String(memorial.created_by || "") === String(user.id || "")
    const role: Role = isOwner ? "owner" : "contributor"
    return usePermissions(id, user.id, role, isOwner)
  }, [user, memorial, id])

  async function submitNewEvent() {
    const errors: typeof formErrors = {}
    if (!newEventTitle.trim()) errors.title = "Title is required"
    if (newEventImageUrl && !/^https?:\/\//i.test(newEventImageUrl)) errors.image = "Please provide a valid URL"
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) return
    try {
      setSubmitting(true)
      let finalImageUrl: string | null = newEventImageUrl.trim() || null
      if (newEventImageFile) {
        const { MediaProcessor } = await import("@/lib/media-processing")
        const validation = MediaProcessor.validateFile(newEventImageFile)
        if (!validation.valid) {
          setFormErrors((prev) => ({ ...prev, image: validation.error || "Invalid file" }))
          setSubmitting(false)
          return
        }
        const processed = await MediaProcessor.processImage(newEventImageFile)
        finalImageUrl = processed.dataUrl || processed.url
      }
      const res = await fetch(`/api/memorials/${id}/timeline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newEventTitle.trim(),
          description: newEventDescription.trim() || null,
          event_date: newEventDate || null,
          category: newEventCategory,
          image_url: finalImageUrl,
        }),
      })
      if (!res.ok) throw new Error("Failed to add event")
      const data = await res.json()
      const created: UITimelineEvent = {
        id: String(data.id || crypto.randomUUID()),
        title: newEventTitle.trim(),
        description: newEventDescription.trim(),
        date: newEventDate ? new Date(newEventDate) : new Date(),
        type: mapCategoryToType(newEventCategory),
        photos: finalImageUrl ? [finalImageUrl] : undefined,
      }
      setTimeline((prev) => [created, ...(prev || [])])
      setIsAddOpen(false)
      toast({ title: "Event added", description: "Your timeline event was created successfully." })
      setNewEventTitle("")
      setNewEventDate("")
      setNewEventCategory("milestone")
      setNewEventDescription("")
      setNewEventImageUrl("")
      setNewEventImageFile(null)
      setNewEventImagePreview("")
    } catch (e) {
      console.error(e)
      toast({ title: "Could not add event", description: "Please try again.", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  function startEditEvent(ev: UITimelineEvent) {
    setEditEvent(ev)
    setIsEditOpen(true)
    setNewEventTitle(ev.title)
    setNewEventDescription(ev.description)
    setNewEventDate(ev.date ? new Date(ev.date).toISOString().slice(0, 10) : "")
    setNewEventCategory(ev.type === "achievement" || ev.type === "milestone" || ev.type === "other" ?
      (ev.type === "other" ? "memory" : ev.type) : ev.type)
    setNewEventImageUrl(ev.photos?.[0] || "")
    setNewEventImageFile(null)
    setNewEventImagePreview("")
    setFormErrors({})
  }

  async function submitEditEvent() {
    if (!editEvent) return
    const errors: typeof formErrors = {}
    if (!newEventTitle.trim()) errors.title = "Title is required"
    if (newEventImageUrl && !/^https?:\/\//i.test(newEventImageUrl)) errors.image = "Please provide a valid URL"
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) return
    try {
      setSubmitting(true)
      let finalImageUrl: string | null = newEventImageUrl.trim() || null
      if (newEventImageFile) {
        const { MediaProcessor } = await import("@/lib/media-processing")
        const validation = MediaProcessor.validateFile(newEventImageFile)
        if (!validation.valid) {
          setFormErrors((prev) => ({ ...prev, image: validation.error || "Invalid file" }))
          setSubmitting(false)
          return
        }
        const processed = await MediaProcessor.processImage(newEventImageFile)
        finalImageUrl = processed.dataUrl || processed.url
      }
      const res = await fetch(`/api/memorials/${id}/timeline/${editEvent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newEventTitle.trim(),
          description: newEventDescription.trim() || null,
          event_date: newEventDate || null,
          category: newEventCategory,
          image_url: finalImageUrl,
        }),
      })
      if (!res.ok) throw new Error("Failed to update event")
      setTimeline((prev) => (prev || []).map((e) => (e.id === editEvent.id ? {
        ...e,
        title: newEventTitle.trim(),
        description: newEventDescription.trim(),
        date: newEventDate ? new Date(newEventDate) : e.date,
        type: mapCategoryToType(newEventCategory),
        photos: finalImageUrl ? [finalImageUrl] : undefined,
      } : e)))
      setIsEditOpen(false)
      setEditEvent(null)
      toast({ title: "Event updated", description: "Your changes were saved." })
    } catch (e) {
      console.error(e)
      toast({ title: "Could not update", description: "Please try again.", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  async function deleteEvent(ev: UITimelineEvent) {
    try {
      const res = await fetch(`/api/memorials/${id}/timeline/${ev.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      setTimeline((prev) => (prev || []).filter((e) => e.id !== ev.id))
      toast({ title: "Event deleted", description: "The event was removed from the timeline." })
    } catch (e) {
      console.error(e)
      toast({ title: "Could not delete", description: "Please try again.", variant: "destructive" })
    }
  }

  function mapCategoryToType(category?: string): UITimelineEvent["type"] {
    const c = String(category || "").toLowerCase()
    if (c === "achievement") return "achievement"
    if (c === "milestone") return "milestone"
    if (c === "celebration") return "milestone"
    if (c === "memory") return "other"
    return "other"
  }

  function yearsAfter(base: Date | null, years: number): Date {
    const d = base ? new Date(base) : new Date()
    const copy = new Date(d)
    copy.setFullYear(d.getFullYear() + years)
    return copy
  }

  function safeDate(input: any, fallback: Date): Date {
    const d = new Date(input)
    return Number.isNaN(d.getTime()) ? fallback : d
  }

  const suggestedTimeline = useMemo<UITimelineEvent[]>(() => {
    const suggestions: UITimelineEvent[] = []
    if (displayBirth) {
      const death = displayDeath || null
      const within = (date: Date) => (death ? date.getTime() <= death.getTime() : true)
      const addIfWithin = (ev: UITimelineEvent) => {
        if (within(ev.date)) suggestions.push(ev)
      }

      addIfWithin({ id: "suggest-birth", title: "Birth", description: "Add details about birth time and place.", date: displayBirth, type: "birth" })
      addIfWithin({ id: "suggest-childhood", title: "Childhood", description: "Stories from early years, home, family, and first friends.", date: yearsAfter(displayBirth, 10), type: "other" })
      addIfWithin({ id: "suggest-school", title: "School", description: "Primary or secondary school memories and achievements.", date: yearsAfter(displayBirth, 12), type: "education" })
      addIfWithin({ id: "suggest-higher-ed", title: "Higher education", description: "University, apprenticeships, or vocational training.", date: yearsAfter(displayBirth, 18), type: "education" })
      addIfWithin({ id: "suggest-career", title: "Career start", description: "First job or calling, notable roles, and contributions.", date: yearsAfter(displayBirth, 22), type: "career" })
      addIfWithin({ id: "suggest-marriage", title: "Marriage or partnership", description: "Marriage, partnership, or significant relationship milestones.", date: yearsAfter(displayBirth, 28), type: "family" })
      addIfWithin({ id: "suggest-children", title: "Children", description: "Children’s births and special family moments.", date: yearsAfter(displayBirth, 30), type: "family" })

      const retirementTarget = displayDeath ? new Date(new Date(displayDeath).setFullYear(displayDeath.getFullYear() - 2)) : yearsAfter(displayBirth, 65)
      addIfWithin({ id: "suggest-retirement", title: "Retirement", description: "Retirement, new hobbies, and community involvement.", date: retirementTarget, type: "milestone" })
    }
    if (displayDeath) suggestions.push({ id: "suggest-passing", title: "Passing", description: "Add details about their passing and celebration of life.", date: displayDeath, type: "milestone" })
    return suggestions
  }, [displayBirth, displayDeath])

  const combinedTimeline = useMemo(() => {
    const real = timeline || []
    const byTitle = new Set(real.map((e) => e.title.trim().toLowerCase()))
    const filteredSuggestions = suggestedTimeline.filter((s) => !byTitle.has(s.title.trim().toLowerCase()))

    // Merge but remove any existing birth/passing-like suggestions; we'll enforce boundaries explicitly below
    const merged = [...real, ...filteredSuggestions].filter((e) => {
      const title = e.title.trim().toLowerCase()
      return title !== "birth" && title !== "passing"
    })

    // Build boundary events
    const boundary: UITimelineEvent[] = []
    // Always start with Birth boundary, even if date unknown
    boundary.push({ id: "boundary-birth", title: "Birth", description: "", date: displayBirth || new Date(0), type: "birth" })
    if (displayDeath) {
      boundary.push({ id: "boundary-passing", title: "Passing", description: "", date: displayDeath, type: "milestone" })
    }

    // Remove any user events that are also typed as birth (keep our boundary version)
    const core = merged.filter((e) => e.type !== "birth")

    // Sort core by date ascending
    core.sort((a, b) => a.date.getTime() - b.date.getTime())

    // Assemble with boundaries fixed at start/end
    const start = boundary.find((b) => b.title === "Birth")
    const end = boundary.find((b) => b.title === "Passing")
    const assembled: UITimelineEvent[] = []
    if (start) assembled.push(start)
    assembled.push(...core)
    if (end) assembled.push(end)
    return assembled
  }, [timeline, suggestedTimeline, displayBirth, displayDeath])

  return (
    <div className="min-h-screen bg-memorial-bg">
      <header className="border-b border-border/50 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href={user ? "/memorial" : "/"} className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-primary" />
              <span className="font-serif font-bold text-2xl text-foreground">Sandalwood Memories</span>
            </Link>
            <div className="flex items-center space-x-4">
              <MediaUpload
                memorialId={id}
                onUpload={async (files) => {
                  try {
                    // Send raw device files to server for storage
                    const form = new FormData()
                    files.forEach((f) => form.append("file", f))
                    if (user?.id) form.append("uploaded_by", user.id)
                    const uploadRes = await fetch(`/api/memorials/${id}/media/upload`, { method: "POST", body: form })
                    if (!uploadRes.ok) throw new Error("Upload failed")
                    const uploaded = await uploadRes.json()

                    const items = (uploaded?.items || []).filter((x: any) => x?.success)
                    if (items.length === 0) return

                    const persistRes = await fetch(`/api/memorials/${id}/media`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ items }),
                    })
                    const persistedJson = await persistRes.json()
                    const persisted = (Array.isArray(persistedJson) ? persistedJson : persistedJson?.items || []).map((m: any) => ({
                      id: String(m.id || crypto.randomUUID()),
                      type: String(m.file_type) === "video" ? "video" : "photo",
                      url: m.file_url,
                      thumbnail: m.thumbnail_url || undefined,
                      title: m.title || "Untitled",
                      description: m.description || "",
                      date: m.created_at ? new Date(m.created_at) : new Date(),
                      uploadedBy: m.uploaded_by || (user?.name || "You"),
                    })) as GalleryMediaItem[]
                    setMedia((prev) => [...persisted, ...prev])
                  } catch (e) {
                    console.error(e)
                  }
                }}
              />
              <Button variant="outline" size="sm" className="flex items-center space-x-2 bg-transparent">
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </Button>
              <Button variant="outline" size="sm" className="flex items-center space-x-2 bg-transparent">
                <Edit className="h-4 w-4" />
                <span>Edit</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="relative h-64 md:h-80 bg-gradient-to-r from-primary/20 to-accent/20">
        <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-start space-y-6 md:space-y-0 md:space-x-6">
                  <div className="flex-shrink-0">
                    <img src={profileImage} alt={displayName} className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg" />
                  </div>
                  <div className="flex-1">
                    <h1 className="font-serif text-4xl font-bold text-foreground mb-2">{displayName}</h1>
                    <p className="text-xl text-muted-foreground mb-4">{displaySubtitle}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{displayBirth ? format(displayBirth, "MMM d, yyyy") : "—"} - {displayDeath ? format(displayDeath, "MMM d, yyyy") : "—"}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>{memorialData.location}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="p-8">
                <h2 className="font-serif text-2xl font-semibold mb-6">Life Story</h2>
                <div className="prose prose-lg max-w-none whitespace-pre-line text-foreground">{displayBiography}</div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <h2 className="sr-only">Timeline Actions</h2>
              <div></div>
              {userPermissions && (
                <PermissionGuard userPermissions={userPermissions} action="create" resource="timeline">
                  <Button size="sm" onClick={() => setIsAddOpen(true)} className="bg-primary hover:bg-primary/90">
                    Add timeline event
                  </Button>
                </PermissionGuard>
              )}
            </div>
            <Timeline
              events={combinedTimeline}
              onEdit={userPermissions ? startEditEvent : undefined}
              onDelete={userPermissions ? deleteEvent : undefined}
              sort={false}
              canEdit={(e) => !e.id.startsWith("boundary-")}
              canDelete={(e) => !e.id.startsWith("boundary-")}
              emptyState={{
                title: "Begin the story",
                description: "Add key moments like school, work, family, and favourite places.",
              }}
            />

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogContent className="sm:max-w-md bg-white border-0 shadow-2xl">
                <div className="space-y-4">
                  <DialogTitle className="font-serif text-xl font-semibold">Add timeline event</DialogTitle>
                  <div className="space-y-2">
                    <Label htmlFor="evt-title">Title</Label>
                    <Input id="evt-title" value={newEventTitle} onChange={(e) => setNewEventTitle(e.target.value)} placeholder="e.g. Graduated from college" aria-invalid={!!formErrors.title} />
                    {formErrors.title && <p className="text-sm text-red-600">{formErrors.title}</p>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="evt-date">Date</Label>
                      <Input id="evt-date" type="date" value={newEventDate} onChange={(e) => setNewEventDate(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={newEventCategory} onValueChange={setNewEventCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="milestone">Milestone</SelectItem>
                          <SelectItem value="achievement">Achievement</SelectItem>
                          <SelectItem value="celebration">Celebration</SelectItem>
                          <SelectItem value="memory">Memory</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="evt-desc">Description</Label>
                    <Textarea id="evt-desc" rows={4} value={newEventDescription} onChange={(e) => setNewEventDescription(e.target.value)} placeholder="A few words to bring the moment to life" />
                  </div>
                  <div className="space-y-3">
                    <Label>Attach an image</Label>
                    <Tabs defaultValue="upload">
                      <TabsList>
                        <TabsTrigger value="upload">Upload</TabsTrigger>
                        <TabsTrigger value="url">Paste URL</TabsTrigger>
                      </TabsList>
                      <TabsContent value="upload" className="mt-3">
                        <Input
                          id="evt-file"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0] || null
                            setNewEventImageFile(f)
                            setNewEventImagePreview(f ? URL.createObjectURL(f) : "")
                            if (f) setNewEventImageUrl("")
                          }}
                        />
                        {newEventImagePreview && (
                          <img src={newEventImagePreview} alt="Selected preview" className="mt-2 h-24 w-24 object-cover rounded border" />
                        )}
                      </TabsContent>
                      <TabsContent value="url" className="mt-3">
                        <Input id="evt-img" value={newEventImageUrl} onChange={(e) => setNewEventImageUrl(e.target.value)} placeholder="https://..." aria-invalid={!!formErrors.image} />
                        {formErrors.image && <p className="text-sm text-red-600">{formErrors.image}</p>}
                      </TabsContent>
                    </Tabs>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddOpen(false)} className="bg-transparent">Cancel</Button>
                    <Button onClick={submitNewEvent} disabled={submitting || !newEventTitle.trim()} className="bg-primary hover:bg-primary/90">
                      {submitting ? "Saving..." : "Save event"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogContent className="sm:max-w-md bg-white border-0 shadow-2xl">
                <div className="space-y-4">
                  <DialogTitle className="font-serif text-xl font-semibold">Edit timeline event</DialogTitle>
                  <div className="space-y-2">
                    <Label htmlFor="evt-title-edit">Title</Label>
                    <Input id="evt-title-edit" value={newEventTitle} onChange={(e) => setNewEventTitle(e.target.value)} aria-invalid={!!formErrors.title} />
                    {formErrors.title && <p className="text-sm text-red-600">{formErrors.title}</p>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="evt-date-edit">Date</Label>
                      <Input id="evt-date-edit" type="date" value={newEventDate} onChange={(e) => setNewEventDate(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={newEventCategory} onValueChange={setNewEventCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="milestone">Milestone</SelectItem>
                          <SelectItem value="achievement">Achievement</SelectItem>
                          <SelectItem value="celebration">Celebration</SelectItem>
                          <SelectItem value="memory">Memory</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="evt-desc-edit">Description</Label>
                    <Textarea id="evt-desc-edit" rows={4} value={newEventDescription} onChange={(e) => setNewEventDescription(e.target.value)} />
                  </div>
                  <div className="space-y-3">
                    <Label>Attach an image</Label>
                    <Tabs defaultValue={newEventImageFile ? "upload" : "url"}>
                      <TabsList>
                        <TabsTrigger value="upload">Upload</TabsTrigger>
                        <TabsTrigger value="url">Paste URL</TabsTrigger>
                      </TabsList>
                      <TabsContent value="upload" className="mt-3">
                        <Input
                          id="evt-file-edit"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0] || null
                            setNewEventImageFile(f)
                            setNewEventImagePreview(f ? URL.createObjectURL(f) : "")
                            if (f) setNewEventImageUrl("")
                          }}
                        />
                        {newEventImagePreview && (
                          <img src={newEventImagePreview} alt="Selected preview" className="mt-2 h-24 w-24 object-cover rounded border" />
                        )}
                      </TabsContent>
                      <TabsContent value="url" className="mt-3">
                        <Input id="evt-img-edit" value={newEventImageUrl} onChange={(e) => setNewEventImageUrl(e.target.value)} aria-invalid={!!formErrors.image} />
                        {formErrors.image && <p className="text-sm text-red-600">{formErrors.image}</p>}
                      </TabsContent>
                    </Tabs>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsEditOpen(false)} className="bg-transparent">Cancel</Button>
                    <Button onClick={submitEditEvent} disabled={submitting || !newEventTitle.trim()} className="bg-primary hover:bg-primary/90">
                      {submitting ? "Saving..." : "Save changes"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Suggestions helper */}
            {suggestedTimeline.length > 0 && (
              <Card className="border-0 shadow-lg bg-white">
                <CardContent className="p-6">
                  <h3 className="font-serif text-lg font-semibold mb-2">Suggested moments to include</h3>
                  <p className="text-sm text-muted-foreground mb-4">These prompts can help you capture a fuller life story. Add or edit as you like.</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedTimeline.map((s) => (
                      <Badge key={s.id} variant="outline" className="capitalize">
                        {s.title}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <MediaGallery media={media} />

            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-serif text-2xl font-semibold">Tributes & Messages</h2>
                  <Button className="bg-primary hover:bg-primary/90">
                    <Heart className="h-4 w-4 mr-2" />
                    Leave Tribute
                  </Button>
                </div>
                <div className="space-y-6">
                  {memorialData.tributes.map((tribute) => (
                    <div key={tribute.id} className="border-l-4 border-primary/20 pl-6 py-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-foreground">{tribute.author}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {tribute.relationship}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">{format(tribute.date, "MMM d, yyyy")}</span>
                      </div>
                      <p className="text-foreground leading-relaxed">{tribute.message}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="p-6">
                <h3 className="font-serif text-lg font-semibold mb-4">Memorial Activity</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Heart className="h-4 w-4 text-primary" />
                      <span className="text-sm">Tributes</span>
                    </div>
                    <span className="font-semibold">{memorialData.tributes.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="text-sm">Visitors</span>
                    </div>
                    <span className="font-semibold">247</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="p-6">
                <h3 className="font-serif text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Heart className="h-4 w-4 mr-2" />
                    Light a Candle
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Memorial
                  </Button>
                  <QRCodeGenerator memorialUrl={memorialUrl} memorialName={displayName} />
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Calendar className="h-4 w-4 mr-2" />
                    Add to Calendar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      
    </div>
  )
}


