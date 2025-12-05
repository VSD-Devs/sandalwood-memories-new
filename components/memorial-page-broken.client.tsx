"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, Share2, Calendar, MapPin, Edit, Users, Loader2, Camera, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { useAuth } from "@/contexts/auth-context"
import MediaGallery from "@/components/media-gallery"
import Timeline from "@/components/timeline"
import MediaUpload from "@/components/media-upload"
import QRCodeGenerator from "@/components/qr-code-generator"
import MemorialBottomNav from "@/components/memorial-bottom-nav"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Memorial {
  id: string
  full_name: string
  title?: string
  birth_date?: string
  death_date?: string
  biography?: string
  theme?: string
  created_at: string
  is_alive?: boolean
  burial_location?: string
  profile_image_url?: string
  cover_image_url?: string
  isOwner?: boolean
}

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

interface TimelineEvent {
  id: string
  title: string
  date: Date
  description: string
  type: "birth" | "education" | "career" | "family" | "achievement" | "milestone" | "other"
  category: string
  image_url?: string
  location?: string
  photos?: string[]
}

interface Tribute {
  id: string
  author_name: string
  author_email?: string
  message: string
  status: string
  created_at: string
}

export default function MemorialClient({ id }: { id: string }) {
  const [memorial, setMemorial] = useState<Memorial | null>(null)
  const [media, setMedia] = useState<MediaItem[]>([])
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [tributes, setTributes] = useState<Tribute[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const router = useRouter()

  // Modal states
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false)
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false)
  const [isTributeModalOpen, setIsTributeModalOpen] = useState(false)
  const [selectedStage, setSelectedStage] = useState<string | null>(null)
  
  // Form states
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    date: '',
    category: 'milestone',
    image_url: ''
  })
  
  // Image upload states for timeline
  const [timelineImageFile, setTimelineImageFile] = useState<File | null>(null)
  const [timelineImagePreview, setTimelineImagePreview] = useState<string>('')
  
  // Handle timeline image selection
  const handleTimelineImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }
      
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert('Image must be smaller than 10MB')
        return
      }
      
      setTimelineImageFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setTimelineImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }
  
  // Remove timeline image
  const removeTimelineImage = () => {
    setTimelineImageFile(null)
    setTimelineImagePreview('')
  }
  
  const [tributeForm, setTributeForm] = useState({
    author_name: '',
    author_email: '',
    message: ''
  })

  useEffect(() => {
    const loadMemorialData = async () => {
      try {
        // Load memorial details
        const memorialRes = await fetch(`/api/memorials/${id}`, {
          credentials: 'include'
        })
        
        if (!memorialRes.ok) {
          throw new Error("Memorial not found")
        }
        
        const memorialData = await memorialRes.json()
        console.log('Memorial data loaded:', memorialData)
        setMemorial(memorialData)

        // Load media, timeline, and tributes in parallel
        const [mediaRes, timelineRes, tributesRes] = await Promise.all([
          fetch(`/api/memorials/${id}/media`, { credentials: 'include' }).catch(() => null),
          fetch(`/api/memorials/${id}/timeline`, { credentials: 'include' }).catch(() => null),
          fetch(`/api/memorials/${id}/tributes`, { credentials: 'include' }).catch(() => null)
        ])

        if (mediaRes?.ok) {
          const mediaData = await mediaRes.json()
          setMedia(Array.isArray(mediaData) ? mediaData.map(item => ({
            ...item,
            date: new Date(item.created_at || item.date)
          })) : [])
        }

        if (timelineRes?.ok) {
          const timelineData = await timelineRes.json()
          console.log('Timeline data loaded:', timelineData)
          setTimeline(Array.isArray(timelineData) ? timelineData.map(event => ({
            ...event,
            date: event.event_date ? new Date(event.event_date) : (event.date ? new Date(event.date) : new Date()),
            type: event.category as any || "milestone",
            photos: event.image_url ? [event.image_url] : []
          })) : [])
        } else {
          console.log('Timeline request failed:', timelineRes?.status)
        }

        if (tributesRes?.ok) {
          const tributesData = await tributesRes.json()
          console.log('Tributes data loaded:', tributesData)
          setTributes(Array.isArray(tributesData) ? tributesData : [])
        } else {
          console.log('Tributes request failed:', tributesRes?.status)
        }

      } catch (e) {
        console.error("Failed to load memorial:", e)
        setError(e instanceof Error ? e.message : "Failed to load memorial")
      } finally {
        setLoading(false)
      }
    }

    loadMemorialData()
  }, [id])

  const memorialUrl = `${typeof window !== "undefined" ? window.location.origin : "https://sandalwood-memories.com"}/memorial/${id}`

  if (loading) {
    return (
      <div className="min-h-screen bg-memorial-bg flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !memorial) {
    return (
      <div className="min-h-screen bg-memorial-bg flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6">
            <h2 className="font-serif text-xl font-semibold mb-4">Memorial not found</h2>
            <p className="text-muted-foreground mb-4">
              {error || "This memorial doesn't exist or isn't accessible."}
            </p>
            <Link href="/memorial">
              <Button>Back to Memorials</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header - Minimal */}
      <header className="md:hidden bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.push('/memorial')}
            className="text-gray-600"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <Button variant="ghost" size="sm" className="text-gray-600">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Desktop Header - Full */}
      <header className="hidden md:block border-b border-border/50 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/memorial" className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-primary" />
              <span className="font-serif font-bold text-2xl text-foreground">Sandalwood Memories</span>
            </Link>
            <div className="flex items-center space-x-4">
              {memorial.isOwner && (
                <MediaUpload onUpload={(files) => {
                  console.log("Uploaded files:", files)
                  window.location.reload()
                }} />
              )}
              <Button variant="outline" size="sm" className="flex items-center space-x-2 bg-transparent">
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </Button>
              {memorial.isOwner && (
                <Button variant="outline" size="sm" className="flex items-center space-x-2 bg-transparent">
                  <Edit className="h-4 w-4" />
                  <span>Edit</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Hero Section */}
      <div className="md:hidden">
        {/* Cover Image */}
        <div className="relative h-48 bg-gradient-to-br from-rose-100 to-pink-100">
          {memorial.cover_image_url ? (
            <img 
              src={memorial.cover_image_url} 
              alt="Cover" 
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-rose-100 via-pink-50 to-orange-100" />
          )}
          <div className="absolute inset-0 bg-black/10"></div>
        </div>

        {/* Profile Card - Overlapping */}
        <div className="relative -mt-16 mx-4 mb-6">
          <Card className="bg-white shadow-xl border-0">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="relative">
                  <img
                    src={memorial.profile_image_url || "/elderly-woman-smiling.png"}
                    alt={memorial.full_name}
                    className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="font-serif text-2xl font-bold text-gray-900 leading-tight mb-1">
                    {memorial.full_name}
                  </h1>
                  <p className="text-gray-600 text-sm mb-3">
                    {memorial.title || "Beloved Family Member"}
                  </p>
                  {memorial.birth_date && memorial.death_date && (
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>
                        {format(new Date(memorial.birth_date), "MMM d, yyyy")} - {format(new Date(memorial.death_date), "MMM d, yyyy")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats - Mobile */}
        <div className="mx-4 mb-6">
          <div className="grid grid-cols-3 gap-3">
            <Card className="border-0 bg-blue-50">
              <CardContent className="p-4 text-center">
                <Calendar className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                <div className="text-lg font-semibold text-blue-900">{timeline.length}</div>
                <div className="text-xs text-blue-700">Timeline</div>
              </CardContent>
            </Card>
            <Card className="border-0 bg-green-50">
              <CardContent className="p-4 text-center">
                <Camera className="h-5 w-5 text-green-600 mx-auto mb-1" />
                <div className="text-lg font-semibold text-green-900">{media.length}</div>
                <div className="text-xs text-green-700">Photos</div>
              </CardContent>
            </Card>
            <Card className="border-0 bg-rose-50">
              <CardContent className="p-4 text-center">
                <Heart className="h-5 w-5 text-rose-600 mx-auto mb-1" />
                <div className="text-lg font-semibold text-rose-900">{tributes.length}</div>
                <div className="text-xs text-rose-700">Tributes</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block">
        {/* Cover Image */}
        <div className="relative h-64 md:h-80 bg-gradient-to-r from-primary/20 to-accent/20">
          {memorial.cover_image_url ? (
            <img 
              src={memorial.cover_image_url} 
              alt="Cover" 
              className="w-full h-full object-cover" 
            />
          ) : (
            <img 
              src="/rose-garden.png" 
              alt="Default cover" 
              className="w-full h-full object-cover opacity-50" 
            />
          )}
          <div className="absolute inset-0 bg-black/20"></div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Profile Section */}
              <Card className="border-0 shadow-lg bg-white">
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row items-start space-y-6 md:space-y-0 md:space-x-6">
                    <div className="flex-shrink-0">
                      <img
                        src={memorial.profile_image_url || "/elderly-woman-smiling.png"}
                        alt={memorial.full_name}
                        className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                      />
                    </div>
                    <div className="flex-1">
                      <h1 className="font-serif text-4xl font-bold text-foreground mb-2">{memorial.full_name}</h1>
                      <p className="text-xl text-muted-foreground mb-4">{memorial.title || "Beloved Family Member"}</p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        {memorial.birth_date && memorial.death_date && (
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {format(new Date(memorial.birth_date), "MMM d, yyyy")} -{" "}
                              {format(new Date(memorial.death_date), "MMM d, yyyy")}
                            </span>
                          </div>
                        )}
                        {memorial.burial_location && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span>{memorial.burial_location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Biography */}
              {memorial.biography && (
                <Card className="border-0 shadow-lg bg-white">
                  <CardContent className="p-8">
                    <h2 className="font-serif text-2xl font-semibold mb-6">Life Story</h2>
                    <div className="prose prose-lg max-w-none">
                      {memorial.biography.split("\n\n").map((paragraph, index) => (
                        <p key={index} className="mb-4 leading-relaxed text-foreground">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Content */}
      <div className="md:hidden mx-4 pb-24 space-y-6">
        {/* Biography Card */}
        {memorial.biography && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h2 className="font-serif text-lg font-semibold mb-4 text-gray-900">Life Story</h2>
              <div className="text-gray-700 text-sm leading-relaxed space-y-3">
                {memorial.biography.split("\n\n").slice(0, 2).map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
                {memorial.biography.split("\n\n").length > 2 && (
                  <Button variant="ghost" size="sm" className="text-blue-600 p-0 h-auto">
                    Read more...
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timeline Card */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg font-semibold text-gray-900">Timeline</h3>
              <Button size="sm" variant="ghost" className="text-blue-600">
                View All
              </Button>
            </div>
            {timeline.length > 0 ? (
              <div className="space-y-4">
                {timeline.slice(0, 3).map((event) => (
                  <div key={event.id} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm">{event.title}</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(event.date, "MMM yyyy")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No timeline events yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Photos Card */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg font-semibold text-gray-900">Photos</h3>
              <Button size="sm" variant="ghost" className="text-blue-600">
                View All
              </Button>
            </div>
            {media.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {media.slice(0, 6).map((item) => (
                  <div key={item.id} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img 
                      src={item.url} 
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No photos yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tributes Card */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg font-semibold text-gray-900">Tributes</h3>
              <Button size="sm" variant="ghost" className="text-blue-600">
                View All
              </Button>
            </div>
            {tributes.length > 0 ? (
              <div className="space-y-4">
                {tributes.slice(0, 2).map((tribute) => (
                  <div key={tribute.id} className="border-l-2 border-rose-200 pl-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 text-sm">{tribute.author_name}</h4>
                      <span className="text-xs text-gray-500">
                        {format(new Date(tribute.created_at), "MMM d")}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2">{tribute.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Heart className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No tributes yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Desktop Content - Keep existing tabbed layout */}
      <div className="hidden md:block max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Tabbed Content */}
            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="p-0">
                <Tabs defaultValue="timeline" className="w-full">
                  <div className="border-b px-8 pt-8">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="timeline" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Timeline
                      </TabsTrigger>
                      <TabsTrigger value="gallery" className="flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        Photos
                      </TabsTrigger>
                      <TabsTrigger value="tributes" className="flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        Tributes
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  
                  <TabsContent value="timeline" className="p-8">
                    <Timeline 
                      events={timeline}
                      onEdit={(event) => {
                        setEventForm({
                          title: event.title,
                          description: event.description,
                          date: event.date.toISOString().split('T')[0],
                          category: event.category,
                          image_url: event.image_url || ''
                        })
                        setIsTimelineModalOpen(true)
                      }}
                      onAddEvent={(stageId, stageData) => {
                        setEventForm({
                          title: stageData.title,
                          description: '',
                          date: '',
                          category: stageData.category,
                          image_url: ''
                        })
                        setSelectedStage(stageId)
                        setIsTimelineModalOpen(true)
                      }}
                      emptyState={{
                        title: "No timeline events yet",
                        description: "Add important milestones and memories to create a beautiful timeline."
                      }}
                    />
                  </TabsContent>
                  
                  <TabsContent value="gallery" className="p-8">
                    <MediaGallery 
                      media={media} 
                      title="Photos & Videos" 
                      onUploadClick={() => setIsPhotoModalOpen(true)}
                      canUpload={memorial?.isOwner || user?.id === memorial?.created_by}
                    />
                  </TabsContent>
                  
                  <TabsContent value="tributes" className="p-8">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="font-serif text-xl font-semibold">Messages of Remembrance</h3>
                        <Button className="bg-primary hover:bg-primary/90">
                          <Heart className="h-4 w-4 mr-2" />
                          Leave Tribute
                        </Button>
                      </div>
                      {tributes.length > 0 ? (
                        tributes.map((tribute) => (
                          <div key={tribute.id} className="border-l-4 border-primary/20 pl-6 py-4">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <h4 className="font-semibold text-foreground">{tribute.author_name}</h4>
                                <Badge variant="secondary" className="text-xs">
                                  {tribute.status === 'approved' ? 'Verified' : 'Awaiting approval'}
                                </Badge>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {format(new Date(tribute.created_at), "MMM d, yyyy")}
                              </span>
                            </div>
                            <p className="text-foreground leading-relaxed">{tribute.message}</p>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No tributes yet. Be the first to share a memory.</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Memorial Stats */}
            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="p-6">
                <h3 className="font-serif text-lg font-semibold mb-4">Memorial Activity</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Heart className="h-4 w-4 text-primary" />
                      <span className="text-sm">Tributes</span>
                    </div>
                    <span className="font-semibold">{tributes.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Camera className="h-4 w-4 text-primary" />
                      <span className="text-sm">Photos</span>
                    </div>
                    <span className="font-semibold">{media.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
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
                  <QRCodeGenerator memorialUrl={memorialUrl} memorialName={memorial.full_name} />
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

        {/* Timeline Event Modal */}
        <Dialog open={isTimelineModalOpen} onOpenChange={setIsTimelineModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogTitle className="font-serif text-xl font-semibold">
              Add Timeline Event
            </DialogTitle>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="event-title">Event Title</Label>
                <Input
                  id="event-title"
                  value={eventForm.title}
                  onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Graduated from University"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="event-date">Date</Label>
                  <Input
                    id="event-date"
                    type="month"
                    value={eventForm.date}
                    onChange={(e) => setEventForm(prev => ({ ...prev, date: e.target.value }))}
                    placeholder="YYYY-MM"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="event-category">Category</Label>
                  <Select 
                    value={eventForm.category} 
                    onValueChange={(value) => setEventForm(prev => ({ ...prev, category: value }))}
                  >
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
                <Label htmlFor="event-description">Description</Label>
                <Textarea
                  id="event-description"
                  value={eventForm.description}
                  onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Tell the story of this moment..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Photo (optional)</Label>
                {timelineImagePreview ? (
                  <div className="relative">
                    <img 
                      src={timelineImagePreview} 
                      alt="Timeline event preview" 
                      className="w-full h-32 object-cover rounded-lg border border-border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={removeTimelineImage}
                    >
                      <span className="sr-only">Remove image</span>
                      ✕
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleTimelineImageSelect}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                      <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Click to upload a photo</p>
                      <p className="text-xs text-muted-foreground mt-1">Images up to 10MB. For videos, use the Photos section (up to 500MB) or share YouTube links</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => {
                  removeTimelineImage()
                  setIsTimelineModalOpen(false)
                }}>
                  Cancel
                </Button>
                <Button onClick={async () => {
                  try {
                    let imageUrl = eventForm.image_url
                    
                    // Upload image file if selected
                    if (timelineImageFile) {
                      const formData = new FormData()
                      formData.append('file', timelineImageFile)
                      formData.append('memorial_id', id)
                      formData.append('title', `Timeline: ${eventForm.title}`)
                      
                      const uploadResponse = await fetch(`/api/memorials/${id}/media/upload`, {
                        method: 'POST',
                        body: formData,
                      })
                      
                      if (uploadResponse.ok) {
                        const uploadData = await uploadResponse.json()
                        imageUrl = uploadData.url
                      } else {
                        throw new Error('Failed to upload image')
                      }
                    }
                    
                    const response = await fetch(`/api/memorials/${id}/timeline`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({
                        title: eventForm.title,
                        description: eventForm.description,
                        event_date: eventForm.date,
                        category: eventForm.category,
                        image_url: imageUrl || null
                      })
                    })
                    
                    if (response.ok) {
                      const newEvent = await response.json()
                      setTimeline(prev => [...prev, {
                        ...newEvent,
                        date: newEvent.event_date ? new Date(newEvent.event_date) : new Date(),
                        type: newEvent.category as any,
                        photos: newEvent.image_url ? [newEvent.image_url] : []
                      }].sort((a, b) => {
                        const aTime = a.date && !isNaN(a.date.getTime()) ? a.date.getTime() : 0
                        const bTime = b.date && !isNaN(b.date.getTime()) ? b.date.getTime() : 0
                        return aTime - bTime
                      }))
                      
                      setEventForm({ title: '', description: '', date: '', category: 'milestone', image_url: '' })
                      removeTimelineImage()
                      setIsTimelineModalOpen(false)
                    }
                  } catch (error) {
                    console.error('Failed to create timeline event:', error)
                    alert('Failed to create timeline event. Please try again.')
                  }
                }}>
                  Add Event
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Photo Upload Modal */}
        <Dialog open={isPhotoModalOpen} onOpenChange={setIsPhotoModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogTitle className="font-serif text-xl font-semibold">
              Add Photo or Video
            </DialogTitle>
            <div className="space-y-4">
              <div className="text-center border-2 border-dashed border-border rounded-lg p-8">
                <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Upload photos and videos to share memories
                </p>
                <MediaUpload 
                  memorialId={id}
                  onUpload={(uploadedItems) => {
                    console.log('Uploaded items:', uploadedItems)
                    setIsPhotoModalOpen(false)
                    // Refresh the page to show new media
                    window.location.reload()
                  }} 
                  triggerLabel="Upload Media"
                  helperText="Upload photos, videos, or documents to share memories"
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Tribute Modal */}
        <Dialog open={isTributeModalOpen} onOpenChange={setIsTributeModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogTitle className="font-serif text-xl font-semibold">
              Leave a Tribute
            </DialogTitle>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tribute-name">Your Name</Label>
                  <Input
                    id="tribute-name"
                    value={tributeForm.author_name}
                    onChange={(e) => setTributeForm(prev => ({ ...prev, author_name: e.target.value }))}
                    placeholder="Enter your name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tribute-email">Email (optional)</Label>
                  <Input
                    id="tribute-email"
                    type="email"
                    value={tributeForm.author_email}
                    onChange={(e) => setTributeForm(prev => ({ ...prev, author_email: e.target.value }))}
                    placeholder="your@email.com"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tribute-message">Your Message</Label>
                <Textarea
                  id="tribute-message"
                  value={tributeForm.message}
                  onChange={(e) => setTributeForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Share your memories, thoughts, or feelings..."
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsTributeModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={async () => {
                  try {
                    const response = await fetch(`/api/memorials/${id}/tributes`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify(tributeForm)
                    })
                    
                    if (response.ok) {
                      const newTribute = await response.json()
                      setTributes(prev => [newTribute, ...prev])
                      setTributeForm({ author_name: '', author_email: '', message: '' })
                      setIsTributeModalOpen(false)
                    }
                  } catch (error) {
                    console.error('Failed to create tribute:', error)
                  }
                }}>
                  <Heart className="h-4 w-4 mr-2" />
                  Share Tribute
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Memorial Bottom Navigation */}
        <MemorialBottomNav
          onAddTimeline={() => setIsTimelineModalOpen(true)}
          onAddPhoto={() => setIsPhotoModalOpen(true)}
          onAddTribute={() => setIsTributeModalOpen(true)}
          onShare={() => {
            if (navigator.share) {
              navigator.share({
                title: `${memorial.full_name} - Memorial`,
                text: `Remember ${memorial.full_name} on Sandalwood Memories`,
                url: window.location.href
              })
            } else {
              navigator.clipboard.writeText(window.location.href)
            }
          }}
          isOwner={memorial?.isOwner}
          memorialName={memorial?.full_name || ''}
        />

        {/* Footer */}
        <footer className="bg-foreground text-background py-12 mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center space-x-2 mb-4 md:mb-0">
                <Heart className="h-6 w-6 text-primary" />
                <span className="font-serif font-bold text-xl">Sandalwood Memories</span>
              </div>
              <div className="text-sm text-muted">Honouring {memorial.full_name} with love and remembrance.</div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}