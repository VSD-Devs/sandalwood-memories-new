"use client"

import { format } from "date-fns"
import { Lock, Users, ShieldCheck, Eye, EyeOff, Loader2, Ban } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"

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

interface AccessRequest {
  id: string
  requester_name?: string | null
  requester_email?: string | null
  message?: string | null
  status: "pending" | "approved" | "declined"
  created_at: string
  updated_at?: string | null
}

interface MemorialPrivacyPanelProps {
  memorial: Memorial
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  accessRequests: AccessRequest[]
  loadingRequests: boolean
  onRefreshRequests: () => void
  onPrivacyToggle: (isPublic: boolean) => Promise<void>
  onAccessDecision: (requestId: string, status: "approved" | "declined") => Promise<void>
}

export default function MemorialPrivacyPanel({
  memorial,
  isOpen,
  onOpenChange,
  accessRequests,
  loadingRequests,
  onRefreshRequests,
  onPrivacyToggle,
  onAccessDecision
}: MemorialPrivacyPanelProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl border-l border-slate-200 bg-white/95 text-slate-900 backdrop-blur-md overflow-y-auto"
      >
        <SheetHeader className="px-1 pb-3">
          <div className="flex items-center gap-3 mb-1">
            {memorial.is_public !== false ? (
              <div className="p-2 rounded-xl bg-emerald-100/80">
                <Eye className="h-5 w-5 text-emerald-700" />
              </div>
            ) : (
              <div className="p-2 rounded-xl bg-slate-100">
                <EyeOff className="h-5 w-5 text-slate-700" />
              </div>
            )}
            <div>
              <SheetTitle className="font-serif text-xl text-slate-900">Privacy & Access</SheetTitle>
              <SheetDescription className="text-slate-600 mt-0.5 text-sm">
                Control who can see this memorial and manage viewing requests
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-4 pb-4 pr-1">
          {/* Visibility Settings */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
              <Lock className="h-4 w-4 text-slate-600" />
              <h3 className="font-semibold text-slate-900 text-sm">Visibility Settings</h3>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {memorial.is_public !== false ? (
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Lock className="h-4 w-4 text-slate-700" />
                    )}
                    <span className="font-medium text-slate-900">
                      {memorial.is_public !== false ? "Public memorial" : "Private memorial"}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">
                    {memorial.is_public !== false
                      ? "Appears in search results and can be shared freely"
                      : "Hidden from search, requires owner approval to view"
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <EyeOff className="h-4 w-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">Private</span>
                </div>
                <Switch
                  checked={memorial.is_public !== false}
                  onCheckedChange={onPrivacyToggle}
                  aria-label="Toggle memorial visibility"
                />
                <div className="flex items-center gap-3">
                  <Eye className="h-4 w-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">Public</span>
                </div>
              </div>
            </div>
          </div>

          {/* Access Requests */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-600" />
                <h3 className="font-semibold text-slate-900">Access Requests</h3>
                {accessRequests.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {accessRequests.length}
                  </Badge>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onRefreshRequests}
                className="text-slate-700 hover:text-slate-900"
              >
                <Loader2 className={`h-3 w-3 mr-1.5 ${loadingRequests ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {loadingRequests ? (
              <div className="flex items-center justify-center py-6">
                <div className="flex items-center gap-3 text-slate-600">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Loading requests...</span>
                </div>
              </div>
            ) : accessRequests.length > 0 ? (
              <div className="space-y-3">
                {accessRequests.map((req) => (
                  <div
                    key={req.id}
                    className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900">{req.requester_name || "Anonymous Guest"}</p>
                          <Badge
                            variant="outline"
                            className={
                              req.status === "approved"
                                ? "border-emerald-200 text-emerald-700 bg-emerald-50"
                                : req.status === "declined"
                                  ? "border-red-200 text-red-700 bg-red-50"
                                  : "border-amber-200 text-amber-700 bg-amber-50"
                            }
                          >
                            {req.status === "pending" ? "Pending" : req.status === "approved" ? "Approved" : "Declined"}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600">{req.requester_email || "No email provided"}</p>
                        <p className="text-xs text-slate-500">
                          Requested {format(new Date(req.created_at), "d MMM yyyy 'at' h:mm a")}
                        </p>
                        {req.message && (
                          <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                            <p className="text-sm text-slate-700 italic">"{req.message}"</p>
                          </div>
                        )}
                      </div>
                      {req.status === "pending" && (
                        <div className="flex flex-col gap-1.5 sm:flex-row sm:self-start">
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => onAccessDecision(req.id, "approved")}
                          >
                            <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-200 text-red-700 hover:bg-red-50"
                            onClick={() => onAccessDecision(req.id, "declined")}
                          >
                            <Ban className="h-3.5 w-3.5 mr-1.5" />
                            Decline
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Users className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-600 font-medium text-sm">No access requests</p>
                <p className="text-xs text-slate-500 mt-0.5">Requests from family and friends will appear here</p>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}