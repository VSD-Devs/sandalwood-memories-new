"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { Mail, UserPlus, Users, Shield, Crown } from "lucide-react"

interface InvitationModalProps {
  isOpen: boolean
  onClose: () => void
  memorialId: string
  memorialName: string
}

export function InvitationModal({ isOpen, onClose, memorialId, memorialName }: InvitationModalProps) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"contributor" | "moderator" | "admin">("contributor")
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const roleOptions = [
    {
      value: "contributor" as const,
      label: "Contributor",
      description: "Can add photos, videos, and timeline events",
      icon: Users,
      color: "bg-blue-500",
    },
    {
      value: "moderator" as const,
      label: "Moderator",
      description: "Can manage content and approve contributions",
      icon: Shield,
      color: "bg-amber-500",
    },
    {
      value: "admin" as const,
      label: "Administrator",
      description: "Full access to manage the memorial",
      icon: Crown,
      color: "bg-rose-500",
    },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memorial_id: memorialId,
          email,
          role,
          message: message || `You've been invited to contribute to ${memorialName}'s memorial page.`,
        }),
      })

      if (response.ok) {
        toast({
          title: "Invitation Sent",
          description: `An invitation has been sent to ${email}`,
        })
        setEmail("")
        setMessage("")
        onClose()
      } else {
        throw new Error("Failed to send invitation")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send invitation. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-rose-600" />
            Invite Collaborator
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Role & Permissions</Label>
            {roleOptions.map((option) => {
              const Icon = option.icon
              return (
                <div
                  key={option.value}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    role === option.value ? "border-rose-500 bg-rose-50" : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setRole(option.value)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${option.color} text-white`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{option.label}</div>
                      <div className="text-sm text-gray-600">{option.description}</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Personal Message (Optional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`You've been invited to contribute to ${memorialName}'s memorial page. Your memories and photos would mean so much to our family.`}
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1 bg-rose-600 hover:bg-rose-700">
              {isLoading ? "Sending..." : "Send Invitation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
