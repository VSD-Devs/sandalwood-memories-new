"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/contexts/auth-context"
import { CreditCard, Calendar, AlertCircle, ExternalLink, Crown, Star, Heart } from "lucide-react"
import Link from "next/link"

interface Subscription {
  id: number
  plan_type: "free" | "premium" | "fully_managed"
  status: "active" | "cancelled" | "past_due" | "incomplete"
  created_at: string
  stripe_data?: {
    subscription: any
    customer: any
  }
}

export default function BillingPage() {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (user) {
      fetchSubscription()
    }
  }, [user])

  const fetchSubscription = async () => {
    try {
      // In a real app, you'd fetch from your API
      // For demo purposes, we'll simulate the subscription data
      setSubscription({
        id: 1,
        plan_type: "free",
        status: "active",
        created_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Error fetching subscription:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!user || !subscription) return

    setActionLoading(true)
    try {
      const response = await fetch("/api/subscription/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      })

      if (response.ok) {
        await fetchSubscription()
      }
    } catch (error) {
      console.error("Error cancelling subscription:", error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleManageBilling = async () => {
    if (!user) return

    setActionLoading(true)
    try {
      const response = await fetch("/api/subscription/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      })

      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error("Error opening billing portal:", error)
    } finally {
      setActionLoading(false)
    }
  }

  const getPlanIcon = (planType: string) => {
    switch (planType) {
      case "premium":
        return <Star className="w-5 h-5 text-amber-600" />
      case "fully_managed":
        return <Crown className="w-5 h-5 text-amber-600" />
      default:
        return <Heart className="w-5 h-5 text-rose-600" />
    }
  }

  const getPlanName = (planType: string) => {
    switch (planType) {
      case "premium":
        return "Premium"
      case "fully_managed":
        return "Fully Managed"
      default:
        return "Free"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-gray-100 text-gray-800"
      case "past_due":
        return "bg-red-100 text-red-800"
      default:
        return "bg-yellow-100 text-yellow-800"
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle>Please Sign In</CardTitle>
            <CardDescription>You need to be signed in to view your billing information.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/">Go to Homepage</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-rose-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-gray-900 mb-2">Billing & Subscription</h1>
          <p className="text-gray-600">Manage your subscription and billing information</p>
        </div>

        <div className="grid gap-6">
          {/* Current Plan */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {subscription && getPlanIcon(subscription.plan_type)}
                  <div>
                    <CardTitle className="text-xl">
                      {subscription ? getPlanName(subscription.plan_type) : "No Plan"}
                    </CardTitle>
                    <CardDescription>Your current subscription plan</CardDescription>
                  </div>
                </div>
                {subscription && (
                  <Badge className={getStatusColor(subscription.status)}>
                    {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {subscription?.plan_type === "free" && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Free Plan Limitations</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        You can create 1 memorial with up to 10 photos and 5 timeline events. Upgrade for unlimited
                        access.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                {subscription?.plan_type === "free" ? (
                  <Button asChild className="flex-1">
                    <Link href="/pricing">
                      <Crown className="w-4 h-4 mr-2" />
                      Upgrade Plan
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={handleManageBilling}
                      disabled={actionLoading}
                      className="flex-1 bg-transparent"
                      variant="outline"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      {actionLoading ? "Loading..." : "Manage Billing"}
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                    <Button
                      onClick={handleCancelSubscription}
                      disabled={actionLoading}
                      variant="destructive"
                      className="flex-1"
                    >
                      {actionLoading ? "Cancelling..." : "Cancel Subscription"}
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Plan Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Available Plans</CardTitle>
              <CardDescription>Compare features and upgrade your plan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4 bg-rose-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-4 h-4 text-rose-600" />
                    <h4 className="font-semibold">Free</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">£0/forever</p>
                  <ul className="text-sm space-y-1">
                    <li>• 1 memorial page</li>
                    <li>• Up to 10 photos</li>
                    <li>• 5 timeline events</li>
                    <li>• Basic QR codes</li>
                  </ul>
                </div>

                <div className="border rounded-lg p-4 bg-amber-50 ring-2 ring-amber-400">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-amber-600" />
                    <h4 className="font-semibold">Premium</h4>
                    <Badge className="bg-amber-500 text-white text-xs">Popular</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">£99/year</p>
                  <ul className="text-sm space-y-1">
                    <li>• Unlimited memorials</li>
                    <li>• Up to 500 photos each</li>
                    <li>• Unlimited timeline</li>
                    <li>• Video uploads</li>
                    <li>• Premium themes</li>
                  </ul>
                </div>

                <div className="border rounded-lg p-4 bg-slate-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="w-4 h-4 text-slate-600" />
                    <h4 className="font-semibold">Fully Managed</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">£250/memorial</p>
                  <ul className="text-sm space-y-1">
                    <li>• Everything in Premium</li>
                    <li>• Professional creation</li>
                    <li>• Content writing</li>
                    <li>• Photo restoration</li>
                    <li>• Physical QR plaques</li>
                  </ul>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="text-center">
                <Button asChild>
                  <Link href="/pricing">View Full Pricing Details</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Usage Stats */}
          {subscription?.plan_type === "free" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Usage Statistics
                </CardTitle>
                <CardDescription>Your current usage against plan limits</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">1</div>
                    <div className="text-sm text-gray-600">Memorial Created</div>
                    <div className="text-xs text-gray-500 mt-1">1/1 limit</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">7</div>
                    <div className="text-sm text-gray-600">Photos Uploaded</div>
                    <div className="text-xs text-gray-500 mt-1">7/10 limit</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">3</div>
                    <div className="text-sm text-gray-600">Timeline Events</div>
                    <div className="text-xs text-gray-500 mt-1">3/5 limit</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
