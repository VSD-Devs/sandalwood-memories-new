import { Button } from "@/components/ui/button"
import { Heart, Image as ImageIcon, Users, Flame, Quote } from "lucide-react"
import Link from "next/link"
import AuthModal from "@/components/auth-modal"
import Image from "next/image"
import { MemorialSearch } from "@/components/memorial-search"

type Memorial = {
  id: string
  full_name: string
  title?: string
  birth_date?: string
  death_date?: string
  burial_location?: string
  profile_image_url?: string
  slug?: string
}

export const revalidate = 300

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

async function getRecentMemorials(): Promise<Memorial[]> {
  try {
    const res = await fetch(`${siteUrl}/api/memorials?limit=12`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data.slice(0, 6) : []
  } catch (error) {
    console.error("Failed to fetch memorials:", error)
    return []
  }
}

export default async function HomePage() {
  const memorials = await getRecentMemorials()

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      {/* Hero Section */}
      <section className="relative min-h-screen overflow-hidden bg-[#F5F5F0] lg:h-screen lg:bg-[#F5F5F0]">
        {/* Mobile background image */}
        <div className="absolute inset-0 lg:hidden">
          <Image
            src="/flowers.png"
            alt="Cherry blossom tribute illustration"
            fill
            sizes="100vw"
            className="object-cover object-center brightness-90 contrast-105"
            priority
          />
          {/* Light overlay for text readability on mobile */}
          <div className="absolute inset-0 bg-black/15" />
        </div>

        {/* Decorative leaves */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute -left-10 bottom-0 w-64 h-64 opacity-20">
            <svg viewBox="0 0 200 200" className="w-full h-full text-[#c6d6cf]">
              <path d="M20 180 Q40 160 60 180 T100 180 T140 180 T180 180" stroke="currentColor" strokeWidth="2" fill="none" />
              <path d="M30 170 Q50 150 70 170" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
          </div>
        </div>

        <div className="min-h-screen grid lg:h-full lg:grid-cols-2 relative z-10">
          {/* Text Content - Left Side */}
          <div className="flex items-center justify-center px-6 py-16 sm:px-8 sm:py-20 lg:px-16 lg:py-0 lg:bg-[#F5F5F0]">
            <div className="w-full max-w-2xl">
              <div className="bg-white/95 backdrop-blur-sm lg:bg-[#F5F5F0] rounded-3xl p-6 sm:p-8 lg:p-0 lg:rounded-none shadow-xl lg:shadow-none border border-white/20 lg:border-0">
                <div className="text-center lg:text-left space-y-6 sm:space-y-8">
                  <h1 className="font-serif text-4xl sm:text-5xl lg:text-7xl font-medium text-[#1B3B5F] leading-tight">
                    Create a Lasting Digital Tribute for Your Loved Ones
                  </h1>
                  <p className="text-xl sm:text-2xl lg:text-3xl text-slate-600 leading-relaxed">
                    A gentle, respectful space to honour and celebrate the lives of those we've lost.
                    Share stories, photos, and memories that family and friends can treasure for generations.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                    <AuthModal mode="signup">
                      <Button
                        size="lg"
                        className="bg-[#1B3B5F] hover:bg-[#16304d] text-white text-base sm:text-lg px-8 py-4 sm:px-10 sm:py-6 h-auto rounded-full shadow-lg transition-all hover:scale-105 w-full sm:w-auto"
                      >
                        Start a Free Memorial
                      </Button>
                    </AuthModal>
                    <Link href="/features" className="w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="lg"
                        className="border-2 border-[#1B3B5F] text-[#1B3B5F] hover:bg-[#1B3B5F] hover:text-white text-base sm:text-lg px-8 py-4 sm:px-10 sm:py-6 h-auto rounded-full transition-all w-full"
                      >
                        Learn More
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Image - Right Side */}
          <div className="relative w-full h-full bg-[#F5F5F0] overflow-hidden hidden lg:block">
            <Image
              src="/flowers.png"
              alt="Cherry blossom tribute illustration"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover object-center brightness-105 contrast-110"
              priority
            />
            {/* Gradient overlays to blend seamlessly with background */}
            <div className="absolute inset-0 bg-gradient-to-l from-[#F5F5F0]/35 via-transparent to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#F5F5F0]/15 pointer-events-none" />
          </div>
        </div>
      </section>

      {/* Feature Overview Section */}
      <section className="py-12 sm:py-16 lg:py-24 bg-gradient-to-b from-[#F5F5F0] to-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 lg:gap-12">
            {/* Share Stories */}
            <div className="text-center space-y-4 sm:space-y-6 group p-4 sm:p-6 rounded-2xl hover:bg-white hover:shadow-xl transition-all duration-300">
              <div className="flex justify-center">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#E8F0F5] group-hover:bg-[#1B3B5F]/10 flex items-center justify-center transition-colors duration-300">
                  <Flame className="w-10 h-10 sm:w-12 sm:h-12 text-[#4A90A4] group-hover:text-[#1B3B5F] transition-colors duration-300" />
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl sm:text-3xl font-serif font-medium text-[#1B3B5F]">Share Stories</h3>
                <p className="text-lg sm:text-xl text-slate-600 leading-relaxed">
                  Preserve precious memories and stories that celebrate the life of your loved one in a shared space.
                </p>
              </div>
            </div>

            {/* Upload Photos & Videos */}
            <div className="text-center space-y-4 sm:space-y-6 group p-4 sm:p-6 rounded-2xl hover:bg-white hover:shadow-xl transition-all duration-300">
              <div className="flex justify-center">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#E8F0F5] group-hover:bg-[#1B3B5F]/10 flex items-center justify-center transition-colors duration-300">
                  <ImageIcon className="w-10 h-10 sm:w-12 sm:h-12 text-[#4A90A4] group-hover:text-[#1B3B5F] transition-colors duration-300" />
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl sm:text-3xl font-serif font-medium text-[#1B3B5F]">Upload Photos & Videos</h3>
                <p className="text-lg sm:text-xl text-slate-600 leading-relaxed">
                  Create a beautiful, lasting gallery of moments that capture their essence, journey, and smile.
                </p>
              </div>
            </div>

            {/* Invite Family & Friends */}
            <div className="text-center space-y-4 sm:space-y-6 group p-4 sm:p-6 rounded-2xl hover:bg-white hover:shadow-xl transition-all duration-300 sm:col-span-2 lg:col-span-1">
              <div className="flex justify-center">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#E8F0F5] group-hover:bg-[#1B3B5F]/10 flex items-center justify-center transition-colors duration-300">
                  <Users className="w-10 h-10 sm:w-12 sm:h-12 text-[#4A90A4] group-hover:text-[#1B3B5F] transition-colors duration-300" />
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl sm:text-3xl font-serif font-medium text-[#1B3B5F]">Invite Family & Friends</h3>
                <p className="text-lg sm:text-xl text-slate-600 leading-relaxed">
                  Bring together everyone who cared to contribute their own memories, creating a rich tapestry of love.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Introductory Text Section */}
      <section className="py-12 sm:py-16 lg:py-24 bg-white relative overflow-hidden">
        {/* Decorative leaf branch */}
        <div className="absolute top-0 right-0 w-32 h-32 sm:w-48 sm:h-48 lg:w-64 lg:h-64 opacity-10 pointer-events-none">
          <svg viewBox="0 0 200 200" className="w-full h-full text-[#1B3B5F]">
            <path d="M180 20 Q160 40 140 20 T100 20 T60 20 T20 20" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M170 30 Q150 50 130 30" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        </div>

        <div className="mx-auto max-w-4xl px-6 sm:px-8 lg:px-12 relative z-10">
          <p className="text-xl sm:text-2xl lg:text-4xl font-serif text-[#1B3B5F] leading-relaxed text-center">
            Sandalwood Memories provides a gentle, respectful space to honour and celebrate the lives of those we've lost.
            Our platform makes it simple to create a beautiful digital memorial that family and friends can visit,
            contribute to, and treasure for generations to come.
          </p>
        </div>
      </section>

      {/* Detailed Feature Panel */}
      <section className="py-12 sm:py-16 lg:py-24 bg-[#F8FAFC]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
            <div className="space-y-6 sm:space-y-8 lg:space-y-10 order-2 lg:order-1">
              <div className="flex items-start gap-4 sm:gap-6 group">
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-2xl bg-white shadow-md flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <Flame className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-[#4A90A4]" />
                </div>
                <div>
                  <h4 className="text-lg sm:text-xl font-serif font-medium text-[#1B3B5F] mb-2">A Place for Stories</h4>
                  <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                    Create a memorial that friends and family can return to, adding words and moments over time. It's a living biography.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 sm:gap-6 group">
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-2xl bg-white shadow-md flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <ImageIcon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-[#4A90A4]" />
                </div>
                <div>
                  <h4 className="text-lg sm:text-xl font-serif font-medium text-[#1B3B5F] mb-2">Visual Memories</h4>
                  <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                    Build a calm gallery that captures their life — photos, videos, and audio keepsakes in one safe place.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 sm:gap-6 group">
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-2xl bg-white shadow-md flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-[#4A90A4]" />
                </div>
                <div>
                  <h4 className="text-lg sm:text-xl font-serif font-medium text-[#1B3B5F] mb-2">Private & Secure</h4>
                  <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                    Allow loved ones to contribute safely with private invites, gentle approvals, and simple sharing controls.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-6 sm:p-8 lg:p-12 space-y-4 sm:space-y-6 border border-slate-100 order-1 lg:order-2">
              <h3 className="text-3xl sm:text-4xl font-serif font-medium text-[#1B3B5F] mb-3 sm:mb-4">Built for Calm Remembrance</h3>
              <p className="text-lg sm:text-xl text-slate-600 leading-relaxed">
                Sandalwood Memories is designed to be a sanctuary. Share stories, upload photos and videos, and invite
                those who loved them to contribute. Clear privacy controls keep everything respectful and easy to manage.
              </p>
              <p className="text-lg sm:text-xl text-slate-600 leading-relaxed">
                Whether you start with a single photo or a full tribute, the page grows as memories are added. Accessible
                colours, large type, and straightforward navigation make it friendly for every generation.
              </p>
              <div className="pt-4 sm:pt-6">
                <AuthModal mode="signup">
                  <Button className="bg-[#1B3B5F] hover:bg-[#16304d] text-white text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 h-auto rounded-full shadow-md w-full">
                    Start Creating Now
                  </Button>
                </AuthModal>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-12 sm:py-16 lg:py-24 bg-[#E8F5E8]/50 relative overflow-hidden">
        {/* Decorative leaf branch */}
        <div className="absolute top-0 right-0 w-32 h-32 sm:w-48 sm:h-48 lg:w-64 lg:h-64 opacity-20 pointer-events-none">
          <svg viewBox="0 0 200 200" className="w-full h-full text-green-300">
            <path d="M180 40 Q160 60 140 40 T100 40 T60 40 T20 40" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M170 50 Q150 70 130 50" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <path d="M160 60 Q140 80 120 60" stroke="currentColor" strokeWidth="1" fill="none" />
          </svg>
        </div>

        <div className="mx-auto max-w-4xl px-6 sm:px-8 lg:px-12 relative z-10">
          <div className="flex justify-center mb-6 sm:mb-8 lg:mb-10">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white flex items-center justify-center shadow-sm">
              <Quote className="w-8 h-8 sm:w-10 sm:h-10 text-[#4A90A4]" />
            </div>
          </div>
          <blockquote className="text-xl sm:text-2xl lg:text-5xl font-serif font-medium text-[#1B3B5F] text-center leading-tight mb-8 sm:mb-10 lg:mb-12 px-4">
            "Creating a memorial for my grandmother on Sandalwood Memories brought our family together in a way I never expected.
            Everyone could share their favourite stories and photos, and now we have a beautiful tribute we can visit anytime."
          </blockquote>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#1B3B5F] text-white flex items-center justify-center text-lg sm:text-xl font-semibold shadow-lg border-2 sm:border-4 border-white">
              OR
            </div>
            <div className="text-center sm:text-left">
              <p className="text-xl sm:text-2xl font-semibold text-[#1B3B5F]">Ovania Reithoane</p>
              <p className="text-lg sm:text-xl text-slate-600">Family Member</p>
            </div>
          </div>
        </div>
      </section>

      {/* Memorial search */}
      <section className="py-12 sm:py-16 lg:py-24 bg-white" id="memorial-search">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[0.95fr,1.05fr] gap-8 sm:gap-10 lg:gap-12 items-start">
            <div className="space-y-4 sm:space-y-6 order-2 lg:order-1">
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.15em] text-[#4A90A4]">Find someone</p>
              <h2 className="text-3xl sm:text-4xl lg:text-6xl font-serif font-medium text-[#1B3B5F]">
                Search public memorials
              </h2>
              <p className="text-lg sm:text-xl text-slate-600 leading-relaxed">
                Look up a loved one across the public memorials. Search by name, title, or resting place to go straight to their page.
                All results keep to our calm, accessible design with clear contrast.
              </p>
              <ul className="space-y-2 sm:space-y-3 text-slate-700">
                <li className="flex gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-[#1B3B5F] flex-shrink-0" aria-hidden />
                  <span className="text-base sm:text-lg">Works from any page — just search and jump to the right memorial.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-[#1B3B5F] flex-shrink-0" aria-hidden />
                  <span className="text-base sm:text-lg">Quick filters for names, titles, and places with a single request.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-[#1B3B5F] flex-shrink-0" aria-hidden />
                  <span className="text-base sm:text-lg">No distracting motion — clear results that load swiftly.</span>
                </li>
              </ul>
            </div>
            <div className="order-1 lg:order-2">
              <MemorialSearch
                initialResults={memorials}
                heading="Search memorials"
                subheading="Search by name, title, or place to open a page."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-12 sm:py-16 lg:py-24 bg-[#F5F5F0]">
        <div className="mx-auto max-w-4xl px-6 sm:px-8 lg:px-12 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-6xl font-serif font-medium text-[#1B3B5F] mb-6 sm:mb-8">
            Start Creating Your Memorial Today
          </h2>
          <p className="text-xl sm:text-2xl text-slate-600 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed">
            It's free to get started. Create a beautiful, lasting tribute that honours your loved one and connects your family.
          </p>
          <AuthModal mode="signup">
            <Button
              size="lg"
              className="bg-[#1B3B5F] hover:bg-[#16304d] text-white text-lg sm:text-xl px-8 sm:px-12 py-6 sm:py-8 h-auto rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-105 w-full sm:w-auto"
            >
              Start a Free Memorial
            </Button>
          </AuthModal>
        </div>
      </section>
    </div>
  )
}
