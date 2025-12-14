"use client"

import dynamic from "next/dynamic"
// webpackChunkName comments are used for better bundle splitting
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"

const TimelineWrapper = dynamic(() => import(/* webpackChunkName: "timeline-wrapper" */ "@/components/timeline-wrapper").then(mod => ({ default: mod.default })), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-16 text-slate-500">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-500"></div>
      <span className="text-lg ml-3">Preparing the timeline…</span>
    </div>
  ),
})

const MediaGallery = dynamic(() => import(/* webpackChunkName: "media-gallery" */ "@/components/media-gallery"), {
  ssr: false,
})

const TributeList = dynamic(() => import(/* webpackChunkName: "tribute-list" */ "@/components/tributes/tribute-list"), {
  ssr: false,
})

const TributeForm = dynamic(() => import(/* webpackChunkName: "tribute-form" */ "@/components/tributes/tribute-form"), {
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

interface MemorialContentProps {
  memorial: Memorial
  activeTab: "timeline" | "gallery" | "tributes"
  media: MemorialMediaItem[]
  tributes: Tribute[]
  timelineCount: number
  onTimelineCountChange: (count: number) => void
  onTimelineModalOpen: () => void
  onPhotoModalOpen: () => void
  onTributeSuccess: () => Promise<void>
  onTributeDeleted: (tributeId: string) => void
  user?: { id?: string; name?: string; email?: string } | null
}

export default function MemorialContent({
  memorial,
  activeTab,
  media,
  tributes,
  timelineCount,
  onTimelineCountChange,
  onTimelineModalOpen,
  onPhotoModalOpen,
  onTributeSuccess,
  onTributeDeleted,
  user
}: MemorialContentProps) {
  return (
    <>
      {/* Biography */}
      {memorial.biography && (
        <section className="py-8 md:py-12">
          <div className="mx-auto max-w-3xl px-4 md:px-6">
            <h2 className="font-serif text-2xl md:text-3xl font-medium text-foreground">About</h2>
            <div className="mt-3 md:mt-4 leading-relaxed text-muted-foreground space-y-3 md:space-y-4 text-lg md:text-xl">
              {memorial.biography.split("\n\n").map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
            {memorial.isOwner && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4 md:mt-6 h-10 md:h-9 touch-manipulation"
                onClick={() => {
                  // This will be handled by parent component
                  const event = new CustomEvent('editBiography', {
                    detail: { biography: memorial.biography }
                  })
                  window.dispatchEvent(event)
                }}
              >
                Edit biography
              </Button>
            )}
          </div>
        </section>
      )}

      {/* Tab Content */}
      {activeTab === "timeline" && (
        <section className="border-t border-border bg-muted/20 py-8 md:py-16">
          <div className="mx-auto max-w-5xl px-4 md:px-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 md:mb-12 gap-4">
              <div className="text-center sm:text-left flex-1">
                <h2 className="font-serif text-xl md:text-2xl lg:text-3xl font-medium text-foreground">Life Journey</h2>
                <p className="mt-1 md:mt-2 text-muted-foreground text-base md:text-lg">Scroll through the moments that made their life extraordinary</p>
              </div>
              {(memorial?.isOwner || user?.id === memorial?.created_by) && (
                <Button
                  onClick={onTimelineModalOpen}
                  className="bg-[#1B3B5F] hover:bg-[#16304d] text-white h-11 md:h-10 px-4 md:px-3 touch-manipulation w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Event
                </Button>
              )}
            </div>
            <TimelineWrapper
              memorialId={memorial?.id || ""}
              canEdit={memorial?.isOwner || user?.id === memorial?.created_by}
              media={media}
              onCountChange={onTimelineCountChange}
              externalModalOpen={false}
              onExternalModalClose={() => {}}
              onMediaUpload={(newMedia) => {
                // This will be handled by parent component
                const event = new CustomEvent('mediaUpload', { detail: { newMedia } })
                window.dispatchEvent(event)
              }}
            />
          </div>
        </section>
      )}

      {activeTab === "gallery" && (
        <section id="gallery-section" className="border-t border-border py-8 md:py-16 pb-20 md:pb-24">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 md:mb-8 gap-4">
              <div>
                <h2 className="font-serif text-xl md:text-2xl lg:text-3xl font-medium text-foreground">Gallery</h2>
                <p className="mt-1 md:mt-2 text-muted-foreground text-base md:text-lg">Photos and videos celebrating their life</p>
              </div>
              {(memorial?.isOwner || user?.id === memorial?.created_by) && (
                <Button
                  onClick={onPhotoModalOpen}
                  className="bg-[#1B3B5F] hover:bg-[#16304d] text-white h-11 md:h-10 px-4 md:px-3 touch-manipulation w-full sm:w-auto"
                >
                  <div className="h-4 w-4 mr-2">📷</div>
                  Add Media
                </Button>
              )}
            </div>
            <MediaGallery
              media={media}
              memorialId={memorial?.id || ""}
              canUpload={memorial?.isOwner || user?.id === memorial?.created_by}
              onUploadClick={onPhotoModalOpen}
            />
          </div>
        </section>
      )}

      {activeTab === "tributes" && (
        <section id="tributes-section" className="border-t border-border bg-muted/20 py-8 md:py-16 pb-20 md:pb-24">
          <div className="mx-auto max-w-4xl px-4 md:px-6">
            <div className="text-center mb-8 md:mb-12">
              <h2 className="font-serif text-xl md:text-2xl lg:text-3xl font-medium text-foreground">Tributes</h2>
              <p className="mt-1 md:mt-2 text-muted-foreground text-base md:text-lg">Share your memories and condolences</p>
            </div>

            {/* Tribute Form */}
            <div className="mb-12">
              <TributeForm
                memorialId={memorial?.id || ""}
                onSuccess={onTributeSuccess}
              />
            </div>

            {/* Tribute List */}
            <TributeList
              memorialId={memorial?.id || ""}
              isOwner={memorial?.isOwner || user?.id === memorial?.created_by}
              tributes={tributes}
              onTributeDeleted={onTributeDeleted}
            />
          </div>
        </section>
      )}
    </>
  )
}
