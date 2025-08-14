"use client"
import Link from "next/link"
import Image from "next/image"

export default function Footer() {
  return (
    <footer className="bg-foreground text-background py-12 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Image src="/brand-logo.svg" alt="Sandalwood Memories" width={36} height={36} />
            <span className="font-serif font-bold text-xl">Sandalwood Memories</span>
          </div>
          <nav className="flex flex-wrap items-center gap-4 text-sm text-background/80">
            <Link href="/pricing" className="hover:text-background transition-colors">Pricing</Link>
            <Link href="/memorial" className="hover:text-background transition-colors">Memorials</Link>
            <Link href="/profile" className="hover:text-background transition-colors">Account</Link>
            <Link href="mailto:support@sandalwoodmemories.com" className="hover:text-background transition-colors">Support</Link>
          </nav>
        </div>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-background/70">
          <div>
            <div className="font-semibold text-background mb-2">Contact</div>
            <div>Email: support@sandalwoodmemories.com</div>
          </div>
          <div>
            <div className="font-semibold text-background mb-2">Resources</div>
            <div className="flex gap-4">
              <Link href="/pricing" className="hover:text-background">Pricing</Link>
              <Link href="/create" className="hover:text-background">Create</Link>
              <Link href="/invite/sample" className="hover:text-background">Invite</Link>
              <Link href="/blog" className="hover:text-background">Blog</Link>
              <Link href="/legal" className="hover:text-background">Legal</Link>
            </div>
          </div>
          <div className="md:text-right">
            <div>© {new Date().getFullYear()} Sandalwood Memories.</div>
            <div className="text-xs">
              <Link href="/legal/privacy" className="hover:text-background underline underline-offset-4">Privacy</Link>
              <span className="px-1">•</span>
              <Link href="/legal/cookies" className="hover:text-background underline underline-offset-4">Cookies</Link>
              <span className="px-1">•</span>
              <Link href="/legal/terms" className="hover:text-background underline underline-offset-4">Terms</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}


