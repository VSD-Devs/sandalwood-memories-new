"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { Home, Plus, Heart, Users, User } from "lucide-react"

import { useAuth } from "@/contexts/auth-context"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"

export function BottomNav() {
  const { user, logout } = useAuth()
  const isMobile = useIsMobile()
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  if (!user || !isMobile) return null

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname?.startsWith(href)
  }

  return (
    <>
      {/* Spacer to prevent content from being obscured by the fixed nav */}
      <div
        aria-hidden
        className="md:hidden"
        style={{ height: `calc(64px + env(safe-area-inset-bottom, 0px))` }}
      />

      <nav
        role="navigation"
        aria-label="Primary"
        className="bg-card/100 text-card-foreground md:hidden fixed inset-x-0 bottom-0 z-40 border-t"
      >
        <div
          className="mx-auto grid max-w-screen-sm grid-cols-5 items-center"
          style={{ paddingBottom: `env(safe-area-inset-bottom, 0px)` }}
        >
          <Tab
            href="/"
            label="Home"
            icon={<Home className="h-5 w-5" aria-hidden />}
            active={!!isActive("/")}
          />

          <Tab
            href="/memorial"
            label="Memorials"
            icon={<Heart className="h-5 w-5" aria-hidden />}
            active={!!isActive("/memorial")}
          />

          {/* Centre quick actions button opens the panel */}
          <button
            type="button"
            aria-label="Quick actions"
            className={cn(
              "focus-visible:ring-ring bg-primary text-primary-foreground mx-auto my-2 inline-flex h-12 w-12 items-center justify-center rounded-full align-middle outline-hidden ring-offset-background transition-none focus-visible:ring-2 focus-visible:ring-offset-2",
            )}
            onClick={() => setOpen(true)}
          >
            <Plus className="h-5 w-5" aria-hidden />
          </button>

          <Tab
            href="/admin/memorials"
            label="Collaborators"
            icon={<Users className="h-5 w-5" aria-hidden />}
            active={!!isActive("/admin")}
          />

          <Tab
            href="/profile"
            label="Account"
            icon={<User className="h-5 w-5" aria-hidden />}
            active={!!isActive("/profile")}
          />
        </div>
      </nav>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Quick actions</DrawerTitle>
            <DrawerDescription>Helpful shortcuts to get things done</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4">
            <div className="grid grid-cols-2 gap-3">
              <Action
                label="Create memorial"
                onClick={() => {
                  setOpen(false)
                  router.push("/create")
                }}
              />
              <Action
                label="My memorials"
                onClick={() => {
                  setOpen(false)
                  router.push("/memorial")
                }}
              />
              <Action
                label="Invite collaborator"
                onClick={() => {
                  setOpen(false)
                  router.push("/admin/tributes")
                }}
              />
              <Action
                label="Manage billing"
                onClick={() => {
                  setOpen(false)
                  router.push("/billing")
                }}
              />
            </div>
            <div className="mt-4">
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => {
                  setOpen(false)
                  logout()
                  router.push("/")
                }}
              >
                Sign out
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}

function Tab({
  href,
  label,
  icon,
  active,
}: {
  href: string
  label: string
  icon: React.ReactNode
  active?: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        "focus-visible:ring-ring text-muted-foreground hover:text-foreground group flex h-16 flex-col items-center justify-center gap-1 outline-hidden ring-offset-background transition-none focus-visible:ring-2 focus-visible:ring-offset-2",
        active && "text-foreground font-medium",
      )}
      aria-current={active ? "page" : undefined}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </Link>
  )
}

function Action({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="focus-visible:ring-ring bg-muted/60 hover:bg-muted text-foreground inline-flex h-12 items-center justify-center rounded-md px-3 text-base outline-hidden ring-offset-background transition-none focus-visible:ring-2 focus-visible:ring-offset-2"
    >
      {label}
    </button>
  )
}

export default BottomNav


