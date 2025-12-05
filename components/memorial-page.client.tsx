"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, Share2, Calendar, MapPin, Edit, Users, Loader2, Camera, ArrowLeft, MoreVertical, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import MediaGallery from "@/components/media-gallery"
import TimelineWrapper from "@/components/timeline-wrapper"
import MediaUpload from "@/components/media-upload"
import QRCodeGenerator from "@/components/qr-code-generator"
import MemorialBottomNav from "@/components/memorial-bottom-nav"
import { UserNav } from "@/components/user-nav"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface Memorial {
  id: string
  full_name: string
  slug: string
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

export default function MemorialClient({ identifier }: { identifier: string }) {
  const [memorial, setMemorial] = useState<Memorial | null>(null)
  const [media, setMedia] = useState<MediaItem[]>([])
  const [tributes, setTributes] = useState<Tribute[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<"timeline" | "gallery" | "tributes">("timeline")
  const { user } = useAuth()
  const router = useRouter()

  // Modal states
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false)
  const [isTributeModalOpen, setIsTributeModalOpen] = useState(false)
  const [isBiographyEditOpen, setIsBiographyEditOpen] = useState(false)
  
  
  const [tributeForm, setTributeForm] = useState({
    author_name: '',
    author_email: '',
    message: ''
  })
  const [tributeErrors, setTributeErrors] = useState<Record<string, string>>({})
  const [isSubmittingTribute, setIsSubmittingTribute] = useState(false)
  const { toast } = useToast()

  const [biographyForm, setBiographyForm] = useState({
    biography: ''
  })

  const deleteTribute = async (tributeId: string) => {
    if (!memorial?.id) return
    
    try {
      const response = await fetch(`/api/memorials/${memorial.id}/tributes?tributeId=${tributeId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      
      if (response.ok) {
        // Remove the tribute from the local state
        setTributes(prev => prev.filter(t => t.id !== tributeId))
        toast({
          title: "Tribute deleted",
          description: "The tribute has been removed from the memorial page.",
        })
      } else {
        const data = await response.json()
        toast({
          title: "Failed to delete tribute",
          description: data.error || "Please try again later.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Failed to delete tribute:', error)
      toast({
        title: "Failed to delete tribute",
        description: "Please check your connection and try again.",
        variant: "destructive"
      })
    }
  }

  // Fix hydration by ensuring client-side mounting
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    const loadMemorialData = async () => {
      try {
        // Load memorial details - try as slug first, then as ID
        let memorialRes = await fetch(`/api/memorials/by-slug/${identifier}`, {
          credentials: 'include'
        })
        
        // If not found by slug, try by ID for backwards compatibility
        if (!memorialRes.ok) {
          memorialRes = await fetch(`/api/memorials/${identifier}`, {
            credentials: 'include'
          })
        }
        
        if (!memorialRes.ok) {
          throw new Error("Memorial not found")
        }
        
        const memorialData = await memorialRes.json()
        console.log('Memorial data loaded:', memorialData)
        setMemorial(memorialData)

        // Load media and tributes in parallel using the memorial ID
        const [mediaRes, tributesRes] = await Promise.all([
          fetch(`/api/memorials/${memorialData.id}/media`, { credentials: 'include' }).catch(() => null),
          fetch(`/api/memorials/${memorialData.id}/tributes`, { credentials: 'include' }).catch(() => null)
        ])

        if (mediaRes?.ok) {
          const mediaData = await mediaRes.json()
          setMedia(Array.isArray(mediaData) ? mediaData.map(item => ({
            ...item,
            date: new Date(item.created_at || item.date)
          })) : [])
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
  }, [identifier, mounted])

  const memorialUrl = `${typeof window !== "undefined" ? window.location.origin : "https://sandalwood-memories.com"}/memorial/${memorial?.slug || identifier}`

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

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Desktop Header */}
      <header className="hidden md:block border-b border-border/50 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/memorial" className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-primary" />
              <span className="font-serif font-bold text-2xl text-foreground">Sandalwood Memories</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/memorial">
                <Button variant="outline" size="sm" className="flex items-center space-x-2 bg-transparent">
                  <ArrowLeft className="h-4 w-4" />
                  <span>My Memorials</span>
                </Button>
              </Link>
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
              <UserNav />
            </div>
          </div>
        </div>
      </header>

      {/* Sophisticated Mobile Hero */}
      <div className="md:hidden">
        {/* Mobile Header */}
        <header className="border-b border-border/50 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <Link href="/memorial" className="flex items-center gap-2">
                <ArrowLeft className="h-5 w-5 text-primary" />
                <span className="font-serif font-bold text-lg text-foreground">My Memorials</span>
              </Link>
              <UserNav />
            </div>
          </div>
        </header>

        {/* Compact Cover like Facebook */}
        <div className="relative h-44 bg-gray-100 overflow-hidden">
          {memorial.cover_image_url ? (
            <img 
              src={memorial.cover_image_url} 
              alt="Cover" 
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          
          {/* Floating Action Button */}
        </div>

        {/* Clean Profile Section */}
        <div className="px-4 py-6 bg-white">
          <div className="flex items-start gap-4">
            <div className="relative">
              <img
                src={memorial.profile_image_url || "/elderly-woman-smiling.png"}
                alt={memorial.full_name}
                className="w-24 h-24 rounded-full object-cover border-2 border-gray-100"
              />
            </div>
            <div className="flex-1 min-w-0 pt-2">
              <h1 className="text-2xl font-semibold text-gray-900 leading-tight mb-1">
                {memorial.full_name}
              </h1>
              <p className="text-gray-600 text-base mb-3">
                {memorial.title || "Beloved Family Member"}
              </p>
              {memorial.birth_date && memorial.death_date && (
                <div className="flex items-center text-sm text-gray-500">
                  <span>
                    {format(new Date(memorial.birth_date), "MMM d, yyyy")} - {format(new Date(memorial.death_date), "MMM d, yyyy")}
                  </span>
                </div>
              )}
              {memorial.burial_location && (
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <MapPin className="h-3 w-3 mr-1" />
                  <span>{memorial.burial_location}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Biography Section */}
        {memorial.biography && (
          <div className="px-4 py-6 border-t border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">About</h2>
            <p className="text-gray-700 leading-relaxed text-base">
              {memorial.biography}
            </p>
          </div>
        )}

        {/* State-driven Content for Mobile */}
        <div className="px-4 py-6 min-h-[400px]">
          {activeTab === 'timeline' && (
            <TimelineWrapper 
              memorialId={memorial?.id || identifier}
              canEdit={memorial?.isOwner || user?.id === memorial?.created_by}
              media={media}
              onMediaUpload={(newMedia) => {
                // Add new media to the media list to sync with gallery
                setMedia(prevMedia => [...prevMedia, newMedia])
              }}
            />
          )}

          {activeTab === 'gallery' && (
            <MediaGallery 
              media={media} 
              title="" 
              onUploadClick={() => setIsPhotoModalOpen(true)}
              canUpload={memorial?.isOwner || user?.id === memorial?.created_by}
              memorialId={memorial?.id || identifier}
            />
          )}

          {activeTab === 'tributes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Messages of Remembrance</h3>
                <Button 
                  size="sm"
                  onClick={() => setIsTributeModalOpen(true)}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Heart className="h-4 w-4 mr-2" />
                  Leave Tribute
                </Button>
              </div>
              {tributes.length > 0 ? (
                tributes.map((tribute) => (
                  <div key={tribute.id} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm">{tribute.author_name}</h4>
                        <span className="text-xs text-gray-500">
                          {format(new Date(tribute.created_at), "MMM d, yyyy")}
                        </span>
                      </div>
                      {memorial?.isOwner && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTribute(tribute.id)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-50 ml-2"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{tribute.message}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Heart className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No tributes yet.</p>
                  <Button 
                    className="mt-3" 
                    size="sm"
                    onClick={() => setIsTributeModalOpen(true)}
                  >
                    Be the first to share a memory
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Bottom Spacing */}
        <div className="h-20" />

        {/* Sticky Bottom Nav */}
        <MemorialBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block">
        {/* Desktop Cover Image */}
        <div className="relative h-80 bg-gradient-to-r from-primary/20 to-accent/20">
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
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-serif text-2xl font-semibold">Life Story</h2>
                    {memorial.isOwner && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center space-x-2 bg-transparent"
                        onClick={() => {
                          setBiographyForm({ biography: memorial.biography || '' })
                          setIsBiographyEditOpen(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                        <span>Edit Biography</span>
                      </Button>
                    )}
                  </div>
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
                        <Users className="h-4 w-4" />
                        Photos
                      </TabsTrigger>
                      <TabsTrigger value="tributes" className="flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        Tributes
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  
                  <TabsContent value="timeline" className="p-8">
                    <TimelineWrapper 
                      memorialId={memorial?.id || identifier}
                      canEdit={memorial?.isOwner || user?.id === memorial?.created_by}
                      media={media}
                      onMediaUpload={(newMedia) => {
                        // Add new media to the media list to sync with gallery
                        setMedia(prevMedia => [...prevMedia, newMedia])
                      }}
                    />
                  </TabsContent>
                  
                  <TabsContent value="gallery" className="p-8">
                    <MediaGallery 
                      media={media} 
                      title="Photos & Videos" 
                      onUploadClick={() => setIsPhotoModalOpen(true)}
                      canUpload={memorial?.isOwner || user?.id === memorial?.created_by}
                      memorialId={memorial?.id || identifier}
                    />
                  </TabsContent>
                  
                  <TabsContent value="tributes" className="p-8">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="font-serif text-xl font-semibold">Messages of Remembrance</h3>
                        <Button 
                          className="bg-primary hover:bg-primary/90"
                          onClick={() => setIsTributeModalOpen(true)}
                        >
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
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                  {format(new Date(tribute.created_at), "MMM d, yyyy")}
                                </span>
                                {memorial?.isOwner && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteTribute(tribute.id)}
                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                            <p className="text-foreground leading-relaxed whitespace-pre-wrap">{tribute.message}</p>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No tributes yet. Be the first to share a memory.</p>
                          <Button 
                            className="mt-4 bg-primary hover:bg-primary/90"
                            onClick={() => setIsTributeModalOpen(true)}
                          >
                            <Heart className="h-4 w-4 mr-2" />
                            Leave Tribute
                          </Button>
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
                      <Users className="h-4 w-4 text-primary" />
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
                  memorialId={memorial?.id}
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
        <Dialog open={isTributeModalOpen} onOpenChange={(open) => {
          setIsTributeModalOpen(open)
          if (!open) {
            setTributeErrors({})
          }
        }}>
          <DialogContent className="sm:max-w-lg">
            <DialogTitle className="font-serif text-xl font-semibold flex items-center gap-2">
              <Heart className="h-5 w-5 text-rose-600" />
              Leave a Tribute
            </DialogTitle>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tribute-name">Your Name *</Label>
                  <Input
                    id="tribute-name"
                    value={tributeForm.author_name}
                    onChange={(e) => {
                      setTributeForm(prev => ({ ...prev, author_name: e.target.value }))
                      if (tributeErrors.author_name) {
                        setTributeErrors(prev => ({ ...prev, author_name: '' }))
                      }
                    }}
                    placeholder="Enter your full name"
                    className={tributeErrors.author_name ? "border-red-500" : ""}
                  />
                  {tributeErrors.author_name && (
                    <p className="text-sm text-red-600">{tributeErrors.author_name}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tribute-email">Email (optional)</Label>
                  <Input
                    id="tribute-email"
                    type="email"
                    value={tributeForm.author_email}
                    onChange={(e) => {
                      setTributeForm(prev => ({ ...prev, author_email: e.target.value }))
                      if (tributeErrors.author_email) {
                        setTributeErrors(prev => ({ ...prev, author_email: '' }))
                      }
                    }}
                    placeholder="your@email.com"
                    className={tributeErrors.author_email ? "border-red-500" : ""}
                  />
                  {tributeErrors.author_email && (
                    <p className="text-sm text-red-600">{tributeErrors.author_email}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tribute-message">Your Message *</Label>
                <Textarea
                  id="tribute-message"
                  value={tributeForm.message}
                  onChange={(e) => {
                    setTributeForm(prev => ({ ...prev, message: e.target.value }))
                    if (tributeErrors.message) {
                      setTributeErrors(prev => ({ ...prev, message: '' }))
                    }
                  }}
                  placeholder="Share your memories, thoughts, or condolences..."
                  rows={4}
                  maxLength={2000}
                  className={tributeErrors.message ? "border-red-500" : ""}
                />
                <div className="flex justify-between items-center">
                  {tributeErrors.message && (
                    <p className="text-sm text-red-600">{tributeErrors.message}</p>
                  )}
                  <p className="text-sm text-muted-foreground ml-auto">
                    {tributeForm.message.length}/2000 characters
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsTributeModalOpen(false)}
                  disabled={isSubmittingTribute}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={async () => {
                    setIsSubmittingTribute(true)
                    setTributeErrors({})
                    
                    try {
                      const response = await fetch(`/api/memorials/${memorial.id}/tributes`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify(tributeForm)
                      })
                      
                      const data = await response.json()
                      
                      if (response.ok) {
                        setTributes(prev => [data, ...prev])
                        setTributeForm({ author_name: '', author_email: '', message: '' })
                        setIsTributeModalOpen(false)
                        
                        toast({
                          title: "Tribute shared successfully",
                          description: "Your tribute is now visible on the memorial page.",
                        })
                      } else {
                        if (data.details) {
                          setTributeErrors(data.details)
                        } else {
                          toast({
                            title: "Failed to submit tribute",
                            description: data.error || "Please try again later.",
                            variant: "destructive"
                          })
                        }
                      }
                    } catch (error) {
                      console.error('Failed to create tribute:', error)
                      toast({
                        title: "Failed to submit tribute",
                        description: "Please check your connection and try again.",
                        variant: "destructive"
                      })
                    } finally {
                      setIsSubmittingTribute(false)
                    }
                  }}
                  disabled={isSubmittingTribute}
                  className="bg-rose-600 hover:bg-rose-700"
                >
                  {isSubmittingTribute ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Heart className="h-4 w-4 mr-2" />
                      Share Tribute
                    </>
                  )}
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground text-center">
                Your tribute will appear immediately on the memorial page.
              </p>
            </div>
          </DialogContent>
        </Dialog>

        {/* Biography Edit Modal */}
        <Dialog open={isBiographyEditOpen} onOpenChange={setIsBiographyEditOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogTitle className="font-serif text-xl font-semibold">
              Edit Life Story
            </DialogTitle>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="biography-edit">Biography</Label>
                <Textarea
                  id="biography-edit"
                  value={biographyForm.biography}
                  onChange={(e) => setBiographyForm(prev => ({ ...prev, biography: e.target.value }))}
                  placeholder="Share their life story, achievements, personality, and what made them special..."
                  rows={12}
                  className="min-h-[300px]"
                />
                <p className="text-sm text-muted-foreground">
                  Take your time to capture their essence and unique story.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsBiographyEditOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={async () => {
                  try {
                    const response = await fetch(`/api/memorials/${memorial.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({
                        biography: biographyForm.biography
                      })
                    })
                    
                    if (response.ok) {
                      setMemorial(prev => prev ? { ...prev, biography: biographyForm.biography } : null)
                      setIsBiographyEditOpen(false)
                    }
                  } catch (error) {
                    console.error('Failed to update biography:', error)
                  }
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>



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
  )
}