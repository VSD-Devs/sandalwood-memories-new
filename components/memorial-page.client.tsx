"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { useMemorialState } from "@/hooks/use-memorial-state"
import MemorialAccessGate from "@/components/memorial/memorial-access-gate"
import MemorialHeader from "@/components/memorial/memorial-header"
import MemorialContent from "@/components/memorial/memorial-content"
import MemorialPrivacyPanel from "@/components/memorial/memorial-privacy-panel"
import MemorialPhotoModal from "@/components/memorial/memorial-photo-modal"
import MemorialTributeModal from "@/components/memorial/memorial-tribute-modal"
import MemorialBiographyModal from "@/components/memorial/memorial-biography-modal"

const MediaUpload = dynamic(() => import(/* webpackChunkName: "media-upload" */ "@/components/media-upload"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-10 text-slate-500">
      <Loader2 className="mr-3 h-6 w-6 animate-spin" aria-hidden />
      <span className="text-lg">Opening the uploader…</span>
    </div>
  ),
})

const MemorialBottomNav = dynamic(() => import(/* webpackChunkName: "memorial-bottom-nav" */ "@/components/memorial-bottom-nav"), {
  ssr: false,
})

export default function MemorialClient({ identifier }: { identifier: string }) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<"timeline" | "gallery" | "tributes">("timeline")
  const [hasUploadLoaded, setHasUploadLoaded] = useState(false)
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false)
  const [isTributeModalOpen, setIsTributeModalOpen] = useState(false)
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false)
  const [isBiographyEditOpen, setIsBiographyEditOpen] = useState(false)
  const [isPrivacyPanelOpen, setIsPrivacyPanelOpen] = useState(false)

  const {
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
    fetchAccessRequests,
    handleAccessDecision,
    handlePrivacyToggle,
    handleCoverImageChange,
    submitAccessRequest,
    deleteTribute,
    updateBiography,
    refreshTributes,
  } = useMemorialState(identifier)

  // Event listeners for component communication
  useEffect(() => {
    const handleEditBiography = (event: CustomEvent) => {
      setIsBiographyEditOpen(true)
    }

    const handleTributeSubmitted = () => {
      refreshTributes()
    }

    window.addEventListener('editBiography', handleEditBiography as EventListener)
    window.addEventListener('tributeSubmitted', handleTributeSubmitted)

    return () => {
      window.removeEventListener('editBiography', handleEditBiography as EventListener)
      window.removeEventListener('tributeSubmitted', handleTributeSubmitted)
    }
  }, [])

  // Lazy load the uploader bundle only when the modal opens
  useEffect(() => {
    if (isPhotoModalOpen) {
      setHasUploadLoaded(true)
    }
  }, [isPhotoModalOpen])

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Show loading state only if we don't have memorial data yet
  if (loading && !memorial) {
    return (
      <div className="min-h-screen bg-memorial-bg flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (accessState.locked) {
    return (
      <MemorialAccessGate
        locked={accessState.locked}
        memorialId={accessState.memorialId}
        accessStatus={accessState.accessStatus}
        requestStatus={accessState.requestStatus}
        message={accessState.message}
        onRequestAccess={submitAccessRequest}
        user={user}
      />
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

  const memorialUrl = `${typeof window !== "undefined" ? window.location.origin : "https://sandalwood-memories.com"}/memorial/${memorial?.slug || identifier}`

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-20" style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom, 0px))" }}>
      <MemorialHeader
        memorial={memorial}
        memorialUrl={memorialUrl}
        onTributeModalOpen={() => setIsTributeModalOpen(true)}
        onPrivacyPanelOpen={() => setIsPrivacyPanelOpen(true)}
        onCoverImageChange={handleCoverImageChange}
        isCoverImageUploading={false}
        user={user}
      />

      <MemorialContent
        memorial={memorial}
        activeTab={activeTab}
        media={media}
        tributes={tributes}
        timelineCount={timelineCount}
        onTimelineCountChange={setTimelineCount}
        onTimelineModalOpen={() => setIsTimelineModalOpen(true)}
        onPhotoModalOpen={() => setIsPhotoModalOpen(true)}
        onTributeSuccess={refreshTributes}
        onTributeDeleted={deleteTribute}
        user={user}
      />

      <MemorialPrivacyPanel
        memorial={memorial}
        isOpen={isPrivacyPanelOpen}
        onOpenChange={setIsPrivacyPanelOpen}
        accessRequests={accessRequests}
        loadingRequests={loadingRequests}
        onRefreshRequests={() => memorial?.id && fetchAccessRequests(memorial.id)}
        onPrivacyToggle={handlePrivacyToggle}
        onAccessDecision={handleAccessDecision}
      />

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
      <MemorialPhotoModal
        isOpen={isPhotoModalOpen}
        onOpenChange={(open) => {
          setIsPhotoModalOpen(open)
          if (open) {
            setHasUploadLoaded(true)
          }
        }}
        onUpload={(uploadedItems) => {
          setIsPhotoModalOpen(false)
          window.location.reload()
        }}
        memorialId={memorial?.id}
        hasUploadLoaded={hasUploadLoaded}
        MediaUploadComponent={MediaUpload}
      />

      <MemorialTributeModal
        isOpen={isTributeModalOpen}
        onOpenChange={setIsTributeModalOpen}
        memorialId={memorial?.id}
      />

      <MemorialBiographyModal
        isOpen={isBiographyEditOpen}
        onOpenChange={setIsBiographyEditOpen}
        memorialId={memorial?.id}
        initialBiography={memorial.biography || ''}
        onSave={updateBiography}
      />

      {/* Bottom Navigation */}
      <MemorialBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  )
}