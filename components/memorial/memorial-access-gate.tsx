"use client"

import { useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { Lock, Clock, Ban, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

interface AccessRequest {
  id: string
  requester_name?: string | null
  requester_email?: string | null
  message?: string | null
  status: "pending" | "approved" | "declined"
  created_at: string
  updated_at?: string | null
}

interface MemorialAccessGateProps {
  locked: boolean
  memorialId?: string
  accessStatus?: string
  requestStatus?: "pending" | "approved" | "declined" | null
  message?: string
  onRequestAccess: (formData: { name: string; email: string; message: string }) => Promise<void>
  user?: { name?: string; email?: string } | null
}

export default function MemorialAccessGate({
  locked,
  memorialId,
  accessStatus,
  requestStatus,
  message,
  onRequestAccess,
  user
}: MemorialAccessGateProps) {
  const [requestForm, setRequestForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    message: ""
  })
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false)

  const submitAccessRequest = async () => {
    if (!requestForm.name.trim() || !requestForm.email.trim()) {
      // Error handling would be done by parent component
      return
    }

    setIsSubmittingRequest(true)
    try {
      await onRequestAccess({
        name: requestForm.name.trim(),
        email: requestForm.email.trim(),
        message: requestForm.message.trim() || undefined
      })
    } finally {
      setIsSubmittingRequest(false)
    }
  }

  if (!locked) return null

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5f7fb] to-white flex items-center justify-center px-4">
      <div className="max-w-2xl w-full rounded-3xl border border-slate-200 bg-white/90 shadow-xl p-8 md:p-10 space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
            <Lock className="h-6 w-6 text-[#1B3B5F]" aria-hidden />
          </div>
          <div className="space-y-1">
            <h1 className="font-serif text-3xl text-slate-900">This memorial is private</h1>
            <p className="text-slate-600 text-base">
              Request access from the memorial owner to view their stories and gallery.
            </p>
            {message && (
              <p className="text-sm text-slate-500">{message}</p>
            )}
          </div>
        </div>

        {requestStatus === "pending" && (
          <div className="rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3 flex items-start gap-3">
            <Clock className="h-5 w-5 text-[#1B3B5F]" aria-hidden />
            <div>
              <p className="font-semibold text-slate-900">Request sent</p>
              <p className="text-sm text-slate-600">We will let you know as soon as the owner approves.</p>
            </div>
          </div>
        )}

        {requestStatus === "declined" && (
          <div className="rounded-2xl border border-red-100 bg-red-50/70 px-4 py-3 flex items-start gap-3">
            <Ban className="h-5 w-5 text-red-600" aria-hidden />
            <div>
              <p className="font-semibold text-slate-900">Access declined</p>
              <p className="text-sm text-slate-600">You can try again with a short note to the owner.</p>
            </div>
          </div>
        )}

        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="access-name" className="text-base font-semibold">Your name</Label>
              <Input
                id="access-name"
                value={requestForm.name}
                onChange={(e) => setRequestForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="How should we address you?"
                className="h-12 text-base"
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="access-email" className="text-base font-semibold">Email</Label>
              <Input
                id="access-email"
                type="email"
                value={requestForm.email}
                onChange={(e) => setRequestForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="you@example.com"
                className="h-12 text-base"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="access-message" className="text-base font-semibold">Message to the owner</Label>
            <Textarea
              id="access-message"
              value={requestForm.message}
              onChange={(e) => setRequestForm((prev) => ({ ...prev, message: e.target.value }))}
              placeholder="Add a short note so they recognise you (optional)."
              rows={4}
              className="text-base"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">We only share these details with the memorial owner.</p>
            <Button
              size="lg"
              className="bg-[#1B3B5F] hover:bg-[#16304d] text-white h-12 px-6 text-base"
              onClick={submitAccessRequest}
              disabled={isSubmittingRequest || requestStatus === "pending"}
            >
              {isSubmittingRequest ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Sending…
                </>
              ) : (
                <>
                  <ShieldCheck className="h-5 w-5 mr-2" />
                  Request access
                </>
              )}
            </Button>
          </div>
        </div>

        {!user && (
          <p className="text-sm text-slate-500">
            Have an account already?{" "}
            <Link href="/auth?mode=signin" className="text-[#1B3B5F] font-semibold underline-offset-4 hover:underline">
              Sign in
            </Link>{" "}
            for quicker approval.
          </p>
        )}
      </div>
    </div>
  )
}