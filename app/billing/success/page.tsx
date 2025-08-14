"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function BillingSuccessPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    if (sessionId) {
      // In a real app, you'd verify the session with your backend
      setSession({
        plan: "Premium", // This would come from your API
        amount: "£99",
      })
      setLoading(false)
    }
  }, [sessionId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-rose-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-serif">Payment Successful!</CardTitle>
          <CardDescription>
            Thank you for upgrading to {session?.plan}. Your subscription is now active.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">Plan:</span>
              <span>{session?.plan}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="font-medium">Amount:</span>
              <span>{session?.amount}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button asChild className="w-full">
              <Link href="/create">
                Create Your First Memorial <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full bg-transparent">
              <Link href="/billing">Manage Subscription</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
