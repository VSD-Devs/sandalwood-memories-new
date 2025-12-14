"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
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

interface AccessState {
  locked: boolean
  memorialId?: string
  accessStatus?: string
  requestStatus?: "pending" | "approved" | "declined" | null
  message?: string
}

export function useMemorialState(identifier: string) {
  const [memorial, setMemorial] = useState<Memorial | null>(null)
  const [media, setMedia] = useState<MemorialMediaItem[]>([])
  const [tributes, setTributes] = useState<Tribute[]>([])
  const [tributeRefreshKey, setTributeRefreshKey] = useState(0)
  const [timelineCount, setTimelineCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [accessState, setAccessState] = useState<AccessState>({ locked: false })
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([])
  const [loadingRequests, setLoadingRequests] = useState(false)
  const [privacyUpdating, setPrivacyUpdating] = useState(false)

  const { user } = useAuth()
  const { toast } = useToast()

  // Fix hydration by ensuring client-side mounting
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load memorial data
  useEffect(() => {
    if (!mounted) return

    let cancelled = false

    const loadMemorialData = async () => {
      try {
        setLoading(true)
        setError(null)
        setAccessState((prev) => ({ ...prev, locked: false }))

        // Try both slug and ID endpoints in parallel for faster loading
        // Most memorials will be accessed by slug, but we support ID for backwards compatibility
        const [slugRes, idRes] = await Promise.all([
          fetch(`/api/memorials/by-slug/${identifier}`, {
            credentials: 'include',
            // Add cache headers for better performance
            headers: {
              'Cache-Control': 'public, max-age=60'
            }
          }).catch(() => ({ ok: false, status: 404 } as Response)),
          // Only try ID if identifier looks like a UUID (36 chars with hyphens)
          identifier.length === 36 && identifier.includes('-')
            ? fetch(`/api/memorials/${identifier}`, {
                credentials: 'include',
                headers: {
                  'Cache-Control': 'public, max-age=60'
                }
              }).catch(() => ({ ok: false, status: 404 } as Response))
            : Promise.resolve({ ok: false, status: 404 } as Response)
        ])

        // Use whichever response succeeded
        const memorialRes = slugRes.ok ? slugRes : idRes.ok ? idRes : slugRes

        if (cancelled) return

        if (memorialRes.status === 401) {
          setAccessState({
            locked: true,
            memorialId: identifier,
            accessStatus: "unauthenticated",
            requestStatus: null,
            message: "Please sign in to view this memorial.",
          })
          setLoading(false)
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
          setLoading(false)
          return
        }

        if (!memorialRes.ok) {
          const payload = await memorialRes.json().catch(() => ({}))
          setError(payload?.error || "Memorial not found")
          setLoading(false)
          return
        }

        const memorialData = await memorialRes.json()
        
        if (cancelled) return

        setMemorial(memorialData)
        setAccessState({
          locked: false,
          memorialId: memorialData.id,
          accessStatus: memorialData.accessStatus,
          requestStatus: memorialData.requestStatus ?? null,
        })

        // Load media and tributes in parallel immediately after memorial loads
        // This allows the page to render while these load
        const [mediaRes, tributesRes] = await Promise.all([
          fetch(`/api/memorials/${memorialData.id}/media`, { 
            credentials: 'include',
            headers: {
              'Cache-Control': 'public, max-age=60'
            }
          }).catch(() => null),
          fetch(`/api/memorials/${memorialData.id}/tributes`, { 
            credentials: 'include',
            headers: {
              'Cache-Control': 'public, max-age=30'
            }
          }).catch(() => null)
        ])

        if (cancelled) return

        if (mediaRes?.ok) {
          const mediaData = await mediaRes.json()
          if (!cancelled) {
            setMedia(Array.isArray(mediaData) ? mediaData.map(item => ({
              ...item,
              created_at: item.created_at || new Date().toISOString(),
              date: new Date(item.created_at || item.date || Date.now())
            })) : [])
          }
        }

        if (tributesRes?.ok) {
          const tributesData = await tributesRes.json()
          if (!cancelled) {
            setTributes(Array.isArray(tributesData) ? tributesData : [])
          }
        }

      } catch (e) {
        if (!cancelled) {
          console.error("Failed to load memorial:", e)
          setError(e instanceof Error ? e.message : "Failed to load memorial")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadMemorialData()

    return () => {
      cancelled = true
    }
  }, [identifier, mounted, user?.id])

  // Load access requests when memorial changes
  useEffect(() => {
    if (memorial?.id && memorial.isOwner) {
      fetchAccessRequests(memorial.id)
    }
  }, [memorial?.id, memorial?.isOwner])

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

  const handleCoverImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !memorial?.id) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      })
      return
    }

    try {
      // Upload directly to server-side processing API
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", "image")
      formData.append("userId", user?.id || "")
      formData.append("memorialId", memorial.id)

      const uploadResponse = await fetch("/api/media/process", {
        method: "POST",
        body: formData,
        credentials: "include",
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        throw new Error(errorData.error || "Upload failed")
      }

      const uploadData = await uploadResponse.json()
      const coverImageUrl = uploadData.item?.file_url

      if (!coverImageUrl) {
        throw new Error("No file URL returned")
      }

      // Update memorial with new cover image URL
      const updateResponse = await fetch(`/api/memorials/${memorial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ cover_image_url: coverImageUrl }),
      })

      if (!updateResponse.ok) {
        throw new Error("Update failed")
      }

      setMemorial((prev) => (prev ? { ...prev, cover_image_url: coverImageUrl } : null))
      toast({
        title: "Cover image updated",
        description: "The cover image has been changed successfully.",
      })
    } catch (error) {
      console.error("Cover image update error:", error)
      toast({
        title: "Could not update cover image",
        description: "Please try again.",
        variant: "destructive",
      })
    }
  }

  const submitAccessRequest = async (formData: { name: string; email: string; message: string }) => {
    if (!accessState.memorialId) return

    try {
      const res = await fetch(`/api/memorials/${accessState.memorialId}/access-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          message: formData.message.trim() || undefined,
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
    }
  }

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

  const updateBiography = async (biography: string) => {
    if (!memorial?.id) return

    const response = await fetch(`/api/memorials/${memorial.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ biography })
    })

    if (response.ok) {
      setMemorial(prev => prev ? { ...prev, biography } : null)
    } else {
      throw new Error('Failed to update biography')
    }
  }

  const refreshTributes = async () => {
    if (!memorial?.id) return

    try {
      const res = await fetch(`/api/memorials/${memorial.id}/tributes`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setTributes(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Failed to refresh tributes:', error)
    }
  }

  return {
    // State
    memorial,
    media,
    setMedia,
    tributes,
    setTributes,
    timelineCount,
    setTimelineCount,
    loading,
    error,
    mounted,
    accessState,
    accessRequests,
    loadingRequests,
    privacyUpdating,

    // Actions
    fetchAccessRequests,
    handleAccessDecision,
    handlePrivacyToggle,
    handleCoverImageChange,
    submitAccessRequest,
    deleteTribute,
    updateBiography,
    refreshTributes,
  }
}
