"use client"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, Users, Clock, Shield, Image as ImageIcon, BookText, Check, ArrowRight, Quote, Star, Sparkles, Zap, Globe, Lock, Share2, Camera, MapPin, Calendar } from "lucide-react"
import { UserNav } from "@/components/user-nav"
import { useAuth } from "@/contexts/auth-context"

export default function FeaturesPage() {
  const { user } = useAuth() as any
  
  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      {/* Navigation for logged in users only */}
      {user && (
        <header className="sticky top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/memorial" className="flex items-center space-x-3">
                <Image src="/logo.png" alt="Sandalwood Memories" width={64} height={64} />
              </Link>
              <nav className="hidden md:flex items-center space-x-8">
                <Link href="/memorial" className="text-slate-600 hover:text-primary transition-colors font-medium">
                  My Memorials
                </Link>
                <Link href="/create" className="text-slate-600 hover:text-primary transition-colors font-medium">
                  Create Memorial
                </Link>
                <Link href="/features" className="text-primary font-medium">
                  Features
                </Link>
              </nav>
              <div className="flex items-center space-x-3">
                <Link href="/create" className="md:hidden">
                  <Button size="sm" className="bg-primary text-primary-foreground">Create</Button>
                </Link>
                <UserNav />
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 bg-gradient-to-b from-[#F5F5F0] via-white to-[#F5F5F0]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="bg-[#E8F0F5] text-[#1B3B5F] hover:bg-[#E8F0F5] border-[#C7D6E2] mb-6 px-4 py-2 rounded-full">
              <Sparkles className="w-4 h-4 mr-2" />
              Trusted by thousands of families
            </Badge>
            
            <h1 className="font-serif text-5xl md:text-6xl font-semibold text-[#1B3B5F] mb-6 leading-tight">
              A calm space to honour every memory
            </h1>
            
            <p className="text-xl text-slate-700 max-w-3xl mx-auto leading-relaxed mb-12">
              Gentle, mobile-first tools inspired by The Solace’s warmth. Create, invite, and share with a clear, web-app feel.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button
                size="lg"
                className="bg-[#1B3B5F] hover:bg-[#16304d] text-white px-8 py-4 text-lg font-medium rounded-full"
                asChild
              >
                <Link href="/create">
                  Start Creating
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-[#1B3B5F] text-[#1B3B5F] hover:bg-[#1B3B5F] hover:text-white px-8 py-4 text-lg font-medium rounded-full"
                asChild
              >
                <Link href="/pricing">View Pricing</Link>
              </Button>
            </div>

            {/* Quick testimonial */}
            <div className="max-w-2xl mx-auto">
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-slate-100">
                <Quote className="h-8 w-8 text-[#4A90A4] mx-auto mb-4" />
                <p className="text-slate-700 text-lg italic mb-6 leading-relaxed">
                  "Creating Mum's memorial brought our whole family together. Cousins I hadn't spoken to in years shared the most beautiful stories."
                </p>
                <div className="flex items-center justify-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-600 font-medium">— Sarah M., daughter</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl md:text-5xl font-semibold text-[#1B3B5F] mb-6">
              Everything you need
            </h2>
            <p className="text-xl text-slate-700 max-w-3xl mx-auto">
              Thoughtfully designed tools that feel calm on mobile and desktop.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Storytelling */}
            <Card className="group overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-400">
              <div className="relative h-64 overflow-hidden">
                <Image
                  src="/elderly-woman-reading.png"
                  alt="Tell their story"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-6 left-6 text-white">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                      <BookText className="w-5 h-5" />
                    </div>
                    <h3 className="text-2xl font-serif font-bold">Tell their story</h3>
                  </div>
                </div>
              </div>
              <CardContent className="p-8">
                <ul className="space-y-4 mb-6">
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Upload photos that capture their spirit</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Create a beautiful timeline of their life</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">AI assistance when words feel difficult</span>
                  </li>
                </ul>
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-sm text-slate-600 italic">
                    "The AI helped me write about Dad when I couldn't find the words myself."
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Family Collaboration */}
            <Card className="group overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-400">
              <div className="relative h-64 overflow-hidden">
                <Image
                  src="/family-gathering-dinner.png"
                  alt="Bring family together"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-6 left-6 text-white">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                    <h3 className="text-2xl font-serif font-bold">Bring everyone together</h3>
                  </div>
                </div>
              </div>
              <CardContent className="p-8">
                <ul className="space-y-4 mb-6">
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Invite family scattered across the world</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Collect stories from old friends</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Create a space for shared healing</span>
                  </li>
                </ul>
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-sm text-slate-600 italic">
                    "Relatives from Australia shared stories we'd never heard before."
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Photo Galleries */}
            <Card className="group overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-400">
              <div className="relative h-64 overflow-hidden">
                <Image
                  src="/elderly-woman-smiling.png"
                  alt="Beautiful photo galleries"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-6 left-6 text-white">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                      <Camera className="w-5 h-5" />
                    </div>
                    <h3 className="text-2xl font-serif font-bold">Beautiful galleries</h3>
                  </div>
                </div>
              </div>
              <CardContent className="p-8">
                <ul className="space-y-4 mb-6">
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Galleries that work on any device</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">High-quality images that do them justice</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Organised in a way that makes sense</span>
                  </li>
                </ul>
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-sm text-slate-600 italic">
                    "The photo gallery became our family's favourite place to visit."
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Privacy & Security */}
            <Card className="group overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-400">
              <div className="relative h-64 overflow-hidden">
                <Image
                  src="/elderly-woman-gardening.png"
                  alt="Safe and private"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-6 left-6 text-white">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                      <Lock className="w-5 h-5" />
                    </div>
                    <h3 className="text-2xl font-serif font-bold">Safe and private</h3>
                  </div>
                </div>
              </div>
              <CardContent className="p-8">
                <ul className="space-y-4 mb-6">
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Control who can view and contribute</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Invite-only access keeps it intimate</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Your memories are protected and secure</span>
                  </li>
                </ul>
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-sm text-slate-600 italic">
                    "I love that only family can see it. It feels like our own private space."
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* QR Code Sharing */}
            <Card className="group overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-400">
              <div className="relative h-64 overflow-hidden">
                <Image
                  src="/rose-garden.png"
                  alt="Share at the service"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-6 left-6 text-white">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <h3 className="text-2xl font-serif font-bold">Share at the service</h3>
                  </div>
                </div>
              </div>
              <CardContent className="p-8">
                <ul className="space-y-4 mb-6">
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Easy scanning for funeral attendees</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Perfect for headstone plaques</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Bridge the gap between old and new</span>
                  </li>
                </ul>
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-sm text-slate-600 italic">
                    "People at the funeral loved being able to add their own memories."
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Timeline Mapping */}
            <Card className="group overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-400">
              <div className="relative h-64 overflow-hidden">
                <Image
                  src="/elderly-woman-volunteering-library.png"
                  alt="Life journey timeline"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-6 left-6 text-white">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <h3 className="text-2xl font-serif font-bold">Life's journey mapped</h3>
                  </div>
                </div>
              </div>
              <CardContent className="p-8">
                <ul className="space-y-4 mb-6">
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Mark the milestones that defined them</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Add personal events only family knows</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Arrange memories exactly as you remember</span>
                  </li>
                </ul>
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-sm text-slate-600 italic">
                    "Seeing Gran's whole life laid out like this made us all smile through our tears."
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Family Stories Section */}
      <section className="py-20 bg-[#F5F5F0]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl md:text-5xl font-semibold text-[#1B3B5F] mb-6">
              Real families, real stories
            </h2>
            <p className="text-xl text-slate-700 max-w-3xl mx-auto">
              See how families like yours are creating meaningful memorials that bring comfort and connection.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="relative mb-8 mx-auto w-64 h-64 overflow-hidden rounded-3xl shadow-xl">
                <Image
                  src="/elderly-woman-smiling.png"
                  alt="Margaret's memorial page"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute -bottom-3 -right-3 bg-white rounded-full p-3 shadow-lg">
                  <Heart className="h-6 w-6 text-rose-500" />
                </div>
              </div>
              <h3 className="font-serif text-2xl font-semibold text-[#1B3B5F] mb-4">Margaret's Story</h3>
              <p className="text-slate-700 mb-6 text-lg leading-relaxed">
                "Our family scattered across three countries came together to share memories of Mum. It's become our gathering place."
              </p>
              <p className="text-slate-600 font-medium">— The Thompson Family</p>
            </div>
            
            <div className="text-center group">
              <div className="relative mb-8 mx-auto w-64 h-64 overflow-hidden rounded-3xl shadow-xl">
                <Image
                  src="/family-gathering-dinner.png"
                  alt="Family collaboration"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute -bottom-3 -right-3 bg-white rounded-full p-3 shadow-lg">
                  <Users className="h-6 w-6 text-blue-500" />
                </div>
              </div>
              <h3 className="font-serif text-2xl font-semibold text-[#1B3B5F] mb-4">Four Generations</h3>
              <p className="text-slate-700 mb-6 text-lg leading-relaxed">
                "The grandchildren love hearing stories about their great-grandfather. It's keeping our family history alive."
              </p>
              <p className="text-slate-600 font-medium">— The Rodriguez Family</p>
            </div>
            
            <div className="text-center group">
              <div className="relative mb-8 mx-auto w-64 h-64 overflow-hidden rounded-3xl shadow-xl">
                <Image
                  src="/elderly-woman-reading.png"
                  alt="Teacher's legacy"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute -bottom-3 -right-3 bg-white rounded-full p-3 shadow-lg">
                  <BookText className="h-6 w-6 text-amber-500" />
                </div>
              </div>
              <h3 className="font-serif text-2xl font-semibold text-[#1B3B5F] mb-4">A Teacher's Legacy</h3>
              <p className="text-slate-700 mb-6 text-lg leading-relaxed">
                "Former students from decades past have shared the most beautiful memories. She touched so many lives."
              </p>
              <p className="text-slate-600 font-medium">— Helen's Daughter</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-br from-[#1B3B5F] via-[#16304d] to-[#0f243d] text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-serif text-4xl md:text-5xl font-semibold mb-6">
              Ready to honour their memory?
            </h2>
            <p className="text-xl text-slate-100/90 mb-12 leading-relaxed">
              Creating a memorial shouldn't be complicated. Start with our free plan and 
              create something beautiful that brings your family together.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <Button
                size="lg"
                className="bg-white text-[#1B3B5F] hover:bg-slate-100 px-10 py-4 text-lg font-medium rounded-full"
                asChild
              >
                <Link href="/create">
                  Start Creating Now
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white hover:text-[#1B3B5F] px-10 py-4 text-lg font-medium rounded-full"
                asChild
              >
                <Link href="/pricing">View Pricing Plans</Link>
              </Button>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 max-w-2xl mx-auto border border-white/15">
              <div className="flex items-center justify-center gap-2 mb-4 text-amber-200">
                <Zap className="h-5 w-5 text-amber-400" />
                <span className="text-amber-400 font-semibold">No setup fees</span>
              </div>
              <p className="text-slate-100/90">
                Start free with up to 10 photos. Upgrade anytime to add more memories and features.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}