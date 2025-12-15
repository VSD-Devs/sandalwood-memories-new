"use client"
import Link from "next/link"
import Image from "next/image"

export default function Footer() {
  return (
    <footer
      aria-labelledby="site-footer-heading"
      className="relative overflow-hidden border-t border-[#e8d9c9] bg-gradient-to-b from-[#fffaf6] via-[#f7efe4] to-[#f4eadc]"
    >
      <h2 id="site-footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_24%,rgba(27,59,95,0.08),transparent_42%),radial-gradient(circle_at_82%_78%,rgba(99,102,241,0.08),transparent_40%)]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-12 text-slate-800">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/sandalwood-memories-logo2.png"
              alt="Sandalwood Memories"
              width={180}
              height={60}
              className="h-12 w-auto"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/create"
              className="inline-flex items-center rounded-full bg-[#1B3B5F] px-6 py-4 text-base font-semibold text-white hover:bg-[#16304d] transition-colors shadow-md shadow-[#1B3B5F]/20"
            >
              Create a memorial
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center rounded-full border-2 border-[#1B3B5F] px-6 py-4 text-base font-semibold text-[#1B3B5F] hover:bg-[#1B3B5F] hover:text-white transition-colors bg-white/70"
            >
              View plans
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-[#1B3B5F]">Product</h3>
            <ul className="space-y-2 text-base text-slate-800">
              <li>
                <Link href="/features" className="hover:text-[#1B3B5F] transition-colors">
                  What we offer
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
            <h3 className="text-base font-semibold text-[#1B3B5F]">Resources</h3>
            <ul className="space-y-2 text-base text-slate-800">
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
            <h3 className="text-base font-semibold text-[#1B3B5F]">Company</h3>
            <ul className="space-y-2 text-base text-slate-800">
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
            <h3 className="text-base font-semibold text-[#1B3B5F]">Need help?</h3>
            <p className="text-base text-slate-800 leading-relaxed">
              We’re here to support you as you create a space for remembrance.
            </p>
            <Link href="/contact" className="text-base font-semibold text-[#1B3B5F] hover:underline">
              Contact the team
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-[#e8d9c9] pt-6 text-base text-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Memorial Platform. All rights reserved.</p>
          <div className="flex gap-4 text-base">
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


