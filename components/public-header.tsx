"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { Menu, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import AuthModal from "@/components/auth-modal"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"

const navLinks = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/memorial", label: "Memorials" },
  { href: "/about", label: "About" },
]

export default function PublicHeader() {
  const { user } = useAuth() as any
  const [open, setOpen] = useState(false)

  if (user) return null

  return (
    <header className="sticky top-0 left-0 right-0 z-50 border-b border-slate-200/60 bg-white/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 items-center h-16">
          <Link href="/" className="flex items-center">
            <Image src="/logo.png" alt="Sandalwood Memories" width={120} height={40} priority className="h-10 w-auto" />
          </Link>

          <nav className="hidden md:flex items-center justify-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-slate-700 hover:text-[#1B3B5F] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center justify-end gap-3">
            <AuthModal mode="signin">
              <Button
                variant="outline"
                className="rounded-full border-2 border-[#1B3B5F] text-[#1B3B5F] hover:bg-[#1B3B5F] hover:text-white px-4"
              >
                Sign In
              </Button>
            </AuthModal>
            <AuthModal mode="signup">
              <Button className="rounded-full bg-[#1B3B5F] hover:bg-[#16304d] text-white px-4">
                Sign up free
              </Button>
            </AuthModal>
            <button
              type="button"
              aria-label="Toggle navigation menu"
              className="md:hidden inline-flex items-center justify-center rounded-full border border-slate-200 p-2 text-slate-700"
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
          "md:hidden transition-[max-height] duration-300 ease-in-out overflow-hidden border-t border-slate-200/60 bg-white",
          open ? "max-h-96" : "max-h-0",
        )}
      >
        <div className="px-4 pb-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-lg px-3 py-3 text-sm font-medium text-slate-800 hover:bg-slate-100"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="space-y-2 pt-2">
            <AuthModal mode="signin">
              <Button
                variant="outline"
                className="w-full rounded-full border-2 border-[#1B3B5F] text-[#1B3B5F] hover:bg-[#1B3B5F] hover:text-white"
                onClick={() => setOpen(false)}
              >
                Sign In
              </Button>
            </AuthModal>
            <AuthModal mode="signup">
              <Button
                className="w-full rounded-full bg-[#1B3B5F] hover:bg-[#16304d] text-white"
                onClick={() => setOpen(false)}
              >
                Sign up free
              </Button>
            </AuthModal>
          </div>
        </div>
      </div>
    </header>
  )
}


