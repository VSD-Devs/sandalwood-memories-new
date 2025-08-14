"use client"
import { Button } from "@/components/ui/button"
import { Heart, Users, Clock, Shield, ArrowRight, Star } from "lucide-react"
import Link from "next/link"
import AuthModal from "@/components/auth-modal"
import { UserNav } from "@/components/user-nav"
import { useAuth } from "@/contexts/auth-context"
import Image from "next/image"

export default function HomePage() {
  const { user } = useAuth() as any
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-primary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-3">
              <Image src="/brand-logo.svg" alt="Sandalwood Memories" width={40} height={40} />
              <span className="font-serif font-bold text-2xl text-slate-800">Sandalwood Memories</span>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="#stories" className="text-slate-600 hover:text-primary transition-colors font-medium">
                Stories
              </Link>
              <Link href="#features" className="text-slate-600 hover:text-primary transition-colors font-medium">
                Features
              </Link>
              <Link href="/pricing" className="text-slate-600 hover:text-primary transition-colors font-medium">
                Pricing
              </Link>
              <Link href="#about" className="text-slate-600 hover:text-primary transition-colors font-medium">
                About
              </Link>
            </nav>
            <div className="flex items-center space-x-3">
              {user ? (
                <>
                  <Link href="/memorial" className="hidden md:inline text-slate-600 hover:text-primary font-medium">
                    My memorials
                  </Link>
                  <UserNav />
                </>
              ) : (
                <>
                  <AuthModal mode="signin">
                    <Button variant="ghost" className="text-slate-600 hover:text-primary">
                      Sign In
                    </Button>
                  </AuthModal>
                  <AuthModal mode="signup">
                    <Button className="bg-primary hover:bg-[color:var(--accent)] text-white px-6">Get Started</Button>
                  </AuthModal>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Split Layout */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--memorial-bg)] via-white to-[#F8F8F8]"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="inline-flex items-center space-x-2 bg-[color:var(--memorial-card)] text-[color:var(--secondary)] px-4 py-2 rounded-full text-sm font-medium">
                  <Star className="h-4 w-4" />
                  <span>Trusted by 10,000+ families</span>
                </div>
                <h1 className="font-serif text-5xl lg:text-6xl xl:text-7xl font-bold text-slate-900 leading-tight">
                  Every Life
                  <br />
                  <span className="text-primary">Tells a Story</span>
                </h1>
                <p className="text-xl lg:text-2xl text-slate-600 leading-relaxed max-w-xl">
                  Create a beautiful digital memorial that celebrates their journey, preserves their legacy, and brings
                  comfort to those who loved them.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <AuthModal mode="signup">
                  <Button
                    size="lg"
                    className="bg-primary hover:bg-[color:var(--accent)] text-white px-8 py-4 text-lg font-medium group"
                  >
                    Create Their Memorial
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </AuthModal>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-slate-300 text-slate-700 hover:bg-slate-50 px-8 py-4 text-lg bg-transparent"
                >
                  View Examples
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center space-x-8 pt-8 border-t border-slate-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">10K+</div>
                  <div className="text-sm text-slate-600">Memorials Created</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">50K+</div>
                  <div className="text-sm text-slate-600">Stories Shared</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">99.9%</div>
                  <div className="text-sm text-slate-600">Uptime</div>
                </div>
              </div>
            </div>

            {/* Right Visual */}
            <div className="relative">
              <div className="relative z-10">
                {/* Main Memorial Image */}
                <div className="relative rounded-2xl overflow-hidden shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-500">
                  <Image
                    src="/elderly-woman-smiling.png"
                    alt="Memorial portrait of an elderly woman with a warm smile"
                    width={500}
                    height={600}
                    className="w-full h-auto object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  <div className="absolute bottom-6 left-6 right-6 text-white">
                    <h3 className="font-serif text-2xl font-semibold mb-2">Margaret Rose Thompson</h3>
                    <p className="text-white/90">1932 - 2023 • Beloved Mother, Grandmother & Teacher</p>
                  </div>
                </div>

                {/* Floating Memory Cards */}
                <div className="absolute -top-4 -left-4 bg-white rounded-xl shadow-lg p-4 transform -rotate-6 hover:rotate-0 transition-transform duration-300">
                  <div className="flex items-center space-x-3">
                    <Image
                      src="/rose-garden.png"
                      alt="Rose garden"
                      width={60}
                      height={60}
                      className="rounded-lg object-cover"
                    />
                    <div>
                      <div className="font-medium text-slate-900">Rose Garden</div>
                      <div className="text-sm text-slate-600">Her favorite place</div>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-6 -right-6 bg-white rounded-xl shadow-lg p-4 transform rotate-6 hover:rotate-0 transition-transform duration-300">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-[color:var(--memorial-card)] rounded-lg flex items-center justify-center">
                      <Heart className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">127 Tributes</div>
                      <div className="text-sm text-slate-600">From loved ones</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Background Decorative Elements */}
              <div className="absolute top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-amber-200/30 rounded-full blur-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Story Showcase Section */}
      <section id="stories" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
              Stories That <span className="text-primary">Live Forever</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              See how families are preserving precious memories and celebrating the lives of their loved ones
            </p>
          </div>

          {/* Memorial Gallery */}
          <div className="grid md:grid-cols-3 gap-8">
            <div className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-2xl mb-4">
                <Image
                  src="/elderly-woman-gardening.png"
                  alt="Memorial garden scene"
                  width={400}
                  height={300}
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <h3 className="font-serif text-xl font-semibold text-slate-900 mb-2">A Life in Full Bloom</h3>
              <p className="text-slate-600">
                Dorothy's memorial celebrates her 40 years as a master gardener and community volunteer.
              </p>
            </div>

            <div className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-2xl mb-4">
                <Image
                  src="/family-gathering-dinner.png"
                  alt="Family gathering"
                  width={400}
                  height={300}
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <h3 className="font-serif text-xl font-semibold text-slate-900 mb-2">Family First</h3>
              <p className="text-slate-600">
                Robert's memorial brings together four generations of family stories and traditions.
              </p>
            </div>

            <div className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-2xl mb-4">
                <Image
                  src="/elderly-woman-reading.png"
                  alt="Reading and learning"
                  width={400}
                  height={300}
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <h3 className="font-serif text-xl font-semibold text-slate-900 mb-2">A Teacher's Legacy</h3>
              <p className="text-slate-600">
                Helen's memorial showcases 35 years of inspiring students and lifelong learning.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Reimagined */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="font-serif text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
              Everything You Need to <span className="text-primary">Honour Their Memory</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Our platform provides thoughtful tools designed specifically for creating meaningful digital memorials
            </p>
          </div>

          {/* Feature Grid - Asymmetric Layout */}
          <div className="grid lg:grid-cols-12 gap-8">
            {/* Large Feature */}
            <div className="lg:col-span-8 bg-gradient-to-br from-[color:var(--memorial-bg)] to-[color:var(--memorial-card)] rounded-3xl p-8 lg:p-12">
              <div className="flex flex-col lg:flex-row items-center gap-8">
                <div className="flex-1">
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-6">
                    <Heart className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-serif text-3xl font-bold text-slate-900 mb-4">Rich Storytelling</h3>
                  <p className="text-lg text-slate-700 mb-6 leading-relaxed">
                    Create immersive narratives with photos, videos, audio recordings, and written memories. Our AI
                    assistant helps you craft beautiful tributes that capture their essence.
                  </p>
                   <ul className="space-y-2 text-slate-600">
                    <li className="flex items-center">
                       <ArrowRight className="h-4 w-4 text-primary mr-2" /> Photo & video galleries
                    </li>
                    <li className="flex items-center">
                       <ArrowRight className="h-4 w-4 text-primary mr-2" /> Audio memories & voice notes
                    </li>
                    <li className="flex items-center">
                       <ArrowRight className="h-4 w-4 text-primary mr-2" /> AI-assisted writing
                    </li>
                  </ul>
                </div>
                <div className="flex-shrink-0">
                  <Image
                    src="/elderly-woman-volunteering-library.png"
                    alt="Storytelling feature"
                    width={300}
                    height={250}
                    className="rounded-2xl shadow-lg"
                  />
                </div>
              </div>
            </div>

            {/* Smaller Features */}
            <div className="lg:col-span-4 space-y-8">
              <div className="bg-amber-50 rounded-3xl p-8">
                <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-serif text-xl font-bold text-slate-900 mb-3">Interactive Timeline</h3>
                <p className="text-slate-600">
                  Chronicle their life journey with beautiful, interactive timelines that bring their story to life.
                </p>
              </div>

              <div className="bg-blue-50 rounded-3xl p-8">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-serif text-xl font-bold text-slate-900 mb-3">Family Collaboration</h3>
                <p className="text-slate-600">
                  Invite family and friends to contribute memories, creating a complete picture of their life.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Feature Row */}
          <div className="grid md:grid-cols-2 gap-8 mt-8">
            <div className="bg-green-50 rounded-3xl p-8 flex items-center space-x-6">
              <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="font-serif text-2xl font-bold text-slate-900 mb-2">Private & Secure</h3>
                <p className="text-slate-600">
                  Your memories are protected with enterprise-grade security. Control who can view and contribute to
                  each memorial.
                </p>
              </div>
            </div>

            <div className="bg-[color:var(--memorial-card)] rounded-3xl p-8 flex items-center space-x-6">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center flex-shrink-0">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="font-serif text-2xl font-bold text-slate-900 mb-2">QR Memorial Cards</h3>
                <p className="text-slate-600">
                  Connect physical and digital memories with QR codes for headstones, memorial cards, and keepsakes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23ffffff' fillOpacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: "60px 60px",
            }}
          ></div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="font-serif text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Begin Their Digital Legacy
          </h2>
          <p className="text-xl lg:text-2xl text-slate-300 mb-12 leading-relaxed">
            Join thousands of families who have chosen to honour their loved ones with beautiful, lasting digital
            memorials that celebrate life and preserve memories forever.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <AuthModal mode="signup">
              <Button
                size="lg"
                className="bg-primary hover:bg-[color:var(--accent)] text-white px-12 py-6 text-xl font-medium group"
              >
                Create Memorial Now
                <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </Button>
            </AuthModal>
            <div className="text-slate-400 text-sm">Free to start • No credit card required</div>
          </div>
        </div>
      </section>

      
    </div>
  )
}
