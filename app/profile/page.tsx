"use client"

import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Heart, CreditCard, User as UserIcon, Calendar, Settings, LogOut, Lock, MailCheck, Mail } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

export default function ProfilePage() {
  const { user, logout, changePassword, changeEmail, sendVerificationEmail } = useAuth()

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
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
  const [isEmailOpen, setEmailOpen] = useState(false)
  const [newEmail, setNewEmail] = useState(user.email)
  const [emailPassword, setEmailPassword] = useState("")
  const [isEmailSaving, setIsEmailSaving] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const handleChangeEmail = async () => {
    const trimmedEmail = newEmail.trim().toLowerCase()
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      toast({ title: "Please enter a valid email address." })
      return
    }
    if (emailPassword.length < 8) {
      toast({ title: "Password required", description: "Add your current password to confirm the change." })
      return
    }

    setIsEmailSaving(true)
    const result = await changeEmail(emailPassword, trimmedEmail)
    setIsEmailSaving(false)

    if (!result.ok) {
      toast({ title: result.error || "Could not update email" })
      return
    }

    setEmailOpen(false)
    setEmailPassword("")
    toast({
      title: "Email updated",
      description: result.verifyLink
        ? "We have sent a fresh verification link to your new address."
        : "Your sign-in email has been refreshed.",
    })

    if (result.verifyLink && typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(result.verifyLink)
      } catch {
        // Clipboard access can be blocked; ignore
      }
    }
  }

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
                 <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="font-medium">Email</div>
                     <div className="text-sm text-muted-foreground break-all">{user.email}</div>
                     {!user.emailVerified && (
                       <p className="text-xs text-amber-700 mt-1">Please verify your address to keep your account secure.</p>
                     )}
                  </div>
                   <div className="flex flex-wrap gap-2">
                     <Dialog
                       open={isEmailOpen}
                       onOpenChange={(next) => {
                         setEmailOpen(next)
                         if (next) {
                           setNewEmail(user.email)
                           setEmailPassword("")
                         }
                       }}
                     >
                       <DialogTrigger asChild>
                         <Button variant="outline" className="bg-transparent inline-flex items-center gap-2">
                           <Mail className="h-4 w-4" /> Update email
                         </Button>
                       </DialogTrigger>
                       <DialogContent>
                         <DialogHeader>
                           <DialogTitle>Update email address</DialogTitle>
                         </DialogHeader>
                         <div className="space-y-3 py-2">
                           <div>
                             <label htmlFor="new_email" className="text-sm">New email</label>
                             <Input id="new_email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                           </div>
                           <div>
                             <label htmlFor="email_password" className="text-sm">Current password</label>
                             <Input id="email_password" type="password" value={emailPassword} onChange={(e) => setEmailPassword(e.target.value)} />
                             <p className="text-xs text-muted-foreground mt-1">We use this to confirm it is really you.</p>
                           </div>
                           <p className="text-xs text-muted-foreground">We will send a fresh verification link to your new address.</p>
                         </div>
                         <DialogFooter>
                           <Button variant="outline" className="bg-transparent" onClick={() => setEmailOpen(false)}>Cancel</Button>
                           <Button onClick={handleChangeEmail} disabled={isEmailSaving}>{isEmailSaving ? "Updating..." : "Update email"}</Button>
                         </DialogFooter>
                       </DialogContent>
                     </Dialog>
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


