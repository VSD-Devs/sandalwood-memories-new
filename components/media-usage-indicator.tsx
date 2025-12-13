"use client"

import { useState, useEffect } from "react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Crown, Image, Video, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"

interface MediaUsageIndicatorProps {
  memorialId: string | number
  photoCount?: number
  videoCount?: number
  className?: string
  showUpgrade?: boolean
}

const PLAN_LIMITS = {
  free: {
    maxPhotosPerMemorial: 3,
    maxVideosPerMemorial: 1,
  },
  premium: {
    maxPhotosPerMemorial: -1, // Unlimited
    maxVideosPerMemorial: -1, // Unlimited
  }
}

export default function MediaUsageIndicator({ 
  memorialId, 
  photoCount = 0, 
  videoCount = 0, 
  className = "",
  showUpgrade = true 
}: MediaUsageIndicatorProps) {
  const { user } = useAuth()
  const [userPlan, setUserPlan] = useState<string>("free")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadPlanInfo()
    } else {
      // If no user, default to free plan
      setUserPlan("free")
      setLoading(false)
    }
  }, [user])

  const loadPlanInfo = async () => {
    try {
      const response = await fetch('/api/usage', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setUserPlan(data.planType || "free")
      } else {
        console.warn('Failed to load plan info, defaulting to free')
        setUserPlan("free")
      }
    } catch (error) {
      console.error('Failed to load plan info:', error)
      setUserPlan("free") // Default to free plan
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`text-center py-2 ${className}`}>
        <span className="text-sm md:text-base text-slate-600">Loading usage...</span>
      </div>
    )
  }

  const limits = PLAN_LIMITS[userPlan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free
  const isPremium = userPlan !== "free"
  const photoAtLimit = !isPremium && photoCount >= limits.maxPhotosPerMemorial
  const videoAtLimit = !isPremium && videoCount >= limits.maxVideosPerMemorial
  const anyAtLimit = photoAtLimit || videoAtLimit

  if (isPremium) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <Badge variant="default" className="flex items-center gap-2 text-sm px-3 py-1.5">
          <Crown className="h-4 w-4" />
          Premium
        </Badge>
        <span className="text-sm text-slate-600">Unlimited media</span>
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Usage Progress */}
      <div className="space-y-2">
        {/* Photos */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm md:text-base">
            <div className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              <span>Photos</span>
            </div>
            <span className={photoAtLimit ? "text-amber-700 font-semibold" : "text-slate-700 font-medium"}>
              {photoCount}/{limits.maxPhotosPerMemorial}
            </span>
          </div>
          <Progress 
            value={(photoCount / limits.maxPhotosPerMemorial) * 100} 
            className="h-2 rounded-full"
          />
        </div>

        {/* Videos */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm md:text-base">
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              <span>Videos</span>
            </div>
            <span className={videoAtLimit ? "text-amber-700 font-semibold" : "text-slate-700 font-medium"}>
              {videoCount}/{limits.maxVideosPerMemorial}
            </span>
          </div>
          <Progress 
            value={(videoCount / limits.maxVideosPerMemorial) * 100} 
            className="h-2 rounded-full"
          />
        </div>
      </div>

      {/* Upgrade prompt if at limits */}
      {anyAtLimit && showUpgrade && (
        <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm md:text-base text-amber-800">
              {photoAtLimit && videoAtLimit 
                ? "Photo and video limits reached"
                : photoAtLimit 
                ? "Photo limit reached"
                : "Video limit reached"
              }
            </p>
          </div>
          <Link href="/pricing">
            <Button size="sm" variant="outline" className="h-9 text-sm px-3 border-amber-300 text-amber-800 hover:bg-amber-100">
              <Crown className="h-3 w-3 mr-1" />
              Upgrade
            </Button>
          </Link>
        </div>
      )}

      {/* Free plan badge */}
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="text-sm px-3 py-1.5">
          Free Plan
        </Badge>
        {!anyAtLimit && showUpgrade && (
          <Link href="/pricing">
            <Button variant="ghost" size="sm" className="h-9 text-sm px-3 text-slate-600 hover:text-slate-800">
              <Crown className="h-3 w-3 mr-1" />
              Upgrade
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}
