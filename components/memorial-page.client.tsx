"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { useEffect, useState } from "react"
import { format } from "date-fns"
import { Heart, Share2, Calendar, Edit, Users, Loader2, Camera, Trash2, Lock, ShieldCheck, Ban, Clock, Eye, EyeOff, ArrowLeft } from "lucide-react"

import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

const TimelineWrapper = dynamic(() => import("@/components/timeline-wrapper"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-16 text-slate-500">
      <Loader2 className="mr-3 h-6 w-6 animate-spin" aria-hidden />
      <span className="text-lg">Preparing the timeline…</span>
    </div>
  ),
})

const MediaUpload = dynamic(() => import("@/components/media-upload"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-10 text-slate-500">
      <Loader2 className="mr-3 h-6 w-6 animate-spin" aria-hidden />
      <span className="text-lg">Opening the uploader…</span>
    </div>
  ),
})

const MediaGallery = dynamic(() => import("@/components/media-gallery"), {
  ssr: false,
})

const TributeList = dynamic(() => import("@/components/tributes/tribute-list"), {
  ssr: false,
})

const TributeForm = dynamic(() => import("@/components/tributes/tribute-form"), {
  ssr: false,
})

const MemorialBottomNav = dynamic(() => import("@/components/memorial-bottom-nav"), {
  ssr: false,
})

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
  is_public?: boolean
  accessStatus?: string
  requestStatus?: "pending" | "approved" | "declined" | null
  created_by?: string
  owner_user_id?: string | null
}

interface MemorialMediaItem {
  id: string
  memorial_id?: string
  file_url: string
  file_type: "image" | "video" | "document"
  title?: string | null
  description?: string | null
  uploaded_by?: string | null
  created_at: string
  date?: Date
}

interface Tribute {
  id: string
  author_name: string
  author_email?: string
  message: string
  status: string
  created_at: string
}

interface AccessRequest {
  id: string
  requester_name?: string | null
  requester_email?: string | null
  message?: string | null
  status: "pending" | "approved" | "declined"
  created_at: string
  updated_at?: string | null
}

export default function MemorialClient({ identifier }: { identifier: string }) {
  const [memorial, setMemorial] = useState<Memorial | null>(null)
  const [media, setMedia] = useState<MemorialMediaItem[]>([])
  const [tributes, setTributes] = useState<Tribute[]>([])
  const [tributeRefreshKey, setTributeRefreshKey] = useState(0)
  const [timelineCount, setTimelineCount] = useState(0)
  const [activeTab, setActiveTab] = useState<"timeline" | "gallery" | "tributes">("timeline")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [hasUploadLoaded, setHasUploadLoaded] = useState(false)
  const [accessState, setAccessState] = useState<{
    locked: boolean
    memorialId?: string
    accessStatus?: string
    requestStatus?: "pending" | "approved" | "declined" | null
    message?: string
  }>({ locked: false })
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([])
  const [loadingRequests, setLoadingRequests] = useState(false)
  const [privacyUpdating, setPrivacyUpdating] = useState(false)
  const [isPrivacyPanelOpen, setIsPrivacyPanelOpen] = useState(false)
  const [requestForm, setRequestForm] = useState({ name: "", email: "", message: "" })
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false)
  const { user } = useAuth()

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

  const fetchAccessRequests = async (memorialId: string) => {
    setLoadingRequests(true)
    try {
      const res = await fetch(`/api/memorials/${memorialId}/access-requests`, {
        credentials: "include",
      })

      if (res.ok) {
        const data = await res.json()
        setAccessRequests(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error("Failed to fetch access requests", err)
    } finally {
      setLoadingRequests(false)
    }
  }

  const handleAccessDecision = async (requestId: string, status: "approved" | "declined") => {
    if (!memorial?.id) return
    const previousStatus = accessRequests.find((req) => req.id === requestId)?.status || "pending"
    setAccessRequests((prev) => prev.map((req) => (req.id === requestId ? { ...req, status } : req)))
    try {
      const res = await fetch(`/api/memorials/${memorial.id}/access-requests`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ requestId, status }),
      })

      if (!res.ok) {
        throw new Error("Failed to update request")
      }
      toast({
        title: status === "approved" ? "Access approved" : "Access declined",
        description: status === "approved"
          ? "They can now view this memorial."
          : "The request has been declined.",
      })
    } catch (error) {
      console.error("Access request update error:", error)
      toast({
        title: "Could not update request",
        description: "Please try again in a moment.",
        variant: "destructive",
      })
      // revert optimistic change
      setAccessRequests((prev) => prev.map((req) => (req.id === requestId ? { ...req, status: previousStatus } : req)))
    }
  }

  const handlePrivacyToggle = async (nextIsPublic: boolean) => {
    if (!memorial?.id) return
    setPrivacyUpdating(true)
    try {
      const res = await fetch(`/api/memorials/${memorial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ is_public: nextIsPublic }),
      })

      if (!res.ok) {
        throw new Error("Update failed")
      }

      setMemorial((prev) => (prev ? { ...prev, is_public: nextIsPublic } : prev))
      setAccessState((prev) => ({
        ...prev,
        locked: false,
        accessStatus: nextIsPublic ? "public" : "owner",
        requestStatus: nextIsPublic ? null : prev.requestStatus,
      }))

      toast({
        title: nextIsPublic ? "Memorial is now public" : "Memorial is now private",
        description: nextIsPublic
          ? "It will appear on the landing page again."
          : "It is hidden and requires approvals.",
      })
    } catch (error) {
      console.error("Privacy update error:", error)
      toast({
        title: "Could not update privacy",
        description: "Please try again.",
        variant: "destructive",
      })
    } finally {
      setPrivacyUpdating(false)
    }
  }

  const submitAccessRequest = async () => {
    if (!accessState.memorialId) return
    if (!requestForm.name.trim() || !requestForm.email.trim()) {
      toast({
        title: "Details needed",
        description: "Please share your name and email so the owner can respond.",
        variant: "destructive",
      })
      return
    }

    setIsSubmittingRequest(true)
    try {
      const res = await fetch(`/api/memorials/${accessState.memorialId}/access-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: requestForm.name.trim(),
          email: requestForm.email.trim(),
          message: requestForm.message.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || "Could not submit request")
      }

      const statusFromApi = String(data.status || "")

      if (["public", "owner", "collaborator"].includes(statusFromApi)) {
        setAccessState((prev) => ({
          ...prev,
          locked: false,
          requestStatus: null,
        }))
        window.location.reload()
        return
      }

      const nextStatus = statusFromApi === "approved" ? "approved" : "pending"
      setAccessState((prev) => ({
        ...prev,
        requestStatus: nextStatus,
        locked: nextStatus !== "approved",
      }))

      toast({
        title: nextStatus === "pending" ? "Request sent" : "Access granted",
        description:
          nextStatus === "pending"
            ? "The memorial owner will review your request."
            : "You now have access to the memorial.",
      })

      if (nextStatus === "approved") {
        window.location.reload()
      }
    } catch (error) {
      console.error("Access request error:", error)
      toast({
        title: "Unable to send request",
        description: error instanceof Error ? error.message : "Please try again shortly.",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingRequest(false)
    }
  }

  // Fix hydration by ensuring client-side mounting
  useEffect(() => {
    setMounted(true)
  }, [])

  // Lazy load the uploader bundle only when the modal opens
  useEffect(() => {
    if (isPhotoModalOpen) {
      setHasUploadLoaded(true)
    }
  }, [isPhotoModalOpen])

  useEffect(() => {
    setRequestForm((prev) => ({
      ...prev,
      name: prev.name || user?.name || "",
      email: prev.email || user?.email || "",
    }))
  }, [user])

  useEffect(() => {
    if (!mounted) return
    
    const loadMemorialData = async () => {
      try {
        setLoading(true)
        setError(null)
        setAccessState((prev) => ({ ...prev, locked: false }))

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
        
        if (memorialRes.status === 401) {
          setAccessState({
            locked: true,
            memorialId: identifier,
            accessStatus: "unauthenticated",
            requestStatus: null,
            message: "Please sign in to view this memorial.",
          })
          return
        }

        if (memorialRes.status === 403) {
          const payload = await memorialRes.json().catch(() => ({}))
          setAccessState({
            locked: true,
            memorialId: payload?.memorialId || identifier,
            accessStatus: payload?.accessStatus || "none",
            requestStatus: payload?.requestStatus ?? null,
            message: payload?.error || "This memorial is private.",
          })
          return
        }
        
        if (!memorialRes.ok) {
          const payload = await memorialRes.json().catch(() => ({}))
          setError(payload?.error || "Memorial not found")
          return
        }
        
        const memorialData = await memorialRes.json()
        setMemorial(memorialData)
        setAccessState({
          locked: false,
          memorialId: memorialData.id,
          accessStatus: memorialData.accessStatus,
          requestStatus: memorialData.requestStatus ?? null,
        })

        // Load media and tributes in parallel using the memorial ID
        const [mediaRes, tributesRes] = await Promise.all([
          fetch(`/api/memorials/${memorialData.id}/media`, { credentials: 'include' }).catch(() => null),
          fetch(`/api/memorials/${memorialData.id}/tributes`, { credentials: 'include' }).catch(() => null)
        ])

        if (mediaRes?.ok) {
          const mediaData = await mediaRes.json()
          setMedia(Array.isArray(mediaData) ? mediaData.map(item => ({
            ...item,
            created_at: item.created_at || new Date().toISOString(),
            date: new Date(item.created_at || item.date || Date.now())
          })) : [])
        }


        if (tributesRes?.ok) {
          const tributesData = await tributesRes.json()
          setTributes(Array.isArray(tributesData) ? tributesData : [])
        }

      } catch (e) {
        console.error("Failed to load memorial:", e)
        setError(e instanceof Error ? e.message : "Failed to load memorial")
      } finally {
        setLoading(false)
      }
    }

    loadMemorialData()
  }, [identifier, mounted, user?.id])

  useEffect(() => {
    if (memorial?.id && memorial.isOwner) {
      fetchAccessRequests(memorial.id)
    }
  }, [memorial?.id, memorial?.isOwner])

  if (loading) {
    return (
      <div className="min-h-screen bg-memorial-bg flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (accessState.locked) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f5f7fb] to-white flex items-center justify-center px-4">
        <div className="max-w-2xl w-full rounded-3xl border border-slate-200 bg-white/90 shadow-xl p-8 md:p-10 space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
              <Lock className="h-6 w-6 text-[#1B3B5F]" aria-hidden />
            </div>
            <div className="space-y-1">
              <h1 className="font-serif text-3xl text-slate-900">This memorial is private</h1>
              <p className="text-slate-600 text-base">
                Request access from the memorial owner to view their stories and gallery.
              </p>
              {accessState.message && (
                <p className="text-sm text-slate-500">{accessState.message}</p>
              )}
            </div>
          </div>

          {accessState.requestStatus === "pending" && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3 flex items-start gap-3">
              <Clock className="h-5 w-5 text-[#1B3B5F]" aria-hidden />
              <div>
                <p className="font-semibold text-slate-900">Request sent</p>
                <p className="text-sm text-slate-600">We will let you know as soon as the owner approves.</p>
              </div>
            </div>
          )}

          {accessState.requestStatus === "declined" && (
            <div className="rounded-2xl border border-red-100 bg-red-50/70 px-4 py-3 flex items-start gap-3">
              <Ban className="h-5 w-5 text-red-600" aria-hidden />
              <div>
                <p className="font-semibold text-slate-900">Access declined</p>
                <p className="text-sm text-slate-600">You can try again with a short note to the owner.</p>
              </div>
            </div>
          )}

          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="access-name" className="text-base font-semibold">Your name</Label>
                <Input
                  id="access-name"
                  value={requestForm.name}
                  onChange={(e) => setRequestForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="How should we address you?"
                  className="h-12 text-base"
                  autoComplete="name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="access-email" className="text-base font-semibold">Email</Label>
                <Input
                  id="access-email"
                  type="email"
                  value={requestForm.email}
                  onChange={(e) => setRequestForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="you@example.com"
                  className="h-12 text-base"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="access-message" className="text-base font-semibold">Message to the owner</Label>
              <Textarea
                id="access-message"
                value={requestForm.message}
                onChange={(e) => setRequestForm((prev) => ({ ...prev, message: e.target.value }))}
                placeholder="Add a short note so they recognise you (optional)."
                rows={4}
                className="text-base"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600">We only share these details with the memorial owner.</p>
              <Button
                size="lg"
                className="bg-[#1B3B5F] hover:bg-[#16304d] text-white h-12 px-6 text-base"
                onClick={submitAccessRequest}
                disabled={isSubmittingRequest || accessState.requestStatus === "pending"}
              >
                {isSubmittingRequest ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Sending…
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-5 w-5 mr-2" />
                    Request access
                  </>
                )}
              </Button>
            </div>
          </div>

          {!user && (
            <p className="text-sm text-slate-500">
              Have an account already?{" "}
              <Link href="/auth?mode=signin" className="text-[#1B3B5F] font-semibold underline-offset-4 hover:underline">
                Sign in
              </Link>{" "}
              for quicker approval.
            </p>
          )}
        </div>
      </div>
    )
  }

  if (error || !memorial) {
    return (
      <div className="min-h-screen bg-memorial-bg flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <h2 className="font-serif text-3xl font-semibold">Memorial not found</h2>
          <p className="text-muted-foreground text-lg">
            {error || "This memorial doesn't exist or isn't accessible."}
          </p>
          <Link href="/memorial">
            <Button size="lg" className="h-12 px-8 text-base">Back to Memorials</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const memorialUrl = `${typeof window !== "undefined" ? window.location.origin : "https://sandalwood-memories.com"}/memorial/${memorial?.slug || identifier}`
  const defaultBackground = "/flower-bay.jpg"

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            href="/memorial"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Memorials
          </Link>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsTributeModalOpen(true)}
            >
              <Heart className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={async () => {
                try {
                  await navigator?.clipboard?.writeText(memorialUrl)
                  toast({
                    title: "Link copied",
                    description: "Share this memorial with family and friends.",
                  })
                } catch {
                  toast({
                    title: "Unable to copy",
                    description: "Please copy the link manually.",
                    variant: "destructive",
                  })
                }
              }}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative">
        <div className="absolute inset-0 h-[400px] md:h-[500px]">
          <img 
            src={memorial.cover_image_url || defaultBackground} 
            alt="" 
            className="h-full w-full object-cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20" />
        </div>

        <div className="relative mx-auto max-w-4xl px-6 pt-32 pb-12 md:pt-48">
          <div className="flex flex-col items-center text-center">
            <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-background shadow-xl md:h-40 md:w-40">
              <img
                src={memorial.profile_image_url || "/elderly-woman-smiling.png"}
                alt={memorial.full_name}
                className="h-full w-full object-cover"
              />
            </div>
            <h1 className="mt-6 font-serif text-3xl font-medium text-foreground md:text-5xl">
              {memorial.full_name}
            </h1>
            <div className="mt-3 flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {memorial.birth_date ? format(new Date(memorial.birth_date), "d MMM yyyy") : "Unknown"} — {memorial.death_date ? format(new Date(memorial.death_date), "d MMM yyyy") : "Unknown"}
              </span>
            </div>
            {memorial.title && (
              <p className="mt-4 max-w-xl text-lg italic text-muted-foreground">"{memorial.title}"</p>
            )}
          </div>
        </div>
      </section>

      {/* Biography */}
      {memorial.biography && (
        <section className="py-12">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="font-serif text-2xl font-medium text-foreground">About</h2>
            <div className="mt-4 leading-relaxed text-muted-foreground space-y-4">
              {memorial.biography.split("\n\n").map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
            {memorial.isOwner && (
              <Button
                variant="outline"
                size="sm"
                className="mt-6"
                onClick={() => {
                  setBiographyForm({ biography: memorial.biography || "" })
                  setIsBiographyEditOpen(true)
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit biography
              </Button>
            )}
          </div>
        </section>
      )}

      {/* Tab Content */}
      {activeTab === "timeline" && (
        <section className="border-t border-border bg-muted/20 py-16">
          <div className="mx-auto max-w-5xl px-6">
            <div className="flex items-center justify-between mb-12">
              <div className="text-center flex-1">
                <h2 className="font-serif text-2xl font-medium text-foreground md:text-3xl">Life Journey</h2>
                <p className="mt-2 text-muted-foreground">Scroll through the moments that made their life extraordinary</p>
              </div>
            </div>
            <TimelineWrapper 
              memorialId={memorial?.id || identifier}
              canEdit={memorial?.isOwner || user?.id === memorial?.created_by}
              media={media}
              onCountChange={setTimelineCount}
              onMediaUpload={(newMedia) => {
                const enrichedMedia: MemorialMediaItem = {
                  ...newMedia,
                  created_at: (newMedia as any).created_at || new Date().toISOString(),
                }
                setMedia((prevMedia) => [...prevMedia, enrichedMedia])
              }}
            />
          </div>
        </section>
      )}

      {activeTab === "gallery" && (
        <section className="border-t border-border py-16 pb-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="font-serif text-2xl font-medium text-foreground md:text-3xl">Gallery</h2>
                <p className="mt-2 text-muted-foreground">Photos and videos celebrating their life</p>
              </div>
              {(memorial?.isOwner || user?.id === memorial?.created_by) && (
                <Button
                  onClick={() => setIsPhotoModalOpen(true)}
                  className="bg-[#1B3B5F] hover:bg-[#16304d] text-white"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Add Media
                </Button>
              )}
            </div>
            <MediaGallery
              media={media}
              memorialId={memorial?.id || identifier}
              canUpload={memorial?.isOwner || user?.id === memorial?.created_by}
              onUploadClick={() => setIsPhotoModalOpen(true)}
            />
          </div>
        </section>
      )}

      {activeTab === "tributes" && (
        <section className="border-t border-border bg-muted/20 py-16 pb-24">
          <div className="mx-auto max-w-4xl px-6">
            <div className="text-center mb-12">
              <h2 className="font-serif text-2xl font-medium text-foreground md:text-3xl">Tributes</h2>
              <p className="mt-2 text-muted-foreground">Share your memories and condolences</p>
            </div>
            
            {/* Tribute Form */}
            <div className="mb-12">
              <TributeForm
                memorialId={memorial?.id || identifier}
                onSuccess={async () => {
                  // Refresh tributes list
                  if (memorial?.id) {
                    try {
                      const res = await fetch(`/api/memorials/${memorial.id}/tributes`, { credentials: 'include' })
                      if (res.ok) {
                        const data = await res.json()
                        setTributes(Array.isArray(data) ? data : [])
                        // Trigger refresh in TributeList by updating key
                        setTributeRefreshKey(prev => prev + 1)
                      }
                    } catch (error) {
                      console.error('Failed to refresh tributes:', error)
                    }
                  }
                }}
              />
            </div>

            {/* Tribute List */}
            <TributeList
              key={`tribute-list-${tributeRefreshKey}`}
              memorialId={memorial?.id || identifier}
              isOwner={memorial?.isOwner || user?.id === memorial?.created_by}
              onTributeDeleted={async () => {
                // Refresh tributes list
                if (memorial?.id) {
                  try {
                    const res = await fetch(`/api/memorials/${memorial.id}/tributes`, { credentials: 'include' })
                    if (res.ok) {
                      const data = await res.json()
                      setTributes(Array.isArray(data) ? data : [])
                      setTributeRefreshKey(prev => prev + 1)
                    }
                  } catch (error) {
                    console.error('Failed to refresh tributes:', error)
                  }
                }
              }}
            />
          </div>
        </section>
      )}

      {/* Privacy Panel for Owners */}
      {memorial.isOwner && (
        <Sheet open={isPrivacyPanelOpen} onOpenChange={setIsPrivacyPanelOpen}>
          <SheetContent
            side="right"
            className="w-full sm:max-w-2xl border-l border-slate-200 bg-white/95 text-slate-900 backdrop-blur-md overflow-y-auto"
          >
            <SheetHeader className="px-1 pb-3">
              <div className="flex items-center gap-3 mb-1">
                {memorial.is_public !== false ? (
                  <div className="p-2 rounded-xl bg-emerald-100/80">
                    <Eye className="h-5 w-5 text-emerald-700" />
                  </div>
                ) : (
                  <div className="p-2 rounded-xl bg-slate-100">
                    <EyeOff className="h-5 w-5 text-slate-700" />
                  </div>
                )}
                <div>
                  <SheetTitle className="font-serif text-xl text-slate-900">Privacy & Access</SheetTitle>
                  <SheetDescription className="text-slate-600 mt-0.5 text-sm">
                    Control who can see this memorial and manage viewing requests
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="space-y-4 pb-4 pr-1">
              {/* Visibility Settings */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
                  <Lock className="h-4 w-4 text-slate-600" />
                  <h3 className="font-semibold text-slate-900 text-sm">Visibility Settings</h3>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {memorial.is_public !== false ? (
                          <ShieldCheck className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Lock className="h-4 w-4 text-slate-700" />
                        )}
                        <span className="font-medium text-slate-900">
                          {memorial.is_public !== false ? "Public memorial" : "Private memorial"}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">
                        {memorial.is_public !== false
                          ? "Appears in search results and can be shared freely"
                          : "Hidden from search, requires owner approval to view"
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <EyeOff className="h-4 w-4 text-slate-600" />
                      <span className="text-sm font-medium text-slate-700">Private</span>
                    </div>
                    <Switch
                      checked={memorial.is_public !== false}
                      onCheckedChange={(checked) => handlePrivacyToggle(checked)}
                      disabled={privacyUpdating}
                      aria-label="Toggle memorial visibility"
                    />
                    <div className="flex items-center gap-3">
                      <Eye className="h-4 w-4 text-slate-600" />
                      <span className="text-sm font-medium text-slate-700">Public</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Access Requests */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-slate-600" />
                    <h3 className="font-semibold text-slate-900">Access Requests</h3>
                    {accessRequests.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {accessRequests.length}
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => memorial?.id && fetchAccessRequests(memorial.id)}
                    className="text-slate-700 hover:text-slate-900"
                  >
                    <Loader2 className={`h-3 w-3 mr-1.5 ${loadingRequests ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>

                {loadingRequests ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="flex items-center gap-3 text-slate-600">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Loading requests...</span>
                    </div>
                  </div>
                ) : accessRequests.length > 0 ? (
                  <div className="space-y-3">
                    {accessRequests.map((req) => (
                      <div
                        key={req.id}
                        className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-slate-900">{req.requester_name || "Anonymous Guest"}</p>
                              <Badge
                                variant="outline"
                                className={
                                  req.status === "approved"
                                    ? "border-emerald-200 text-emerald-700 bg-emerald-50"
                                    : req.status === "declined"
                                      ? "border-red-200 text-red-700 bg-red-50"
                                      : "border-amber-200 text-amber-700 bg-amber-50"
                                }
                              >
                                {req.status === "pending" ? "Pending" : req.status === "approved" ? "Approved" : "Declined"}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-600">{req.requester_email || "No email provided"}</p>
                            <p className="text-xs text-slate-500">
                              Requested {format(new Date(req.created_at), "d MMM yyyy 'at' h:mm a")}
                            </p>
                            {req.message && (
                              <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                                <p className="text-sm text-slate-700 italic">"{req.message}"</p>
                              </div>
                            )}
                          </div>
                          {req.status === "pending" && (
                            <div className="flex flex-col gap-1.5 sm:flex-row sm:self-start">
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={() => handleAccessDecision(req.id, "approved")}
                              >
                                <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-200 text-red-700 hover:bg-red-50"
                                onClick={() => handleAccessDecision(req.id, "declined")}
                              >
                                <Ban className="h-3.5 w-3.5 mr-1.5" />
                                Decline
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Users className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-600 font-medium text-sm">No access requests</p>
                    <p className="text-xs text-slate-500 mt-0.5">Requests from family and friends will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <p className="text-sm text-muted-foreground">
            This memorial was created with love using{" "}
            <Link href="/" className="text-primary hover:underline">
              Sandalwood Memories
            </Link>
          </p>
        </div>
      </footer>

      {/* Modals */}
      {/* Photo Upload Modal */}
        <Dialog
          open={isPhotoModalOpen}
          onOpenChange={(open) => {
            setIsPhotoModalOpen(open)
            if (open) {
              setHasUploadLoaded(true)
            }
          }}
        >
          <DialogContent className="max-w-4xl sm:max-w-4xl max-h-[90vh] overflow-y-auto top-[56%] sm:top-[52%]">
            <DialogTitle className="font-serif text-3xl font-semibold pb-6">
            Add photo or video
            </DialogTitle>
            <div className="space-y-6">
            <div className="text-center border-2 border-dashed border-border rounded-lg p-10 bg-blue-50/40">
              <Camera className="h-16 w-16 text-[#1B3B5F] mx-auto mb-6" />
              <p className="text-slate-700 mb-6 text-lg">
                Upload photos and videos to share memories.
                </p>
                {hasUploadLoaded ? (
                  <MediaUpload 
                    memorialId={memorial?.id}
                    onUpload={(uploadedItems) => {
                      setIsPhotoModalOpen(false)
                      // Refresh the page to show new media
                      window.location.reload()
                    }} 
                  triggerLabel="Upload media"
                  helperText="Share photos, videos, or documents"
                  />
                ) : (
                  <div className="flex items-center justify-center py-8 text-slate-600 text-lg">
                    <Loader2 className="mr-3 h-6 w-6 animate-spin" aria-hidden />
                    <span>Loading the uploader…</span>
                  </div>
                )}
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
          <DialogContent className="max-w-4xl sm:max-w-4xl max-h-[90vh] overflow-y-auto top-[56%] sm:top-[52%]">
            <DialogTitle className="font-serif text-3xl font-semibold flex items-center gap-3 pb-6">
            <Heart className="h-6 w-6 text-[#1B3B5F]" />
            Leave a tribute
            </DialogTitle>
            <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                <Label htmlFor="tribute-name" className="text-base font-semibold">Your name <span className="text-red-600">*</span></Label>
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
                    className={`h-12 text-base ${tributeErrors.author_name ? "border-red-500" : ""}`}
                  />
                  {tributeErrors.author_name && (
                    <p className="text-base text-red-600">{tributeErrors.author_name}</p>
                  )}
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="tribute-email" className="text-base font-semibold">Email <span className="text-slate-500 font-normal">(optional)</span></Label>
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
                    className={`h-12 text-base ${tributeErrors.author_email ? "border-red-500" : ""}`}
                  />
                  {tributeErrors.author_email && (
                    <p className="text-base text-red-600">{tributeErrors.author_email}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-3">
              <Label htmlFor="tribute-message" className="text-base font-semibold">Your message <span className="text-red-600">*</span></Label>
                <Textarea
                  id="tribute-message"
                  value={tributeForm.message}
                  onChange={(e) => {
                    setTributeForm(prev => ({ ...prev, message: e.target.value }))
                    if (tributeErrors.message) {
                      setTributeErrors(prev => ({ ...prev, message: '' }))
                    }
                  }}
                placeholder="Share memories, stories, or kind words…"
                  rows={6}
                  maxLength={2000}
                  className={`text-base resize-none ${tributeErrors.message ? "border-red-500" : ""}`}
                />
                <div className="flex justify-between items-center">
                  {tributeErrors.message && (
                    <p className="text-base text-red-600">{tributeErrors.message}</p>
                  )}
                <p className="text-base text-slate-600 ml-auto">
                    {tributeForm.message.length}/2000 characters
                  </p>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 pt-6 border-t border-slate-200">
                <Button 
                  size="lg"
                  variant="outline" 
                  onClick={() => setIsTributeModalOpen(false)}
                  disabled={isSubmittingTribute}
                  className="h-12 px-8 text-base"
                >
                  Cancel
                </Button>
                <Button 
                  size="lg"
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
                        title: "Tribute shared",
                        description: "Your words are now part of this memorial.",
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
                className="bg-[#1B3B5F] hover:bg-[#16304d] text-white h-12 px-8 text-base"
                >
                  {isSubmittingTribute ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Submitting…
                    </>
                  ) : (
                    <>
                      <Heart className="h-5 w-5 mr-2" />
                    Share tribute
                    </>
                  )}
                </Button>
              </div>
              
            <p className="text-base text-slate-600 text-center">
                Your tribute will appear immediately on the memorial page.
              </p>
            </div>
          </DialogContent>
        </Dialog>

        {/* Biography Edit Modal */}
        <Dialog open={isBiographyEditOpen} onOpenChange={setIsBiographyEditOpen}>
          <DialogContent className="max-w-4xl sm:max-w-4xl max-h-[90vh] overflow-y-auto top-[56%] sm:top-[52%]">
            <DialogTitle className="font-serif text-3xl font-semibold pb-6">
            Edit life story
            </DialogTitle>
            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="biography-edit" className="text-base font-semibold">Biography</Label>
                <Textarea
                  id="biography-edit"
                  value={biographyForm.biography}
                  onChange={(e) => setBiographyForm(prev => ({ ...prev, biography: e.target.value }))}
                  placeholder="Share their life story, achievements, personality, and what made them special..."
                  rows={12}
                  className="min-h-[400px] text-base resize-none"
                />
              <p className="text-base text-slate-600">
                  Take your time to capture their essence and unique story.
                </p>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 pt-6 border-t border-slate-200">
                <Button size="lg" variant="outline" onClick={() => setIsBiographyEditOpen(false)} className="h-12 px-8 text-base">
                  Cancel
                </Button>
                <Button size="lg" onClick={async () => {
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
                }} className="h-12 px-8 text-base bg-[#1B3B5F] hover:bg-[#16304d] text-white">
                  <Edit className="h-5 w-5 mr-2" />
                Save changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      {/* Bottom Navigation */}
      <MemorialBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  )
}