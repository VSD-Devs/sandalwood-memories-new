"use client"

import { useRef } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { Heart, Share2, Calendar, Edit, Camera, Loader2, ArrowLeft } from "lucide-react"

import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"

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

interface MemorialHeaderProps {
  memorial: Memorial
  memorialUrl: string
  onTributeModalOpen: () => void
  onPrivacyPanelOpen: () => void
  onCoverImageChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>
  isCoverImageUploading: boolean
  user?: { id?: string; name?: string; email?: string } | null
}

export default function MemorialHeader({
  memorial,
  memorialUrl,
  onTributeModalOpen,
  onPrivacyPanelOpen,
  onCoverImageChange,
  isCoverImageUploading,
  user
}: MemorialHeaderProps) {
  const coverImageInputRef = useRef<HTMLInputElement | null>(null)
  const { toast } = useToast()

  const getCoverImageUrl = () => {
    const coverUrl = memorial?.cover_image_url
    // Only use custom cover if it's explicitly set and not empty
    if (coverUrl && coverUrl.trim() !== "" && coverUrl !== "/elderly-woman-smiling.png" && coverUrl !== "/elderly-woman-reading.png" && coverUrl !== "/elderly-woman-gardening.png" && coverUrl !== "/elderly-woman-volunteering-library.png") {
      return coverUrl
    }
    return "/memorial-cover.png"
  }

  return (
    <>
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6 md:py-4">
          <Link
            href="/memorial"
            className="flex items-center gap-2 text-sm md:text-sm text-muted-foreground hover:text-foreground transition-colors touch-manipulation min-h-[44px] min-w-[44px] items-center justify-center -ml-2 pl-2"
          >
            <ArrowLeft className="h-5 w-5 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Back to Memorials</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <div className="flex items-center gap-1 md:gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onTributeModalOpen}
              className="h-11 w-11 md:h-10 md:w-10 touch-manipulation"
              aria-label="Leave a tribute"
            >
              <Heart className="h-5 w-5 md:h-4 md:w-4" />
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
              className="h-11 w-11 md:h-10 md:w-10 touch-manipulation"
              aria-label="Share memorial"
            >
              <Share2 className="h-5 w-5 md:h-4 md:w-4" />
            </Button>
            {memorial?.isOwner && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onPrivacyPanelOpen}
                title="Privacy & Access Settings"
                className="h-11 w-11 md:h-10 md:w-10 touch-manipulation"
                aria-label="Privacy settings"
              >
                <Edit className="h-5 w-5 md:h-4 md:w-4" />
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative">
        <div className="absolute inset-0 h-[50vh] max-h-[400px] md:h-[500px]">
          <img
            src={getCoverImageUrl()}
            alt=""
            className="h-full w-full object-cover"
            onError={(e) => {
              // Always fallback to memorial-cover.png if image fails to load
              e.currentTarget.src = "/memorial-cover.png"
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20" />
          {(memorial.isOwner || user?.id === memorial?.created_by) && (
            <div className="absolute top-3 right-3 md:top-4 md:right-4">
              <input
                ref={coverImageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onCoverImageChange}
                disabled={isCoverImageUploading}
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => coverImageInputRef.current?.click()}
                disabled={isCoverImageUploading}
                className="bg-white/95 hover:bg-white border border-white/20 shadow-lg backdrop-blur-sm text-slate-900 h-10 px-3 text-sm md:h-9 md:px-2 md:text-xs touch-manipulation"
              >
                {isCoverImageUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    <span className="hidden sm:inline">Uploading...</span>
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4 mr-1.5" />
                    <span className="hidden sm:inline">Change cover</span>
                    <span className="sm:hidden">Cover</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        <div className="relative mx-auto max-w-4xl px-4 pt-24 pb-8 md:px-6 md:pt-48 md:pb-12">
          <div className="flex flex-col items-center text-center">
            <div className="h-32 w-32 overflow-hidden rounded-xl border-4 border-background shadow-xl md:h-48 md:w-48">
              <img
                src={memorial.profile_image_url || "/elderly-woman-smiling.png"}
                alt={memorial.full_name}
                className="h-full w-full object-cover"
              />
            </div>
            <h1 className="mt-4 md:mt-6 font-serif text-2xl font-medium text-foreground md:text-5xl leading-tight px-2">
              {memorial.full_name}
            </h1>
            <div className="mt-2 md:mt-3 flex items-center gap-2 text-muted-foreground text-base md:text-lg px-4">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span className="text-center">
                {memorial.birth_date ? format(new Date(memorial.birth_date), "d MMM yyyy") : "Unknown"} — {memorial.death_date ? format(new Date(memorial.death_date), "d MMM yyyy") : "Unknown"}
              </span>
            </div>
            {memorial.title && (
              <p className="mt-3 md:mt-4 max-w-xl text-base md:text-lg italic text-muted-foreground px-4">"{memorial.title}"</p>
            )}
          </div>
        </div>
      </section>
    </>
  )
}


