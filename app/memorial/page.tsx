"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Heart, Calendar, Eye, Search } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { UserNav } from "@/components/user-nav"

export default function MemorialListPage() {
  const { user } = useAuth()
  const [memorials, setMemorials] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "pending" | "archived">("all")

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const url = user ? `/api/memorials?created_by=${encodeURIComponent(user.id)}&limit=50` : "/api/memorials?limit=24"
        const res = await fetch(url)
        const data = await res.json()

        // Fallback: include any locally stored memorial IDs created in this browser (for local/dev without DB linkage)
        let merged = Array.isArray(data) ? data : []
        try {
          const raw = localStorage.getItem("my-memorial-ids") || "[]"
          const localIds: string[] = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : []
          const missing = localIds.filter((id) => !merged.some((m: any) => m.id === id))
          if (missing.length > 0) {
            const fetched = await Promise.all(
              missing.map(async (id) => {
                try {
                  const r = await fetch(`/api/memorials/${id}`)
                  if (!r.ok) return null
                  return await r.json()
                } catch {
                  return null
                }
              }),
            )
            const extras = fetched.filter(Boolean)
            merged = [...extras, ...merged]
          }
        } catch {}

        if (!cancelled) setMemorials(merged)
      } catch {
        if (!cancelled) setMemorials([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user])

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
            <h1 className="text-2xl font-semibold">My memorials</h1>
            <Link href="/create" className="text-sm text-rose-700 hover:underline md:hidden">
              Create new
            </Link>
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
                    {m.cover_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.cover_image_url} alt="Cover" className="h-28 w-full object-cover" />
                    ) : (
                      <div className="h-28 w-full bg-rose-50" />
                    )}
                    <div className="p-4">
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
                      <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <Calendar className="h-3 w-3" aria-hidden />
                        {new Date(m.created_at).toLocaleDateString()}
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <Link
                          href={`/memorial/${m.id}`}
                          className="inline-flex items-center gap-1 text-rose-700 hover:underline text-sm"
                        >
                          <Eye className="h-4 w-4" /> View
                        </Link>
                        <div className="text-xs text-muted-foreground">ID: {m.id.slice(0, 6)}…</div>
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
    </div>
  )
}


