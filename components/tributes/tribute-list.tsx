"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MessageSquare, Calendar, User, RefreshCw, Trash2 } from "lucide-react"
import { format } from "date-fns"

interface Tribute {
  id: string
  memorial_id: string
  author_name: string
  author_email?: string
  message: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
}

interface TributeListProps {
  memorialId: string
  isOwner?: boolean
  className?: string
  onTributeDeleted?: (tributeId: string) => void
  tributes?: Tribute[] // Optional prop to pass tributes directly
}

export default function TributeList({ memorialId, isOwner = false, className = "", onTributeDeleted, tributes: externalTributes }: TributeListProps) {
  const [tributes, setTributes] = useState<Tribute[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTributes = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (isOwner) {
        params.set("include_pending", "1")
      }

      const response = await fetch(`/api/memorials/${memorialId}/tributes?${params}`)

      if (!response.ok) {
        throw new Error("Failed to load tributes")
      }

      const data = await response.json()
      setTributes(data)

    } catch (err) {
      console.error("Fetch tributes error:", err)
      setError(err instanceof Error ? err.message : "Failed to load tributes")
    } finally {
      setLoading(false)
    }
  }

  // Use external tributes if provided, otherwise fetch
  useEffect(() => {
    if (externalTributes !== undefined) {
      setTributes(externalTributes)
      setLoading(false)
      setError(null)
    } else {
      fetchTributes()
    }
  }, [memorialId, isOwner, externalTributes])

  const deleteTribute = async (tributeId: string) => {
    try {
      const response = await fetch(`/api/memorials/${memorialId}/tributes?tributeId=${tributeId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (response.ok) {
        setTributes(prev => prev.filter(t => t.id !== tributeId))
        onTributeDeleted?.(tributeId)
      } else {
        console.error('Failed to delete tribute')
      }
    } catch (error) {
      console.error('Failed to delete tribute:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif">
            <MessageSquare className="h-5 w-5 text-rose-600" />
            Tributes & Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading tributes...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif">
            <MessageSquare className="h-5 w-5 text-rose-600" />
            Tributes & Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchTributes} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const approvedTributes = tributes.filter(t => t.status === 'approved')
  const pendingTributes = tributes.filter(t => t.status === 'pending')

  return (
    <Card className={className}>
      <CardHeader className="px-4 md:px-6 pt-4 md:pt-6 pb-3 md:pb-4">
        <CardTitle className="flex items-center gap-2 font-serif text-lg md:text-xl">
          <MessageSquare className="h-4 w-4 md:h-5 md:w-5 text-rose-600" />
          Tributes & Messages
          {approvedTributes.length > 0 && (
            <Badge variant="secondary" className="text-xs">{approvedTributes.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 md:space-y-4 px-4 md:px-6 pb-4 md:pb-6">
        {/* Pending tributes (only visible to owners) */}
        {isOwner && pendingTributes.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-amber-700 border-b border-amber-200 pb-2 text-sm md:text-base">
              Pending Review ({pendingTributes.length})
            </h3>
            {pendingTributes.map((tribute) => (
              <TributeCard key={tribute.id} tribute={tribute} isOwner={isOwner} onDelete={deleteTribute} />
            ))}
          </div>
        )}

        {/* Approved tributes */}
        {approvedTributes.length > 0 ? (
          <div className="space-y-3">
            {isOwner && pendingTributes.length > 0 && (
              <h3 className="font-medium text-green-700 border-b border-green-200 pb-2 text-sm md:text-base">
                Published ({approvedTributes.length})
              </h3>
            )}
            {approvedTributes.map((tribute) => (
              <TributeCard key={tribute.id} tribute={tribute} isOwner={isOwner} onDelete={deleteTribute} />
            ))}
          </div>
        ) : (
          <div className="text-center py-6 md:py-8 text-muted-foreground">
            <MessageSquare className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-3 md:mb-4 opacity-50" />
            <p className="text-sm md:text-base">No tributes have been shared yet.</p>
            <p className="text-xs md:text-sm mt-1">Be the first to leave a message of remembrance.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function TributeCard({ tribute, isOwner, onDelete }: { tribute: Tribute; isOwner: boolean; onDelete?: (id: string) => void }) {
  return (
    <div className="border rounded-lg p-3 md:p-4 bg-white shadow-sm">
      <div className="flex items-start justify-between mb-2 md:mb-3 gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="font-medium text-sm md:text-base truncate">{tribute.author_name}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1 text-xs md:text-sm text-muted-foreground">
            <Calendar className="h-3 w-3 flex-shrink-0" />
            <time dateTime={tribute.created_at} className="whitespace-nowrap">
              {format(new Date(tribute.created_at), "MMM d, yyyy")}
            </time>
          </div>
          {isOwner && onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(tribute.id)}
              className="h-9 w-9 md:h-8 md:w-8 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-50 touch-manipulation"
              aria-label="Delete tribute"
            >
              <Trash2 className="h-4 w-4 md:h-3 md:w-3" />
            </Button>
          )}
        </div>
      </div>
      
      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm md:text-base">
        {tribute.message}
      </p>
    </div>
  )
}

function getStatusColor(status: string) {
  switch (status) {
    case 'approved': return 'bg-green-100 text-green-800 border-green-200'
    case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'rejected': return 'bg-red-100 text-red-800 border-red-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}
