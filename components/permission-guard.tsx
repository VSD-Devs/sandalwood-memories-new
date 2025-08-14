"use client"

import type { ReactNode } from "react"
import { PermissionManager, type UserPermissions } from "@/lib/permissions"

interface PermissionGuardProps {
  userPermissions: UserPermissions
  action: string
  resource: string
  context?: any
  children: ReactNode
  fallback?: ReactNode
}

export function PermissionGuard({
  userPermissions,
  action,
  resource,
  context = {},
  children,
  fallback = null,
}: PermissionGuardProps) {
  const hasPermission = PermissionManager.hasPermission(userPermissions, action, resource, context)

  if (!hasPermission) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

interface RoleGuardProps {
  userRole: string
  allowedRoles: string[]
  children: ReactNode
  fallback?: ReactNode
}

export function RoleGuard({ userRole, allowedRoles, children, fallback = null }: RoleGuardProps) {
  if (!allowedRoles.includes(userRole)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
