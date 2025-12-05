"use client"
import { Button } from "@/components/ui/button"
import { Heart, Image as ImageIcon, Users, Flame, Quote, ChevronDown, Sparkles } from "lucide-react"
import Link from "next/link"
import AuthModal from "@/components/auth-modal"
import Image from "next/image"
import { useEffect, useState, useRef, useCallback } from "react"
import { useIsMobile, usePullToRefresh, useInView } from "@/hooks/use-mobile"

interface Memorial {
  id: string
  full_name: string
  birth_date?: string
  death_date?: string
  location?: string
  profile_image_url?: string
  slug?: string
}

export default function HomePage() {
  const [memorials, setMemorials] = useState<Memorial[]>([])
  const [loadingMemorials, setLoadingMemorials] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const isMobile = useIsMobile()
  const heroRef = useRef<HTMLElement>(null)

  // Pull-to-refresh functionality
  const refreshMemorials = async () => {
    // Simulate a brief delay for better UX
    await new Promise(resolve => setTimeout(resolve, 1000))
    // Refetch memorials
    try {
      const res = await fetch("/api/memorials?limit=6")
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) {
          setMemorials(data.slice(0, 6))
        }
        setError(null)
      }
    } catch (err) {
      console.error("Failed to refresh memorials:", err)
    }
  }

  const { isRefreshing, pullDistance, canRefresh, handleTouchStart, handleTouchMove, handleTouchEnd } = usePullToRefresh(refreshMemorials)

  // Handle scroll for sticky header effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Add touch event listeners for pull-to-refresh on mobile
  useEffect(() => {
    if (isMobile) {
      const handleTouchStartEvent = (e: TouchEvent) => handleTouchStart(e)
      const handleTouchMoveEvent = (e: TouchEvent) => handleTouchMove(e)
      const handleTouchEndEvent = (e: TouchEvent) => handleTouchEnd(e)

      document.addEventListener('touchstart', handleTouchStartEvent, { passive: true })
      document.addEventListener('touchmove', handleTouchMoveEvent, { passive: true })
      document.addEventListener('touchend', handleTouchEndEvent, { passive: false })

      return () => {
        document.removeEventListener('touchstart', handleTouchStartEvent)
        document.removeEventListener('touchmove', handleTouchMoveEvent)
        document.removeEventListener('touchend', handleTouchEndEvent)
      }
    }
  }, [isMobile, handleTouchStart, handleTouchMove, handleTouchEnd])

  // Smooth scroll to next section
  const scrollToNext = () => {
    const nextSection = document.querySelector('#features')
    nextSection?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  useEffect(() => {
    fetch("/api/memorials?limit=6")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.status}`)
        }
        return res.json()
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setMemorials(data.slice(0, 6))
        } else {
          setMemorials([])
        }
        setError(null)
      })
      .catch((err) => {
        console.error("Failed to fetch memorials:", err)
        setError("Unable to load memorials at this time")
        setMemorials([])
      })
      .finally(() => {
        setLoadingMemorials(false)
      })
  }, [])

  return (
    <div className="min-h-screen bg-[#F5F5F0] no-rubber-band">
      {/* Pull-to-refresh indicator */}
      {isMobile && pullDistance > 0 && (
        <div
          className="fixed top-0 left-0 right-0 z-50 bg-[#F5F5F0] transition-transform duration-200 ease-out"
          style={{
            transform: `translateY(${Math.min(pullDistance - 60, 60)}px)`,
            paddingTop: '20px'
          }}
        >
          <div className="flex justify-center items-center space-x-2">
            <div className={`w-6 h-6 border-2 border-[#4A90A4] border-t-transparent rounded-full transition-transform duration-300 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="text-mobile-sm text-[#1B3B5F] font-medium">
              {isRefreshing ? 'Refreshing...' : canRefresh ? 'Release to refresh' : 'Pull to refresh'}
            </span>
          </div>
        </div>
      )}
      {/* Mobile-First Hero Section with Desktop Side-by-Side Layout */}
      <section
        ref={heroRef}
        className="relative min-h-screen lg:h-screen overflow-hidden bg-[#F5F5F0] safe-area-top safe-area-bottom"
      >
        {/* Background with subtle animation */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#F5F5F0] via-[#f8f9f6] to-[#F5F5F0]" />

        {/* Decorative elements - hidden on mobile, shown on larger screens */}
        <div className="absolute inset-0 pointer-events-none z-0 hidden sm:block">
          <div className="absolute -left-10 bottom-0 w-64 h-64 opacity-20">
            <svg viewBox="0 0 200 200" className="w-full h-full text-[#c6d6cf]">
              <path d="M20 180 Q40 160 60 180 T100 180 T140 180 T180 180" stroke="currentColor" strokeWidth="2" fill="none" />
              <path d="M30 170 Q50 150 70 170" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
          </div>
        </div>

        {/* Floating particles effect - desktop only */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none hidden lg:block">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-[#4A90A4]/20 rounded-full animate-pulse" style={{ animationDelay: '0s' }} />
          <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-[#4A90A4]/30 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-[#4A90A4]/25 rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        {/* Desktop: Grid layout | Mobile: Stacked layout */}
        <div className="h-full grid grid-cols-1 lg:grid-cols-2 relative z-10">
          {/* Text Content - Left Side (Desktop) / Top (Mobile) */}
          <div className="flex items-center justify-center bg-[#F5F5F0] px-4 sm:px-6 lg:px-12 xl:px-16 py-12 lg:py-0">
            <div className="text-center lg:text-left space-y-6 sm:space-y-8 max-w-2xl w-full">
              {/* Small decorative element - mobile only */}
              <div className="flex justify-center lg:hidden mb-2">
                <Sparkles className="w-6 h-6 text-[#4A90A4] animate-pulse" />
              </div>

              {/* Responsive typography */}
              <h1 className="font-serif text-mobile-3xl sm:text-mobile-4xl lg:text-5xl xl:text-6xl font-medium text-[#1B3B5F] leading-tight px-2 lg:px-0">
                Create a Lasting Digital Tribute for Your Loved Ones
              </h1>

              <p className="text-mobile-lg sm:text-mobile-xl lg:text-xl xl:text-2xl text-slate-600 leading-relaxed px-2 lg:px-0">
                A gentle, respectful space to honour and celebrate the lives of those we've lost.
                Share stories, photos, and memories that family and friends can treasure for generations.
              </p>

              {/* Responsive CTA buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start items-center px-4 lg:px-0">
                <AuthModal mode="signup">
                  <Button
                    size="lg"
                    className="!bg-[#1B3B5F] hover:!bg-[#16304d] active:!bg-[#142a42] !text-white text-mobile-lg lg:text-lg px-8 py-4 lg:py-6 h-auto rounded-full shadow-lg touch-feedback w-full sm:w-auto lg:w-auto min-w-[200px] transition-all"
                  >
                    Start a Free Memorial
                  </Button>
                </AuthModal>
                <Link href="/features" className="w-full sm:w-auto lg:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    className="!border-2 !border-[#1B3B5F] !bg-transparent !text-[#1B3B5F] hover:!bg-[#1B3B5F] hover:!text-white active:!bg-[#1B3B5F] active:!text-white text-mobile-lg lg:text-lg px-8 py-4 lg:py-6 h-auto rounded-full touch-feedback w-full sm:w-auto lg:w-auto min-w-[200px] transition-all"
                  >
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Image - Right Side (Desktop) / Bottom (Mobile) */}
          <div className="relative w-full h-64 sm:h-80 lg:h-full bg-[#F5F5F0] overflow-hidden order-first lg:order-last">
            <Image
              src="/flowers.png"
              alt="Cherry blossom tribute illustration"
              fill
              className="object-cover object-center opacity-85"
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            {/* Gradient overlays to blend seamlessly with background */}
            <div className="absolute inset-0 bg-gradient-to-l from-[#F5F5F0] via-[#F5F5F0]/80 to-transparent lg:block hidden" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#F5F5F0]/60 lg:hidden" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#F5F5F0]/40 lg:hidden" />
          </div>
        </div>

        {/* Scroll indicator - Mobile friendly, hidden on desktop */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 lg:hidden">
          <button
            onClick={scrollToNext}
            className="flex flex-col items-center space-y-2 text-[#1B3B5F]/60 hover:text-[#1B3B5F] transition-colors touch-feedback p-2"
            aria-label="Scroll to features"
          >
            <span className="text-mobile-sm font-medium">Discover More</span>
            <ChevronDown className="w-6 h-6 animate-bounce" />
          </button>
        </div>
      </section>

      {/* Mobile-First Feature Overview Section */}
      <section id="features" className="py-12 sm:py-16 lg:py-24 bg-gradient-to-b from-[#F5F5F0] to-white safe-area-left safe-area-right">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8" ref={useInView(0.1).ref}>
          {/* Mobile-first section header */}
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-mobile-2xl sm:text-mobile-3xl lg:text-4xl font-serif font-medium text-[#1B3B5F] mb-4">
              Everything You Need to Honour Their Memory
            </h2>
            <p className="text-mobile-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed px-2">
              Simple, beautiful tools designed to help you create a meaningful tribute that lasts forever.
            </p>
          </div>

          {/* Mobile-first feature grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
            {/* Share Stories - Mobile optimized */}
            <div className="text-center space-y-4 sm:space-y-6 group p-4 sm:p-6 rounded-2xl hover:bg-white hover:shadow-xl active:bg-white active:shadow-xl touch-feedback transition-all duration-300">
              <div className="flex justify-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full bg-[#E8F0F5] group-hover:bg-[#1B3B5F]/10 group-active:bg-[#1B3B5F]/10 flex items-center justify-center transition-colors duration-300">
                  <Flame className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-[#4A90A4] group-hover:text-[#1B3B5F] group-active:text-[#1B3B5F] transition-colors duration-300" />
                </div>
              </div>
              <div className="space-y-2 sm:space-y-3">
                <h3 className="text-mobile-xl sm:text-2xl font-serif font-medium text-[#1B3B5F]">Share Stories</h3>
                <p className="text-mobile-base sm:text-lg text-slate-600 leading-relaxed px-2">
                  Preserve precious memories and stories that celebrate the life of your loved one in a shared space.
                </p>
              </div>
            </div>

            {/* Upload Photos & Videos - Mobile optimized */}
            <div className="text-center space-y-4 sm:space-y-6 group p-4 sm:p-6 rounded-2xl hover:bg-white hover:shadow-xl active:bg-white active:shadow-xl touch-feedback transition-all duration-300">
              <div className="flex justify-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full bg-[#E8F0F5] group-hover:bg-[#1B3B5F]/10 group-active:bg-[#1B3B5F]/10 flex items-center justify-center transition-colors duration-300">
                  <ImageIcon className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-[#4A90A4] group-hover:text-[#1B3B5F] group-active:text-[#1B3B5F] transition-colors duration-300" />
                </div>
              </div>
              <div className="space-y-2 sm:space-y-3">
                <h3 className="text-mobile-xl sm:text-2xl font-serif font-medium text-[#1B3B5F]">Upload Photos & Videos</h3>
                <p className="text-mobile-base sm:text-lg text-slate-600 leading-relaxed px-2">
                  Create a beautiful, lasting gallery of moments that capture their essence, journey, and smile.
                </p>
              </div>
            </div>

            {/* Invite Family & Friends - Mobile optimized */}
            <div className="text-center space-y-4 sm:space-y-6 group p-4 sm:p-6 rounded-2xl hover:bg-white hover:shadow-xl active:bg-white active:shadow-xl touch-feedback transition-all duration-300 sm:col-span-2 lg:col-span-1">
              <div className="flex justify-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full bg-[#E8F0F5] group-hover:bg-[#1B3B5F]/10 group-active:bg-[#1B3B5F]/10 flex items-center justify-center transition-colors duration-300">
                  <Users className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-[#4A90A4] group-hover:text-[#1B3B5F] group-active:text-[#1B3B5F] transition-colors duration-300" />
                </div>
              </div>
              <div className="space-y-2 sm:space-y-3">
                <h3 className="text-mobile-xl sm:text-2xl font-serif font-medium text-[#1B3B5F]">Invite Family & Friends</h3>
                <p className="text-mobile-base sm:text-lg text-slate-600 leading-relaxed px-2">
                  Bring together everyone who cared to contribute their own memories, creating a rich tapestry of love.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile-First Introductory Text Section */}
      <section className="py-12 sm:py-16 lg:py-24 bg-white relative overflow-hidden safe-area-left safe-area-right">
        {/* Decorative leaf branch - hidden on mobile */}
        <div className="absolute top-0 right-0 w-32 h-32 sm:w-64 sm:h-64 opacity-10 pointer-events-none hidden sm:block">
          <svg viewBox="0 0 200 200" className="w-full h-full text-[#1B3B5F]">
            <path d="M180 20 Q160 40 140 20 T100 20 T60 20 T20 20" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M170 30 Q150 50 130 30" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        </div>

        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 relative z-10">
          <p className="text-mobile-xl sm:text-mobile-2xl lg:text-3xl font-serif text-[#1B3B5F] leading-relaxed text-center px-2">
            ForeverMemories.com provides a gentle, respectful space to honour and celebrate the lives of those we've lost.
            Our platform makes it simple to create a beautiful digital memorial that family and friends can visit,
            contribute to, and treasure for generations to come.
          </p>
        </div>
      </section>

      {/* Mobile-First Detailed Feature Panel */}
      <section className="py-12 sm:py-16 lg:py-24 bg-[#F8FAFC] safe-area-left safe-area-right">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
            {/* Feature list - Mobile stacked */}
            <div className="space-mobile-lg sm:space-y-8 lg:space-y-10 order-2 lg:order-1">
              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 group">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-white shadow-md flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-active:scale-110 touch-feedback transition-transform duration-300 mx-auto sm:mx-0">
                  <Flame className="w-6 h-6 sm:w-8 sm:h-8 text-[#4A90A4]" />
                </div>
                <div className="text-center sm:text-left flex-1">
                  <h4 className="text-mobile-lg sm:text-xl font-serif font-medium text-[#1B3B5F] mb-2">A Place for Stories</h4>
                  <p className="text-mobile-base sm:text-lg text-slate-600 leading-relaxed">
                    Create a memorial that friends and family can return to, adding words and moments over time. It's a living biography.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 group">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-white shadow-md flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-active:scale-110 touch-feedback transition-transform duration-300 mx-auto sm:mx-0">
                  <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8 text-[#4A90A4]" />
                </div>
                <div className="text-center sm:text-left flex-1">
                  <h4 className="text-mobile-lg sm:text-xl font-serif font-medium text-[#1B3B5F] mb-2">Visual Memories</h4>
                  <p className="text-mobile-base sm:text-lg text-slate-600 leading-relaxed">
                    Build a calm gallery that captures their life — photos, videos, and audio keepsakes in one safe place.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 group">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-white shadow-md flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-active:scale-110 touch-feedback transition-transform duration-300 mx-auto sm:mx-0">
                  <Users className="w-6 h-6 sm:w-8 sm:h-8 text-[#4A90A4]" />
                </div>
                <div className="text-center sm:text-left flex-1">
                  <h4 className="text-mobile-lg sm:text-xl font-serif font-medium text-[#1B3B5F] mb-2">Private & Secure</h4>
                  <p className="text-mobile-base sm:text-lg text-slate-600 leading-relaxed">
                    Allow loved ones to contribute safely with private invites, gentle approvals, and simple sharing controls.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature card - Mobile first */}
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-6 sm:p-8 lg:p-10 space-mobile-md sm:space-y-6 border border-slate-100 order-1 lg:order-2">
              <h3 className="text-mobile-2xl sm:text-3xl font-serif font-medium text-[#1B3B5F] text-center sm:text-left">Built for Calm Remembrance</h3>
              <div className="space-mobile-sm sm:space-y-4">
                <p className="text-mobile-base sm:text-lg text-slate-600 leading-relaxed">
                  ForeverMemories.com is designed to be a sanctuary. Share stories, upload photos and videos, and invite
                  those who loved them to contribute. Clear privacy controls keep everything respectful and easy to manage.
                </p>
                <p className="text-mobile-base sm:text-lg text-slate-600 leading-relaxed">
                  Whether you start with a single photo or a full tribute, the page grows as memories are added. Accessible
                  colours, large type, and straightforward navigation make it friendly for every generation.
                </p>
              </div>
              <div className="pt-4 sm:pt-6">
                <AuthModal mode="signup">
                  <Button className="!bg-[#1B3B5F] hover:!bg-[#16304d] active:!bg-[#142a42] !text-white text-mobile-lg px-6 sm:px-8 py-4 sm:py-6 h-auto rounded-full shadow-md touch-feedback w-full transition-all">
                    Start Creating Now
                  </Button>
                </AuthModal>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile-First Testimonial Section */}
      <section className="py-12 sm:py-16 lg:py-24 bg-[#E8F5E8]/50 relative overflow-hidden safe-area-left safe-area-right">
        {/* Decorative leaf branch - hidden on mobile */}
        <div className="absolute top-0 right-0 w-32 h-32 sm:w-64 sm:h-64 opacity-20 pointer-events-none hidden sm:block">
          <svg viewBox="0 0 200 200" className="w-full h-full text-green-300">
            <path d="M180 40 Q160 60 140 40 T100 40 T60 40 T20 40" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M170 50 Q150 70 130 50" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <path d="M160 60 Q140 80 120 60" stroke="currentColor" strokeWidth="1" fill="none" />
          </svg>
        </div>

        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 relative z-10" ref={useInView(0.1).ref}>
          <div className="flex justify-center mb-6 sm:mb-10">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white flex items-center justify-center shadow-sm">
              <Quote className="w-8 h-8 sm:w-10 sm:h-10 text-[#4A90A4]" />
            </div>
          </div>
          <blockquote className="text-mobile-xl sm:text-mobile-2xl lg:text-4xl font-serif font-medium text-[#1B3B5F] text-center leading-tight mb-8 sm:mb-12 px-2">
            "Creating a memorial for my grandmother on ForeverMemories.com brought our family together in a way I never expected.
            Everyone could share their favourite stories and photos, and now we have a beautiful tribute we can visit anytime."
          </blockquote>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#1B3B5F] text-white flex items-center justify-center text-mobile-lg sm:text-xl font-semibold shadow-lg border-2 sm:border-4 border-white">
              OR
            </div>
            <div className="text-center sm:text-left">
              <p className="text-mobile-lg sm:text-xl font-semibold text-[#1B3B5F]">Ovania Reithoane</p>
              <p className="text-mobile-base sm:text-lg text-slate-600">Family Member</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile-First Recently Created Memorials */}
      <section className="py-12 sm:py-16 lg:py-24 bg-white safe-area-left safe-area-right">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" ref={useInView(0.1).ref}>
          <h2 className="text-mobile-3xl sm:text-mobile-4xl lg:text-5xl font-serif font-medium text-[#1B3B5F] text-center mb-8 sm:mb-12 lg:mb-16 px-2">
            Recently Created Memorials
          </h2>

          {loadingMemorials ? (
            <div className="text-center py-8 sm:py-12">
              <div className="inline-flex items-center space-x-2">
                <div className="w-4 h-4 bg-[#4A90A4] rounded-full animate-pulse"></div>
                <div className="w-4 h-4 bg-[#4A90A4] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-4 h-4 bg-[#4A90A4] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
              <p className="text-mobile-base sm:text-lg text-slate-600 mt-4">Loading memorials...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 sm:py-12">
              <p className="text-mobile-base sm:text-lg text-slate-600">{error}</p>
            </div>
          ) : memorials.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <p className="text-mobile-base sm:text-lg text-slate-600 mb-4 sm:mb-6">No public memorials available at the moment.</p>
              <AuthModal mode="signup">
                <Button className="!bg-[#1B3B5F] hover:!bg-[#16304d] active:!bg-[#142a42] !text-white rounded-full touch-feedback px-6 py-3 text-mobile-base">
                  Create the First Memorial
                </Button>
              </AuthModal>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
              {memorials.map((memorial) => (
                <Link
                  key={memorial.id}
                  href={memorial.slug ? `/memorial/${memorial.slug}` : `/memorial/${memorial.id}`}
                  className="group block h-full touch-feedback"
                >
                  <div className="bg-slate-50 rounded-2xl sm:rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:shadow-xl active:-translate-y-1 border border-slate-100 h-full flex flex-col">
                    {memorial.profile_image_url ? (
                      <div className="aspect-[4/3] relative bg-slate-200 overflow-hidden">
                        <Image
                          src={memorial.profile_image_url}
                          alt={memorial.full_name}
                          fill
                          className="object-cover group-hover:scale-105 group-active:scale-105 transition-transform duration-700"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[4/3] bg-[#E8F0F5] flex items-center justify-center group-hover:bg-[#e1eaf0] group-active:bg-[#e1eaf0] transition-colors">
                        <Heart className="h-12 w-12 sm:h-16 sm:w-16 text-[#4A90A4] opacity-50" />
                      </div>
                    )}
                    <div className="p-4 sm:p-6 lg:p-8 flex-1 flex flex-col justify-between">
                      <div className="space-y-1 sm:space-y-2">
                        <h3 className="font-serif text-mobile-xl sm:text-2xl font-medium text-[#1B3B5F] group-hover:text-[#4A90A4] group-active:text-[#4A90A4] transition-colors">
                          {memorial.full_name}
                        </h3>
                        {memorial.location && (
                          <p className="text-mobile-base sm:text-lg text-slate-600">{memorial.location}</p>
                        )}
                      </div>
                      {memorial.birth_date && memorial.death_date && (
                        <div className="pt-4 sm:pt-6 mt-4 sm:mt-6 border-t border-slate-200">
                          <p className="text-mobile-sm sm:text-base text-slate-500 font-medium">
                            {new Date(memorial.birth_date).getFullYear()} – {new Date(memorial.death_date).getFullYear()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Mobile-First Final CTA */}
      <section className="py-12 sm:py-16 lg:py-24 bg-[#F5F5F0] safe-area-left safe-area-right safe-area-bottom">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-mobile-3xl sm:text-mobile-4xl lg:text-5xl font-serif font-medium text-[#1B3B5F] mb-4 sm:mb-6 lg:mb-8 px-2">
            Start Creating Your Memorial Today
          </h2>
          <p className="text-mobile-lg sm:text-xl text-slate-600 mb-6 sm:mb-8 lg:mb-10 max-w-2xl mx-auto leading-relaxed px-2">
            It's free to get started. Create a beautiful, lasting tribute that honours your loved one and connects your family.
          </p>
          <AuthModal mode="signup">
            <Button
              size="lg"
              className="!bg-[#1B3B5F] hover:!bg-[#16304d] active:!bg-[#142a42] !text-white text-mobile-xl px-8 sm:px-12 py-4 sm:py-6 lg:py-8 h-auto rounded-full shadow-xl hover:shadow-2xl active:shadow-2xl touch-feedback transition-all hover:scale-105 active:scale-105"
            >
              Start a Free Memorial
            </Button>
          </AuthModal>
        </div>
      </section>
    </div>
  )
}
