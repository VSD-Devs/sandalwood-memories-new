"use client"
import Link from "next/link"
import Image from "next/image"

export default function Footer() {
  return (
    <footer
      aria-labelledby="site-footer-heading"
      className="border-t border-slate-200/60 bg-gradient-to-b from-white to-[#F5F5F0]"
    >
      <h2 id="site-footer-heading" className="sr-only">
        Footer
      </h2>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-12">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Sandalwood Memories" width={80} height={80} />
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/create"
              className="inline-flex items-center rounded-full bg-[#1B3B5F] px-5 py-3 text-sm font-semibold text-white hover:bg-[#16304d] transition-colors"
            >
              Create a memorial
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center rounded-full border-2 border-[#1B3B5F] px-5 py-3 text-sm font-semibold text-[#1B3B5F] hover:bg-[#1B3B5F] hover:text-white transition-colors"
            >
              View plans
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[#1B3B5F]">Product</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>
                <Link href="/features" className="hover:text-[#1B3B5F] transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-[#1B3B5F] transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/create" className="hover:text-[#1B3B5F] transition-colors">
                  Create a memorial
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[#1B3B5F]">Resources</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>
                <Link href="/memorial" className="hover:text-[#1B3B5F] transition-colors">
                  Memorial examples
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-[#1B3B5F] transition-colors">
                  Articles
                </Link>
              </li>
              <li>
                <Link href="/invite" className="hover:text-[#1B3B5F] transition-colors">
                  Invite a collaborator
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[#1B3B5F]">Company</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>
                <Link href="/about" className="hover:text-[#1B3B5F] transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="hover:text-[#1B3B5F] transition-colors">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/legal/terms" className="hover:text-[#1B3B5F] transition-colors">
                  Terms
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[#1B3B5F]">Need help?</h3>
            <p className="text-sm text-slate-700 leading-relaxed">
              We’re here to support you as you create a space for remembrance.
            </p>
            <Link href="/contact" className="text-sm font-semibold text-[#1B3B5F] hover:underline">
              Contact the team
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200/60 pt-6 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Sandalwood Memories. All rights reserved.</p>
          <div className="flex gap-4 text-sm">
            <Link href="/legal/privacy" className="hover:text-[#1B3B5F] transition-colors">
              Privacy
            </Link>
            <Link href="/legal/cookies" className="hover:text-[#1B3B5F] transition-colors">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}


