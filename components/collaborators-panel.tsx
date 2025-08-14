"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { InvitationModal } from "./invitation-modal"
import { toast } from "@/hooks/use-toast"
import { UserPlus, Users, Shield, Crown, Mail, Clock, MoreHorizontal, Trash2, Settings } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Invitation {
  id: string
  email: string
  role: string
  status: string
  created_at: string
  inviter_name?: string
}

interface Collaborator {
  id: string
  user_name: string
  user_email: string
  role: string
  joined_at: string
}

interface CollaboratorsPanelProps {
  memorialId: string
  memorialName: string
  isOwner: boolean
}

export function CollaboratorsPanel({ memorialId, memorialName, isOwner }: CollaboratorsPanelProps) {
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = async () => {
    try {
      const [invitationsRes, collaboratorsRes] = await Promise.all([
        fetch(`/api/invitations?memorial_id=${memorialId}`),
        fetch(`/api/collaborators?memorial_id=${memorialId}`),
      ])

      if (invitationsRes.ok) {
        const invitationsData = await invitationsRes.json()
        setInvitations(invitationsData)
      }

      if (collaboratorsRes.ok) {
        const collaboratorsData = await collaboratorsRes.json()
        setCollaborators(collaboratorsData)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [memorialId])

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Crown className="h-4 w-4 text-rose-600" />
      case "moderator":
        return <Shield className="h-4 w-4 text-amber-600" />
      default:
        return <Users className="h-4 w-4 text-blue-600" />
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-rose-500 hover:bg-rose-600">Administrator</Badge>
      case "moderator":
        return <Badge className="bg-amber-500 hover:bg-amber-600">Moderator</Badge>
      default:
        return <Badge className="bg-blue-500 hover:bg-blue-600">Contributor</Badge>
    }
  }

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    try {
      const response = await fetch(`/api/collaborators/${collaboratorId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Collaborator Removed",
          description: "The collaborator has been removed from this memorial.",
        })
        fetchData()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove collaborator.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-2">
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Collaborators ({collaborators.length})
            </CardTitle>
            {isOwner && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowInviteModal(true)}
                className="bg-white/20 hover:bg-white/30 text-white border-0"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Invite
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {collaborators.map((collaborator) => (
              <div
                key={collaborator.id}
                className="flex items-center justify-between p-4 border border-blue-100 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${collaborator.user_name}`} />
                    <AvatarFallback>{collaborator.user_name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-gray-900">{collaborator.user_name}</div>
                    <div className="text-sm text-gray-600">{collaborator.user_email}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Joined {new Date(collaborator.joined_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getRoleBadge(collaborator.role)}
                  {isOwner && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="hover:bg-blue-100">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Settings className="mr-2 h-4 w-4" />
                          Change Role
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleRemoveCollaborator(collaborator.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove Access
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}

            {collaborators.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No collaborators yet</p>
                <p className="text-sm">Invite family and friends to contribute memories</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {invitations.length > 0 && (
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Pending Invitations ({invitations.filter((i) => i.status === "pending").length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {invitations
                .filter((invitation) => invitation.status === "pending")
                .map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-4 border border-amber-100 rounded-lg hover:bg-amber-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-100 rounded-full">
                        <Mail className="h-4 w-4 text-amber-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{invitation.email}</div>
                        <div className="text-sm text-gray-600">Invited as {invitation.role}</div>
                        <div className="text-xs text-gray-500">
                          Sent {new Date(invitation.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                        Pending
                      </Badge>
                      {getRoleIcon(invitation.role)}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      <InvitationModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        memorialId={memorialId}
        memorialName={memorialName}
      />
    </>
  )
}
