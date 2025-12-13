"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Calendar, Loader2, MapPin, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type Memorial = {
  id: string
  full_name: string
  title?: string | null
  slug?: string | null
  profile_image_url?: string | null
  birth_date?: string | null
  death_date?: string | null
  burial_location?: string | null
  created_at?: string | null
}

type MemorialSearchProps = {
  initialResults?: Memorial[]
  limit?: number
  heading?: string
  subheading?: string
}

export function MemorialSearch({ initialResults = [], limit = 12, heading, subheading }: MemorialSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Memorial[]>(initialResults)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  const hasResults = useMemo(() => results.length > 0, [results])

  useEffect(() => {
    // If we have no initial data, fetch a small starter list
    if (!initialResults.length) {
      void handleSearch("")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = async (value: string) => {
    setLoading(true)
    setError(null)
    setHasSearched(Boolean(value.trim()))

    try {
      const params = new URLSearchParams()
      params.set("limit", String(limit))
      if (value.trim()) {
        params.set("search", value.trim())
      }

      const res = await fetch(`/api/memorials?${params.toString()}`, { cache: "no-store" })

      if (!res.ok) {
        throw new Error(`Search failed with status ${res.status}`)
      }

      const data = await res.json()
      setResults(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Memorial search error", err)
      setError("Sorry, we could not fetch memorials just now. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void handleSearch(query)
  }

  const clearSearch = () => {
    setQuery("")
    void handleSearch("")
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">Search</p>
            <h2 className="text-3xl font-serif font-medium text-[#1B3B5F]">
              {heading || "Find a memorial"}
            </h2>
            {subheading && <p className="text-base text-slate-600">{subheading}</p>}
          </div>
          {hasSearched && (
            <Button
              variant="ghost"
              onClick={clearSearch}
              className="text-sm text-slate-700 hover:text-[#1B3B5F] px-3"
            >
              Clear search
            </Button>
          )}
        </div>

        <form onSubmit={submitSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, title, or place"
              aria-label="Search memorials"
              className="pl-10 h-12 text-base border-slate-200 bg-white"
            />
          </div>
          <Button
            type="submit"
            className="h-12 px-6 bg-[#1B3B5F] text-white hover:bg-[#16304d] disabled:opacity-70"
            disabled={loading}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4" aria-hidden />
                Searching
              </span>
            ) : (
              "Search"
            )}
          </Button>
        </form>

        {error && <p className="text-sm text-rose-700 bg-rose-50 border border-rose-100 rounded-lg p-3">{error}</p>}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading && (
          <>
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="h-[280px] rounded-2xl bg-white border border-slate-200 shadow-sm" />
            ))}
          </>
        )}

        {!loading && hasResults && results.map((memorial) => (
          <Card key={memorial.id} className="overflow-hidden border-slate-200 shadow-sm hover:border-[#1B3B5F]/50 transition-colors">
            <div className="relative aspect-[4/3] bg-slate-100">
              {memorial.profile_image_url ? (
                <Image
                  src={memorial.profile_image_url}
                  alt={`${memorial.full_name} memorial photo`}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                  <Search className="h-8 w-8" aria-hidden />
                </div>
              )}
            </div>
            <CardContent className="p-5 space-y-3">
              <Link
                href={memorial.slug ? `/memorial/${memorial.slug}` : `/memorial/${memorial.id}`}
                className="group inline-flex"
              >
                <h3 className="text-xl font-semibold text-slate-900 group-hover:text-[#1B3B5F]">
                  {memorial.full_name}
                </h3>
              </Link>
              {memorial.title && <p className="text-sm text-slate-600 line-clamp-2">{memorial.title}</p>}

              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                {memorial.burial_location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-4 w-4" aria-hidden />
                    {memorial.burial_location}
                  </span>
                )}
                {memorial.birth_date && memorial.death_date && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-4 w-4" aria-hidden />
                    {new Date(memorial.birth_date).getFullYear()} – {new Date(memorial.death_date).getFullYear()}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!loading && !hasResults && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
            <Search className="h-5 w-5" aria-hidden />
          </div>
          <h3 className="text-xl font-semibold text-slate-900">No memorials found</h3>
          <p className="mt-2 text-slate-600">
            Try another name, or clear the search to browse recent memorials.
          </p>
          <div className="mt-4">
            <Button variant="outline" onClick={clearSearch} className="border-slate-200">
              Browse recent memorials
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}






