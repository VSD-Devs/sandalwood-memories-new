"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { RoleBadge } from "./role-badge"
import { PermissionManager, type Role, type UserPermissions } from "@/lib/permissions"
import { Settings, Shield, Users, Info } from "lucide-react"

interface PermissionSettingsProps {
  userPermissions: UserPermissions
  collaborators: Array<{
    id: string
    user_name: string
    user_email: string
    role: Role
  }>
  onUpdateRole: (collaboratorId: string, newRole: Role) => void
}

export function PermissionSettings({ userPermissions, collaborators, onUpdateRole }: PermissionSettingsProps) {
  const [selectedCollaborator, setSelectedCollaborator] = useState<string | null>(null)

  const roleHierarchy: Role[] = ["owner", "admin", "moderator", "contributor"]

  const getRolePermissions = (role: Role) => {
    const mockPermissions = { role, memorialId: "", userId: "", isOwner: role === "owner" }
    return {
      canCreateContent: PermissionManager.canCreateContent(mockPermissions, "media"),
      canEditContent: PermissionManager.canEditContent(mockPermissions, "media"),
      canDeleteContent: PermissionManager.canDeleteContent(mockPermissions, "media"),
      canModerate: PermissionManager.canModerate(mockPermissions),
      canInviteUsers: PermissionManager.canInviteUsers(mockPermissions),
      canManageCollaborators: PermissionManager.canManageCollaborators(mockPermissions),
    }
  }

  const canManageRoles = PermissionManager.canManageCollaborators(userPermissions)

  if (!canManageRoles) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">You don't have permission to manage roles and permissions.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Role & Permission Management
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Role Overview */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-600" />
                Role Permissions Overview
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {roleHierarchy.map((role) => {
                  const permissions = getRolePermissions(role)
                  return (
                    <div key={role} className="border rounded-lg p-4 space-y-3">
                      <RoleBadge role={role} />
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span>Create Content</span>
                          <Switch checked={permissions.canCreateContent} disabled />
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Edit Content</span>
                          <Switch checked={permissions.canEditContent} disabled />
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Delete Content</span>
                          <Switch checked={permissions.canDeleteContent} disabled />
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Moderate</span>
                          <Switch checked={permissions.canModerate} disabled />
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Invite Users</span>
                          <Switch checked={permissions.canInviteUsers} disabled />
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Manage Roles</span>
                          <Switch checked={permissions.canManageCollaborators} disabled />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Collaborator Role Management */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                Manage Collaborator Roles
              </h3>
              <div className="space-y-4">
                {collaborators.map((collaborator) => (
                  <div
                    key={collaborator.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <div className="font-medium text-gray-900">{collaborator.user_name}</div>
                      <div className="text-sm text-gray-600">{collaborator.user_email}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <RoleBadge role={collaborator.role} />
                      {userPermissions.isOwner && (
                        <div className="flex gap-1">
                          {roleHierarchy
                            .filter((role) => role !== "owner" && role !== collaborator.role)
                            .map((role) => (
                              <Button
                                key={role}
                                variant="outline"
                                size="sm"
                                onClick={() => onUpdateRole(collaborator.id, role)}
                                className="text-xs"
                              >
                                Make {role}
                              </Button>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
