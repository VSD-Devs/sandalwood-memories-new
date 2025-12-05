"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Heart, Calendar, Eye, Search, Trash2, MoreVertical, Crown, Plus, Zap } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { UserNav } from "@/components/user-nav"
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mb-4">
              <Heart className="h-6 w-6 text-rose-600" />
            </div>
            <CardTitle>Sign in required</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Please sign in to view your memorials.
            </p>
            <div className="flex flex-col gap-2">
              <Link href="/">
                <Button className="w-full">Go to homepage</Button>
              </Link>
              <p className="text-sm text-muted-foreground">
                You can sign in from the homepage
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-border/50 bg-white/80 backdrop-blur-sm sticky top-0 z-50" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/memorial" className="flex items-center gap-2" aria-label="Go to My memorials">
              <Heart className="h-6 w-6 text-primary" aria-hidden />
              <span className="font-serif font-bold text-xl text-foreground">Sandalwood Memories</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/create" className="md:hidden">
                <Button size="sm" className="bg-primary text-primary-foreground">Create</Button>
              </Link>
              <div className="hidden md:flex items-center gap-3">
                <Link href="/create">
                  <Button variant="outline" className="bg-transparent">Create memorial</Button>
                </Link>
                <UserNav />
              </div>
            </div>
          </div>
        </div>
      </header>
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">My memorials</h1>
              {/* Always show usage info for logged in users */}
              {user && (
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <span>
                      {usageData?.usage?.memorialCount || memorials?.length || 0}/{usageData?.planType === "free" || !usageData ? "1" : "∞"} memorials
                    </span>
                    {(!usageData || usageData.planType === "free") && (
                      <Badge variant="secondary" className="text-xs">
                        Free Plan
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowUsageModal(true)}
                    className="text-xs text-slate-500 hover:text-slate-700"
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    View Usage
                  </Button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {user && (!usageData || usageData.planType === "free") && (usageData?.usage?.memorialCount || memorials?.length || 0) >= 1 ? (
                <>
                  <Button
                    variant="outline"
                    disabled
                    className="text-slate-500 hidden md:flex"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Limit Reached
                  </Button>
                  <Link href="/pricing">
                    <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                      <Crown className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Upgrade</span>
                    </Button>
                  </Link>
                </>
              ) : (
                <Link href="/create" className="text-sm text-rose-700 hover:underline md:hidden">
                  Create new
                </Link>
              )}
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="w-full md:max-w-sm relative">
              <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" aria-hidden />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search memorials"
                className="pl-9"
                aria-label="Search memorials"
              />
            </div>
            <div className="flex items-center gap-2">
              {(["all", "active", "pending", "archived"] as const).map((s) => (
                <Button
                  key={s}
                  type="button"
                  variant={statusFilter === s ? "default" : "outline"}
                  className={statusFilter === s ? "" : "bg-transparent"}
                  onClick={() => setStatusFilter(s)}
                  aria-pressed={statusFilter === s}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                  <Badge variant="secondary" className="ml-2">
                    {s === "all" ? statusCounts.all : (statusCounts as any)[s]}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              {loading ? "Loading…" : `${filteredMemorials.length} result${filteredMemorials.length === 1 ? "" : "s"}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="border rounded-lg h-40 bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : filteredMemorials && filteredMemorials.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredMemorials.map((m) => (
                  <div key={m.id} className="border-0 rounded-lg overflow-hidden bg-white/90 shadow-sm">
                    <div className="p-4 flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {m.profile_image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img 
                            src={m.profile_image_url} 
                            alt={`${m.full_name} memorial photo`} 
                            className="w-16 h-16 rounded-full object-cover border-2 border-rose-200 shadow-sm" 
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-rose-100 border-2 border-rose-200 shadow-sm flex items-center justify-center">
                            <Heart className="w-6 h-6 text-rose-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-foreground line-clamp-1">{m.full_name}</div>
                          <Badge
                            variant={m.status === "active" ? "default" : m.status === "pending" ? "secondary" : "outline"}
                            className={`capitalize ${
                              m.status === "active"
                                ? "bg-emerald-600"
                                : m.status === "pending"
                                ? "bg-amber-500"
                                : ""
                            }`}
                          >
                            {m.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground line-clamp-1">{m.title}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" aria-hidden />
                          {new Date(m.created_at).toLocaleDateString()}
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                        <Link
                          href={`/memorial/${m.slug || m.id}`}
                          className="inline-flex items-center gap-1 text-rose-700 hover:underline text-sm"
                        >
                          <Eye className="h-4 w-4" /> View
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/memorial/${m.slug || m.id}`} className="flex items-center">
                                <Eye className="mr-2 h-4 w-4" />
                                View Memorial
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setMemorialToDelete(m)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Memorial
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="mx-auto w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
                  <Heart className="h-6 w-6 text-rose-600" aria-hidden />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-foreground">{memorials && memorials.length === 0 ? "No memorials yet" : "No matches found"}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {memorials && memorials.length === 0
                    ? "Create your first memorial to begin."
                    : "Try adjusting your filters or search."}
                </p>
                <div className="mt-6 flex items-center justify-center gap-3">
                  <Link href="/create">
                    <Button>Create memorial</Button>
                  </Link>
                  {(query || statusFilter !== "all") && (
                    <Button variant="outline" className="bg-transparent" onClick={() => { setQuery(""); setStatusFilter("all") }}>
                      Clear filters
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
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


