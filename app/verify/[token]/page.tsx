"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"

export default function VerifyEmailPage() {
  const params = useParams<{ token: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const [status, setStatus] = useState<"pending" | "success" | "error">("pending")

  useEffect(() => {
    if (!params?.token) return
    ;(async () => {
      try {
        const res = await fetch(`/api/auth/verify/confirm?token=${encodeURIComponent(params.token)}`)
        const data = await res.json()
        if (res.ok && data.ok) {
          // best-effort local flag where user email matches response email
          // Server marks email verified; refresh user from server in future if needed
          setStatus("success")
        } else {
          setStatus("error")
        }
      } catch {
        setStatus("error")
      }
    })()
  }, [params?.token, user])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Email verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "pending" && <p className="text-sm text-muted-foreground">Verifying your email…</p>}
          {status === "success" && (
            <div className="text-center space-y-2">
              <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
              <p className="text-sm">Your email has been verified successfully.</p>
              <Button onClick={() => router.push("/profile")}>Go to profile</Button>
            </div>
          )}
          {status === "error" && (
            <div className="text-center space-y-2">
              <XCircle className="h-10 w-10 text-rose-600 mx-auto" />
              <p className="text-sm">This verification link is invalid or expired.</p>
              <Link href="/">
                <Button variant="outline" className="bg-transparent">Back home</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


