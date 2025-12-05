"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Crown, Zap, Check, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"

interface UsageData {
  memorialCount: number
  memorialUsage: Array<{
    memorial_id: number
    photo_count: number
    video_count: number
    media_size_mb: number
    timeline_events: number
  }>
}

interface UsageLimitModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  upgradeRequired?: boolean
}

const PLAN_LIMITS = {
  free: {
    maxMemorials: 1,
    maxPhotosPerMemorial: 3,
    maxVideosPerMemorial: 1,
  },
  premium: {
    maxMemorials: -1, // Unlimited
    maxPhotosPerMemorial: -1, // Unlimited
    maxVideosPerMemorial: -1, // Unlimited
  }
}

export default function UsageLimitModal({ 
  isOpen, 
  onClose, 
  title = "Usage Limit Reached",
  description,
  upgradeRequired = false 
}: UsageLimitModalProps) {
  const { user } = useAuth()
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [userPlan, setUserPlan] = useState<string>("free")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen && user) {
      loadUsageData()
    }
  }, [isOpen, user])

  const loadUsageData = async () => {
    try {
      // Fetch current usage
      const response = await fetch('/api/usage', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setUsage(data.usage)
        setUserPlan(data.planType || "free")
      } else {
        console.warn('Failed to load usage data, using defaults')
        // Set default values
        setUsage({
          memorialCount: 0,
          memorialUsage: []
        })
        setUserPlan("free")
      }
    } catch (error) {
      console.error('Failed to load usage data:', error)
      // Set default values on error
      setUsage({
        memorialCount: 0,
        memorialUsage: []
      })
      setUserPlan("free")
    } finally {
      setLoading(false)
    }
  }

  const limits = PLAN_LIMITS[userPlan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free
  const isPremium = userPlan !== "free"

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {upgradeRequired ? (
              <>
                <Crown className="h-5 w-5 text-amber-500" />
                {title}
              </>
            ) : (
              <>
                <Zap className="h-5 w-5 text-blue-500" />
                Usage Overview
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {description && (
            <p className="text-slate-600">{description}</p>
          )}

          {loading ? (
            <div className="text-center py-4">
              <div className="text-slate-600">Loading usage data...</div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Current Plan Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={isPremium ? "default" : "secondary"} className="flex items-center gap-1">
                    {isPremium ? (
                      <>
                        <Crown className="h-3 w-3" />
                        Premium Plan
                      </>
                    ) : (
                      "Free Plan"
                    )}
                  </Badge>
                </div>
                {!isPremium && (
                  <Link href="/pricing">
                    <Button size="sm" className="flex items-center gap-2">
                      <Crown className="h-4 w-4" />
                      Upgrade
                    </Button>
                  </Link>
                )}
              </div>

              {/* Memorial Usage */}
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Memorials</span>
                      <span className="text-sm text-slate-600">
                        {usage?.memorialCount || 0}/{limits.maxMemorials === -1 ? "∞" : limits.maxMemorials}
                      </span>
                    </div>
                    <Progress 
                      value={limits.maxMemorials === -1 ? 0 : (usage?.memorialCount || 0) / limits.maxMemorials * 100} 
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Media Usage per Memorial */}
              {usage?.memorialUsage && usage.memorialUsage.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-3">Media Usage</h4>
                    <div className="space-y-4">
                      {usage.memorialUsage.map((memorial, index) => (
                        <div key={memorial.memorial_id} className="space-y-2">
                          <div className="text-sm text-slate-600">Memorial {index + 1}</div>
                          
                          {/* Photos */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span>Photos</span>
                              <span>
                                {memorial.photo_count}/{limits.maxPhotosPerMemorial === -1 ? "∞" : limits.maxPhotosPerMemorial}
                              </span>
                            </div>
                            <Progress 
                              value={limits.maxPhotosPerMemorial === -1 ? 0 : memorial.photo_count / limits.maxPhotosPerMemorial * 100} 
                              className="h-1"
                            />
                          </div>

                          {/* Videos */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span>Videos</span>
                              <span>
                                {memorial.video_count}/{limits.maxVideosPerMemorial === -1 ? "∞" : limits.maxVideosPerMemorial}
                              </span>
                            </div>
                            <Progress 
                              value={limits.maxVideosPerMemorial === -1 ? 0 : memorial.video_count / limits.maxVideosPerMemorial * 100} 
                              className="h-1"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Upgrade Benefits */}
              {!isPremium && (
                <Card className="border-amber-200 bg-amber-50">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-amber-600" />
                        <span className="font-medium text-amber-900">Upgrade to Premium</span>
                      </div>
                      <div className="space-y-2 text-sm text-amber-800">
                        <div className="flex items-center gap-2">
                          <Check className="h-3 w-3" />
                          <span>Unlimited memorials</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="h-3 w-3" />
                          <span>Unlimited photos per memorial</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="h-3 w-3" />
                          <span>Unlimited videos per memorial</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="h-3 w-3" />
                          <span>Priority support</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              {upgradeRequired ? "Maybe Later" : "Close"}
            </Button>
            {!isPremium && (
              <Link href="/pricing">
                <Button className="flex items-center gap-2">
                  <Crown className="h-4 w-4" />
                  {upgradeRequired ? "Upgrade Now" : "View Plans"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}