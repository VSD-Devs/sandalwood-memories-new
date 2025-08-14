"use client"

import { Badge } from "@/components/ui/badge"
import { Crown, Shield, Users, User } from "lucide-react"
import type { Role } from "@/lib/permissions"

interface RoleBadgeProps {
  role: Role
  size?: "sm" | "md" | "lg"
  showIcon?: boolean
}

export function RoleBadge({ role, size = "md", showIcon = true }: RoleBadgeProps) {
  const getRoleConfig = (role: Role) => {
    switch (role) {
      case "owner":
        return {
          label: "Owner",
          icon: Crown,
          className: "bg-slate-700 hover:bg-slate-800 text-white",
          description: "Full control of the memorial",
        }
      case "admin":
        return {
          label: "Administrator",
          icon: Crown,
          className: "bg-rose-500 hover:bg-rose-600 text-white",
          description: "Can manage all aspects of the memorial",
        }
      case "moderator":
        return {
          label: "Moderator",
          icon: Shield,
          className: "bg-amber-500 hover:bg-amber-600 text-white",
          description: "Can moderate content and manage contributions",
        }
      case "contributor":
        return {
          label: "Contributor",
          icon: Users,
          className: "bg-blue-500 hover:bg-blue-600 text-white",
          description: "Can add memories and contribute content",
        }
      default:
        return {
          label: "Guest",
          icon: User,
          className: "bg-gray-500 hover:bg-gray-600 text-white",
          description: "Limited access",
        }
    }
  }

  const config = getRoleConfig(role)
  const Icon = config.icon

  const iconSize = size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4"

  return (
    <Badge className={config.className} title={config.description}>
      {showIcon && <Icon className={`${iconSize} mr-1`} />}
      {config.label}
    </Badge>
  )
}
