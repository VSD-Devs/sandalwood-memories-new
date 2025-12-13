"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { ShieldAlert, Mail } from "lucide-react"

export default function VerifyBanner() {
  const { user, sendVerificationEmail } = useAuth()
  const { toast } = useToast()
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    setHidden(false)
  }, [user?.email])

  if (!user || user.emailVerified || hidden) return null

  const handleResend = async () => {
    const link = await sendVerificationEmail()
    toast({
      title: link ? "Verification link ready" : "Verification email sent",
      description: link
        ? "We’ve copied your verification link and emailed it to you."
        : "Please check your inbox for the verification email.",
    })
  }

  return (
    <div className="w-full border-b border-amber-300 bg-amber-50 text-amber-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-3" role="status" aria-live="polite">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5" aria-hidden />
          <span className="text-sm">Verify your email to secure your account.</span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="bg-white text-amber-900 border-amber-300" onClick={handleResend}>
            <Mail className="h-4 w-4 mr-1" /> Resend link
          </Button>
          <Button size="sm" variant="ghost" className="text-amber-900" onClick={() => setHidden(true)} aria-label="Hide verification reminder">
            Hide for now
          </Button>
        </div>
      </div>
    </div>
  )
}


