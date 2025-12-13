"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Menu, X } from "lucide-react"

import { UserNav } from "@/components/user-nav"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"

export default function PublicHeader() {
  const { user, logout } = useAuth() as any
  const [open, setOpen] = useState(false)

  const navLinks = [
    { href: "/about", label: "About" },
    { href: "/features", label: "Features" },
    { href: "/#memorial-search", label: "Search" },
    { href: "/pricing", label: "Pricing" },
    { href: "/memorial", label: user ? "My memorials" : "Memorials" },
  ]

  const handleClose = () => setOpen(false)
  const handleLogout = async () => {
    await logout?.()
    setOpen(false)
  }

  return (
    <header className="sticky top-0 left-0 right-0 z-[60] border-b border-[#e8d9c9]/80 bg-white/85 backdrop-blur-lg shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Sandalwood Memories"
              width={150}
              height={48}
              priority
              className="h-10 w-auto"
            />
          </Link>

          <nav className="hidden md:flex items-center justify-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-semibold text-slate-800 hover:text-[#1B3B5F] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center justify-end gap-3">
            {user ? (
              <>
                <Link href="/create" className="hidden sm:inline-flex">
                  <Button className="rounded-full bg-[#1B3B5F] hover:bg-[#16304d] text-white px-4 shadow-md shadow-[#1B3B5F]/20">
                    Create memorial
                  </Button>
                </Link>
                <UserNav />
              </>
            ) : (
              <>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-full border-2 border-[#1B3B5F] text-[#1B3B5F] hover:bg-[#1B3B5F] hover:text-white px-4 bg-white/70"
                >
                  <Link href="/auth?mode=signin">Sign in</Link>
                </Button>
                <Button asChild className="rounded-full bg-[#1B3B5F] hover:bg-[#16304d] text-white px-4 shadow-md shadow-[#1B3B5F]/20">
                  <Link href="/auth?mode=signup">Start free</Link>
                </Button>
              </>
            )}
            <button
              type="button"
              aria-label="Toggle navigation menu"
              className="md:hidden inline-flex items-center justify-center rounded-full border border-[#e8d9c9] p-2 text-slate-800 bg-white/80"
              onClick={() => setOpen((prev) => !prev)}
            >
              {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile sheet */}
      <div
        className={cn(
          "md:hidden transition-[max-height] duration-300 ease-in-out overflow-hidden border-t border-[#e8d9c9]/80 bg-white/90 backdrop-blur",
          open ? "max-h-[28rem]" : "max-h-0",
        )}
      >
        <div className="px-4 pb-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-lg px-3 py-3 text-sm font-semibold text-slate-800 hover:bg-[#e7edf5]"
              onClick={handleClose}
            >
              {link.label}
            </Link>
          ))}

          {user ? (
            <div className="space-y-2 pt-3">
              <Link
                href="/create"
                className="block rounded-full bg-[#1B3B5F] text-white text-center px-4 py-3 font-semibold hover:bg-[#16304d] shadow"
                onClick={handleClose}
              >
                Create memorial
              </Link>
              <Link
                href="/profile"
                className="block rounded-full border border-[#e8d9c9] text-center px-4 py-3 font-semibold text-slate-800 hover:bg-[#e7edf5]"
                onClick={handleClose}
              >
                Profile
              </Link>
              <button
                type="button"
                className="w-full rounded-full border border-[#e8d9c9] px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-[#e7edf5]"
                onClick={handleLogout}
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="space-y-2 pt-2">
              <Button
                asChild
                variant="outline"
                className="w-full rounded-full border-2 border-[#1B3B5F] text-[#1B3B5F] hover:bg-[#1B3B5F] hover:text-white bg-white/70"
                onClick={handleClose}
              >
                <Link href="/auth?mode=signin">Sign in</Link>
              </Button>
              <Button
                asChild
                className="w-full rounded-full bg-[#1B3B5F] hover:bg-[#16304d] text-white shadow"
                onClick={handleClose}
              >
                <Link href="/auth?mode=signup">Start free</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}


