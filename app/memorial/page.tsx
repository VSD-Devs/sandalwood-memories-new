"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Heart, Calendar, Eye, Search, Trash2, MoreVertical, Crown, Plus, Zap, Lock, BookOpen, Shield, Sparkles } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import UsageLimitModal from "@/components/usage-limit-modal"
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"

export default function MemorialListPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [memorials, setMemorials] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "pending" | "archived">("all")
  const [memorialToDelete, setMemorialToDelete] = useState<any | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [usageData, setUsageData] = useState<any>(null)
  const [showUsageModal, setShowUsageModal] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        // Wait for auth to finish loading
        if (authLoading) {
          return
        }

        if (!user) {
          // If no user is logged in, show empty list
          if (!cancelled) {
            setMemorials([])
            setLoading(false)
          }
          return
        }

        // Fetch user's memorials using the new API parameter
        const res = await fetch("/api/memorials?my_memorials=true&limit=50", {
          credentials: 'include' // Ensure cookies are sent
        })
        
        if (!res.ok) {
          if (res.status === 401) {
            // Authentication failed - clear memorials
            if (!cancelled) setMemorials([])
            return
          }
          throw new Error(`HTTP ${res.status}`)
        }

        const data = await res.json()
        const memorials = Array.isArray(data) ? data : []

        if (!cancelled) setMemorials(memorials)

        // Load usage data
        try {
          const usageRes = await fetch("/api/usage", {
            credentials: 'include'
          })
          
          if (usageRes.ok) {
            const usageData = await usageRes.json()
            if (!cancelled) setUsageData(usageData)
          } else {
            console.warn('Failed to load usage data:', usageRes.status)
            // Set default free plan data if API fails
            if (!cancelled) {
              setUsageData({
                planType: "free",
                usage: { memorialCount: memorials?.length || 0 }
              })
            }
          }
        } catch (usageError) {
          console.error('Usage API error:', usageError)
          // Set default free plan data if API fails
          if (!cancelled) {
            setUsageData({
              planType: "free", 
              usage: { memorialCount: memorials?.length || 0 }
            })
          }
        }
      } catch (error) {
        console.error("Failed to fetch memorials:", error)
        if (!cancelled) setMemorials([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user, authLoading])

  const statusCounts = useMemo(() => {
    const base = { all: memorials?.length || 0, active: 0, pending: 0, archived: 0 }
    ;(memorials || []).forEach((m) => {
      const s = String(m.status || "").toLowerCase()
      if (s === "active" || s === "pending" || s === "archived") (base as any)[s] += 1
    })
    return base
  }, [memorials])

  const filteredMemorials = useMemo(() => {
    let list = memorials || []
    if (statusFilter !== "all") {
      list = list.filter((m) => String(m.status || "").toLowerCase() === statusFilter)
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter((m) =>
        String(m.full_name || "").toLowerCase().includes(q) || String(m.title || "").toLowerCase().includes(q),
      )
    }
    return list
  }, [memorials, statusFilter, query])

  const handleDeleteMemorial = async () => {
    if (!memorialToDelete || !user) return
    
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/memorials/${memorialToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete memorial')
      }
      
      // Remove the memorial from the list
      setMemorials(prev => prev ? prev.filter(m => m.id !== memorialToDelete.id) : [])
      setMemorialToDelete(null)
    } catch (error) {
      console.error('Delete memorial error:', error)
      // You could show a toast notification here for better UX
      alert('Failed to delete memorial. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  // Show authentication prompt for non-logged in users
  if (!authLoading && !user) {
    return (
      <div className="relative min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900">
        <div
          className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_15%_18%,rgba(15,60,93,0.08),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(244,114,182,0.1),transparent_32%),radial-gradient(circle_at_55%_70%,rgba(14,165,233,0.08),transparent_30%)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-6 py-16 lg:py-20">
          <div className="grid gap-12 lg:grid-cols-[1.05fr,0.95fr] lg:items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#0f3c5d]/5 px-3 py-1 text-sm font-semibold text-[#0f3c5d] ring-1 ring-[#0f3c5d]/15">
                <Shield className="h-4 w-4 text-[#0f3c5d]" aria-hidden />
                <span>Private by invitation</span>
              </div>

              <div className="space-y-4">
                <h1 className="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
                  A calm space for every memory.
                </h1>
                <p className="max-w-2xl text-base text-slate-700 sm:text-lg">
                  Sign in to see the memorials you care for. We keep every page organised, private, and easy to read with accessible colours.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/auth?mode=signin">
                  <Button className="bg-[#0f3c5d] text-white shadow-md hover:bg-[#0c304c]">
                    Sign in securely
                  </Button>
                </Link>
                <Link href="/auth?mode=signup">
                  <Button
                    variant="outline"
                    className="border-[#0f3c5d]/30 text-[#0f3c5d] hover:border-[#0f3c5d]/50 hover:bg-[#0f3c5d]/5"
                  >
                    Create a memorial space
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="ghost" className="text-slate-700 hover:bg-slate-100">
                    Return home
                  </Button>
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-start gap-3 rounded-xl bg-white/70 p-4 ring-1 ring-slate-200">
                  <Lock className="mt-1 h-5 w-5 text-[#0f3c5d]" aria-hidden />
                  <div className="space-y-1">
                    <p className="font-medium text-slate-900">Invite-only privacy</p>
                    <p className="text-sm text-slate-700">
                      Each memorial is visible only to the people you choose.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl bg-white/70 p-4 ring-1 ring-slate-200">
                  <BookOpen className="mt-1 h-5 w-5 text-[#0f3c5d]" aria-hidden />
                  <div className="space-y-1">
                    <p className="font-medium text-slate-900">Organised stories</p>
                    <p className="text-sm text-slate-700">
                      Timelines, tributes, and photos stay tidy and easy to follow.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl bg-white/70 p-4 ring-1 ring-slate-200 sm:col-span-2">
                  <Sparkles className="mt-1 h-5 w-5 text-[#0f3c5d]" aria-hidden />
                  <div className="space-y-1">
                    <p className="font-medium text-slate-900">Gentle, accessible palette</p>
                    <p className="text-sm text-slate-700">
                      High-contrast colours and calm typography for late-night reading.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Card className="relative border border-slate-200 bg-white/90 text-slate-900 shadow-2xl backdrop-blur">
              <CardHeader className="space-y-2 pb-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#0f3c5d]">Preview</p>
                <CardTitle className="text-2xl font-semibold text-slate-900">See what you are coming back to</CardTitle>
                <p className="text-sm text-slate-600">
                  A secure view of your memorial pages, without adverts or noise.
                </p>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="relative overflow-hidden rounded-xl ring-1 ring-slate-200">
                  <div className="relative h-52 w-full">
                    <Image
                      src="/flower-bay.jpg"
                      alt="Sample memorial backdrop with flowers"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority
                    />
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-slate-900/75 via-slate-900/30 to-transparent"
                      aria-hidden
                    />
                    <div className="absolute bottom-0 w-full space-y-1 p-4">
                      <p className="text-sm text-slate-100/90">Private memorial</p>
                      <p className="text-lg font-semibold text-white">Amelia Rhodes</p>
                      <p className="text-sm text-slate-100/85">Always shared a laugh in the garden.</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="mt-1 h-5 w-5 text-[#0f3c5d]" aria-hidden />
                    <div className="space-y-1">
                      <p className="font-medium text-slate-900">Timeline stays intact</p>
                      <p className="text-sm text-slate-700">
                        Dates, tributes, and media stay ordered for every visit.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Heart className="mt-1 h-5 w-5 text-[#0f3c5d]" aria-hidden />
                    <div className="space-y-1">
                      <p className="font-medium text-slate-900">Respectful contributions</p>
                      <p className="text-sm text-slate-700">
                        Only invited guests can add stories or photos.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Eye className="mt-1 h-5 w-5 text-[#0f3c5d]" aria-hidden />
                    <div className="space-y-1">
                      <p className="font-medium text-slate-900">No distractions</p>
                      <p className="text-sm text-slate-700">
                        Clean, readable layouts with contrast that works for everyone.
                      </p>
                    </div>
                  </div>
                </div>

                <Link href="/auth?mode=signin" className="block">
                  <Button className="w-full bg-[#0f3c5d] text-white hover:bg-[#0c304c]">
                    Sign in to view memorials
                  </Button>
                </Link>
                <p className="text-center text-xs text-slate-600">
                  New here?{" "}
                  <Link href="/create" className="font-semibold text-[#0f3c5d] underline-offset-4 hover:underline">
                    Start a memorial space
                  </Link>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-12 sm:px-8 lg:px-12">
        {/* Header Section */}
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8">
            <div>
              <h1 className="text-4xl sm:text-5xl font-semibold text-slate-900 mb-2">My Memorials</h1>
              {user && (
                <p className="text-lg text-slate-600">
                  {filteredMemorials.length === 0 
                    ? "No memorials yet"
                    : `${filteredMemorials.length} memorial${filteredMemorials.length === 1 ? "" : "s"}`}
                  {usageData && (
                    <span className="ml-2 text-base text-slate-500">
                      ({usageData?.usage?.memorialCount || memorials?.length || 0}/{usageData?.planType === "free" || !usageData ? "1" : "∞"})
                    </span>
                  )}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {user && (
                <Button
                  variant="ghost"
                  onClick={() => setShowUsageModal(true)}
                  className="text-base text-slate-600 hover:text-slate-900"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Usage
                </Button>
              )}
              {user && (!usageData || usageData.planType === "free") && (usageData?.usage?.memorialCount || memorials?.length || 0) >= 1 ? (
                <Link href="/pricing">
                  <Button className="bg-[#0f3c5d] hover:bg-[#0c304c] text-white h-11 px-6">
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade
                  </Button>
                </Link>
              ) : (
                <Link href="/create">
                  <Button className="bg-[#0f3c5d] hover:bg-[#0c304c] text-white h-11 px-6">
                    <Plus className="h-5 w-5 mr-2" />
                    Create Memorial
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="h-5 w-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" aria-hidden />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search memorials..."
                className="pl-12 h-12 text-base border-slate-200"
                aria-label="Search memorials"
              />
            </div>
            <div className="flex items-center gap-2">
              {(["all", "active", "pending", "archived"] as const).map((s) => (
                <Button
                  key={s}
                  type="button"
                  variant={statusFilter === s ? "default" : "outline"}
                  className={`h-12 px-4 text-base ${
                    statusFilter === s 
                      ? "bg-[#0f3c5d] text-white hover:bg-[#0c304c]" 
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                  onClick={() => setStatusFilter(s)}
                  aria-pressed={statusFilter === s}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Memorials Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl h-80 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Existing Memorials */}
            {filteredMemorials && filteredMemorials.map((m) => (
              <div
                key={m.id}
                className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col"
              >
                <Link
                  href={`/memorial/${m.slug || m.id}`}
                  className="flex-1 flex flex-col"
                >
                  {/* Image Section */}
                  <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                    {m.profile_image_url ? (
                      <Image
                        src={m.profile_image_url}
                        alt={`${m.full_name} memorial photo`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                        <Heart className="h-16 w-16 text-slate-400" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                      <Badge
                        className={`capitalize text-sm font-medium ${
                          m.status === "active"
                            ? "bg-emerald-600 text-white"
                            : m.status === "pending"
                            ? "bg-amber-500 text-white"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {m.status}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem asChild>
                            <Link href={`/memorial/${m.slug || m.id}`} className="flex items-center">
                              <Eye className="mr-2 h-4 w-4" />
                              View Memorial
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setMemorialToDelete(m)
                            }}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Memorial
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-semibold text-slate-900 mb-1 line-clamp-1">
                      {m.full_name}
                    </h3>
                    {m.title && (
                      <p className="text-base text-slate-600 mb-4 line-clamp-2">
                        {m.title}
                      </p>
                    )}
                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Calendar className="h-4 w-4" aria-hidden />
                        <span>{new Date(m.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#0f3c5d] group-hover:underline">
                          View
                        </span>
                        <Eye className="h-4 w-4 text-[#0f3c5d]" aria-hidden />
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}

            {/* Placeholder Squares */}
            {(() => {
              // Use actual memorial count, not filtered count, for determining placeholders
              const actualMemorialCount = memorials?.length || 0
              const planType = usageData?.planType || "free"
              const isPremium = planType !== "free"
              const maxMemorials = planType === "free" ? 1 : -1
              const isLocked = !isPremium && actualMemorialCount >= maxMemorials
              // Show 2 placeholders if locked (to show upgrade opportunity), otherwise show available slots
              const placeholderCount = isPremium ? 2 : (isLocked ? 2 : Math.max(0, maxMemorials - actualMemorialCount))

              if (placeholderCount === 0) return null

              return Array.from({ length: placeholderCount }).map((_, i) => (
                <div
                  key={`placeholder-${i}`}
                  className={`relative bg-white rounded-xl overflow-hidden shadow-sm h-full flex flex-col ${
                    isLocked 
                      ? "border-2 border-dashed border-slate-300 opacity-75" 
                      : "border border-slate-200 hover:shadow-md transition-all duration-300"
                  }`}
                >
                  {isLocked ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                      {/* Lock Icon */}
                      <div className="mb-4 w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                        <Lock className="h-8 w-8 text-slate-400" />
                      </div>
                      
                      {/* Locked Message */}
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        Memorial Locked
                      </h3>
                      <p className="text-sm text-slate-600 mb-6 max-w-xs">
                        Free plan allows 1 memorial. Upgrade to Premium for unlimited memorials.
                      </p>
                      
                      {/* CTA Button */}
                      <Link href="/pricing" className="w-full">
                        <Button className="w-full bg-[#0f3c5d] hover:bg-[#0c304c] text-white">
                          <Crown className="h-4 w-4 mr-2" />
                          Upgrade to Unlock
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <Link
                      href="/create"
                      className="flex-1 flex flex-col items-center justify-center p-6 text-center group"
                    >
                      {/* Plus Icon */}
                      <div className="mb-4 w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                        <Plus className="h-8 w-8 text-slate-400 group-hover:text-slate-600" />
                      </div>
                      
                      {/* Create Message */}
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        Create New Memorial
                      </h3>
                      <p className="text-sm text-slate-600">
                        Start honouring another memory
                      </p>
                    </Link>
                  )}
                </div>
              ))
            })()}
          </div>
        )}

        {/* Empty State - Only show when no memorials exist and no placeholders should be shown */}
        {!loading && (!memorials || memorials.length === 0) && (() => {
          const actualMemorialCount = memorials?.length || 0
          const planType = usageData?.planType || "free"
          const isPremium = planType !== "free"
          const maxMemorials = planType === "free" ? 1 : -1
          const isLocked = !isPremium && actualMemorialCount >= maxMemorials
          const placeholderCount = isPremium ? 2 : (isLocked ? 2 : Math.max(0, maxMemorials - actualMemorialCount))
          return placeholderCount === 0
        })() && (
          <div className="text-center py-20">
            <div className="mx-auto w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-6">
              <Heart className="h-8 w-8 text-slate-400" aria-hidden />
            </div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">
              No memorials yet
            </h2>
            <p className="text-lg text-slate-600 mb-8">
              Create your first memorial to begin honouring memories.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/create">
                <Button className="bg-[#0f3c5d] hover:bg-[#0c304c] text-white h-12 px-8 text-base">
                  <Plus className="h-5 w-5 mr-2" />
                  Create Memorial
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* No matches found state - when filters hide all memorials */}
        {!loading && filteredMemorials && filteredMemorials.length === 0 && memorials && memorials.length > 0 && (
          <div className="text-center py-20">
            <div className="mx-auto w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-6">
              <Search className="h-8 w-8 text-slate-400" aria-hidden />
            </div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">
              No matches found
            </h2>
            <p className="text-lg text-slate-600 mb-8">
              Try adjusting your filters or search terms.
            </p>
            <div className="flex items-center justify-center gap-4">
              {(query || statusFilter !== "all") && (
                <Button 
                  variant="outline" 
                  className="h-12 px-8 text-base border-slate-200"
                  onClick={() => { setQuery(""); setStatusFilter("all") }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!memorialToDelete} onOpenChange={() => setMemorialToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Memorial</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the memorial for <strong>{memorialToDelete?.full_name}</strong>? 
              This action cannot be undone and will permanently remove all associated photos, videos, timeline events, and tributes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMemorial}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete Memorial"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Usage Modal */}
      <UsageLimitModal
        isOpen={showUsageModal}
        onClose={() => setShowUsageModal(false)}
        title="Usage Overview"
      />
    </div>
  )
}


