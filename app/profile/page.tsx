"use client"

import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Heart, CreditCard, User as UserIcon, Calendar, Settings, LogOut, Lock, MailCheck, Mail } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { UserNav } from "@/components/user-nav"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

export default function ProfilePage() {
  const { user, logout, changePassword, sendVerificationEmail } = useAuth()

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="border-b border-border/50 bg-white/80 backdrop-blur-sm sticky top-0 z-50" style={{ paddingTop: "env(safe-area-inset-top)" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-2" aria-label="Go home">
                <Heart className="h-6 w-6 text-primary" aria-hidden />
                <span className="font-serif font-bold text-xl text-foreground">Sandalwood Memories</span>
              </Link>
              <div className="flex items-center gap-3">
                <Link href="/">
                  <Button variant="outline" className="bg-transparent">Back</Button>
                </Link>
              </div>
            </div>
          </div>
        </header>
        <div className="max-w-3xl mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Please sign in to view your profile.</p>
              <div className="mt-4">
                <Link href="/">
                  <Button>Go home</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  const [myCount, setMyCount] = useState<number | null>(null)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/memorials?created_by=${encodeURIComponent(user.id)}&limit=100`)
        const data = await res.json()
        if (!cancelled) setMyCount(Array.isArray(data) ? data.length : 0)
      } catch {
        if (!cancelled) setMyCount(0)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user.id])

  const planLabel = useMemo(() => "Free plan", [])
  const { toast } = useToast()
  const [isPwOpen, setPwOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      toast({ title: "Password too short", description: "Use at least 8 characters." })
      return
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match" })
      return
    }
    const ok = await changePassword(currentPassword, newPassword)
    if (!ok) {
      toast({ title: "Incorrect current password" })
      return
    }
    setPwOpen(false)
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    toast({ title: "Password updated" })
  }

  const handleSendVerification = async () => {
    const link = await sendVerificationEmail()
    toast({ title: "Verification link sent", description: link ? "Copied to clipboard." : undefined })
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
            <div className="hidden md:flex items-center gap-3">
              <Link href="/memorial" className="text-sm text-muted-foreground hover:text-foreground">My memorials</Link>
              <Link href="/create">
                <Button variant="outline" className="bg-transparent">Create memorial</Button>
              </Link>
              <UserNav />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Account Overview */}
            <Card className="border-0 shadow-sm bg-white/90">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-rose-500 to-amber-500 text-white flex items-center justify-center text-lg font-semibold">
                    {initials}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-xl font-semibold text-foreground">{user.name}</h1>
                      <Badge className="bg-emerald-600">{planLabel}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link href="/billing">
                        <Button size="sm" variant="outline" className="bg-transparent inline-flex items-center gap-2">
                          <CreditCard className="h-4 w-4" /> Manage billing
                        </Button>
                      </Link>
                      <Link href="/memorial">
                        <Button size="sm" variant="outline" className="bg-transparent inline-flex items-center gap-2">
                          <Heart className="h-4 w-4" /> My memorials
                        </Button>
                      </Link>
                      <Link href="/create">
                        <Button size="sm" className="inline-flex items-center gap-2">
                          <Heart className="h-4 w-4" /> Create memorial
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preferences & Security */}
            <Card className="border-0 shadow-sm bg-white/90">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" /> Account settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                 <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Email</div>
                     <div className="text-sm text-muted-foreground">{user.email}</div>
                  </div>
                   {!user.emailVerified ? (
                     <Button variant="outline" className="bg-transparent inline-flex items-center gap-2" onClick={handleSendVerification}>
                       <Mail className="h-4 w-4" /> Verify email
                     </Button>
                   ) : (
                     <Button variant="outline" className="bg-transparent inline-flex items-center gap-2" disabled>
                       <MailCheck className="h-4 w-4" /> Verified
                     </Button>
                   )}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Password</div>
                    <div className="text-sm text-muted-foreground">Last changed recently</div>
                  </div>
                   <Dialog open={isPwOpen} onOpenChange={setPwOpen}>
                     <DialogTrigger asChild>
                       <Button variant="outline" className="bg-transparent inline-flex items-center gap-2">
                         <Lock className="h-4 w-4" /> Change
                       </Button>
                     </DialogTrigger>
                     <DialogContent>
                       <DialogHeader>
                         <DialogTitle>Change password</DialogTitle>
                       </DialogHeader>
                       <div className="space-y-3 py-2">
                         <div>
                           <label htmlFor="current_password" className="text-sm">Current password</label>
                           <Input id="current_password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                         </div>
                         <div>
                           <label htmlFor="new_password" className="text-sm">New password</label>
                           <Input id="new_password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                         </div>
                         <div>
                           <label htmlFor="confirm_password" className="text-sm">Confirm new password</label>
                           <Input id="confirm_password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                         </div>
                       </div>
                       <DialogFooter>
                         <Button variant="outline" className="bg-transparent" onClick={() => setPwOpen(false)}>Cancel</Button>
                         <Button onClick={handleChangePassword}>Update password</Button>
                       </DialogFooter>
                     </DialogContent>
                   </Dialog>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Notifications</div>
                    <div className="text-sm text-muted-foreground">Manage email updates</div>
                  </div>
                  <Button variant="outline" className="bg-transparent" disabled>Configure</Button>
                </div>
                <div className="pt-2">
                  <Button variant="secondary" className="inline-flex items-center gap-2" onClick={logout}>
                    <LogOut className="h-4 w-4" /> Sign out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Usage */}
            <Card className="border-0 shadow-sm bg-white/90">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><UserIcon className="h-5 w-5" /> Your usage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Memorials created</span>
                  <span className="font-medium">{myCount ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Plan</span>
                  <span className="font-medium">{planLabel}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Member since</span>
                  <span className="font-medium flex items-center gap-1"><Calendar className="h-4 w-4" /> Recently</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick links */}
            <Card className="border-0 shadow-sm bg-white/90">
              <CardHeader>
                <CardTitle>Quick links</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                <Link href="/memorial" className="text-sm text-rose-700 hover:underline inline-flex items-center gap-2">
                  <Heart className="h-4 w-4" /> View my memorials
                </Link>
                <Link href="/create" className="text-sm text-rose-700 hover:underline inline-flex items-center gap-2">
                  <Heart className="h-4 w-4" /> Create a memorial
                </Link>
                <Link href="/billing" className="text-sm text-rose-700 hover:underline inline-flex items-center gap-2">
                  <CreditCard className="h-4 w-4" /> Billing
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}


