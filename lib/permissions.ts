import React from "react"
export type Role = "owner" | "admin" | "moderator" | "contributor"

export interface Permission {
  action: string
  resource: string
  condition?: (context: any) => boolean
}

export interface UserPermissions {
  role: Role
  memorialId: string
  userId: string
  isOwner: boolean
}

// Define permissions for each role
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: [
    // Owners can do everything
    { action: "*", resource: "*" },
  ],
  admin: [
    // Memorial management
    { action: "read", resource: "memorial" },
    { action: "update", resource: "memorial" },
    { action: "delete", resource: "memorial" },

    // Content management
    { action: "create", resource: "media" },
    { action: "update", resource: "media" },
    { action: "delete", resource: "media" },
    { action: "create", resource: "timeline" },
    { action: "update", resource: "timeline" },
    { action: "delete", resource: "timeline" },
    { action: "create", resource: "tribute" },
    { action: "update", resource: "tribute" },
    { action: "delete", resource: "tribute" },

    // User management
    { action: "create", resource: "invitation" },
    { action: "delete", resource: "invitation" },
    { action: "update", resource: "collaborator" },
    { action: "delete", resource: "collaborator" },

    // Moderation
    { action: "approve", resource: "tribute" },
    { action: "reject", resource: "tribute" },
    { action: "moderate", resource: "content" },
  ],
  moderator: [
    // Memorial viewing
    { action: "read", resource: "memorial" },
    { action: "update", resource: "memorial", condition: (ctx) => ctx.field !== "privacy" },

    // Content management (limited)
    { action: "create", resource: "media" },
    { action: "update", resource: "media", condition: (ctx) => ctx.isOwner || ctx.role === "admin" },
    { action: "delete", resource: "media", condition: (ctx) => ctx.isOwner || ctx.role === "admin" },
    { action: "create", resource: "timeline" },
    { action: "update", resource: "timeline", condition: (ctx) => ctx.isOwner || ctx.role === "admin" },
    { action: "delete", resource: "timeline", condition: (ctx) => ctx.isOwner || ctx.role === "admin" },
    { action: "create", resource: "tribute" },

    // Moderation capabilities
    { action: "approve", resource: "tribute" },
    { action: "reject", resource: "tribute" },
    { action: "moderate", resource: "content" },

    // Limited user management
    { action: "create", resource: "invitation", condition: (ctx) => ctx.role !== "admin" },
  ],
  contributor: [
    // Memorial viewing
    { action: "read", resource: "memorial" },

    // Content creation only
    { action: "create", resource: "media" },
    { action: "create", resource: "timeline" },
    { action: "create", resource: "tribute" },

    // Can only edit their own content
    { action: "update", resource: "media", condition: (ctx) => ctx.isCreator },
    { action: "delete", resource: "media", condition: (ctx) => ctx.isCreator },
    { action: "update", resource: "timeline", condition: (ctx) => ctx.isCreator },
    { action: "delete", resource: "timeline", condition: (ctx) => ctx.isCreator },
  ],
}

export class PermissionManager {
  static hasPermission(userPermissions: UserPermissions, action: string, resource: string, context: any = {}): boolean {
    const { role, isOwner } = userPermissions

    // Owners can do everything
    if (isOwner) return true

    const rolePermissions = ROLE_PERMISSIONS[role] || []

    // Check for wildcard permissions
    const wildcardPermission = rolePermissions.find(
      (p) =>
        (p.action === "*" && p.resource === "*") ||
        (p.action === action && p.resource === "*") ||
        (p.action === "*" && p.resource === resource),
    )

    if (wildcardPermission) {
      return wildcardPermission.condition ? wildcardPermission.condition(context) : true
    }

    // Check for specific permissions
    const specificPermission = rolePermissions.find((p) => p.action === action && p.resource === resource)

    if (specificPermission) {
      return specificPermission.condition ? specificPermission.condition(context) : true
    }

    return false
  }

  static canCreateContent(userPermissions: UserPermissions, contentType: string): boolean {
    return this.hasPermission(userPermissions, "create", contentType)
  }

  static canEditContent(userPermissions: UserPermissions, contentType: string, isCreator = false): boolean {
    return this.hasPermission(userPermissions, "update", contentType, { isCreator })
  }

  static canDeleteContent(userPermissions: UserPermissions, contentType: string, isCreator = false): boolean {
    return this.hasPermission(userPermissions, "delete", contentType, { isCreator })
  }

  static canModerate(userPermissions: UserPermissions): boolean {
    return this.hasPermission(userPermissions, "moderate", "content")
  }

  static canInviteUsers(userPermissions: UserPermissions, targetRole: Role = "contributor"): boolean {
    const context = { role: targetRole }
    return this.hasPermission(userPermissions, "create", "invitation", context)
  }

  static canManageCollaborators(userPermissions: UserPermissions): boolean {
    return this.hasPermission(userPermissions, "update", "collaborator")
  }

  static getAvailableActions(userPermissions: UserPermissions, resource: string): string[] {
    const { role, isOwner } = userPermissions

    if (isOwner) {
      return ["create", "read", "update", "delete", "approve", "reject", "moderate"]
    }

    const rolePermissions = ROLE_PERMISSIONS[role] || []
    return rolePermissions
      .filter((p) => p.resource === resource || p.resource === "*")
      .map((p) => p.action)
      .filter((action, index, self) => self.indexOf(action) === index)
  }
}

// Hook for getting user permissions in components
export function usePermissions(memorialId: string, userId: string, role: Role, isOwner: boolean): UserPermissions {
  return {
    role,
    memorialId,
    userId,
    isOwner,
  }
}

// Higher-order component for permission-based rendering
export function withPermission<T extends object>(
  Component: React.ComponentType<T>,
  requiredAction: string,
  requiredResource: string,
) {
  return function PermissionWrapper(props: T & { userPermissions: UserPermissions; context?: any }) {
    const { userPermissions, context, ...componentProps } = props

    if (!PermissionManager.hasPermission(userPermissions, requiredAction, requiredResource, context)) {
      return null
    }

    return React.createElement(Component, componentProps as T)
  }
}
