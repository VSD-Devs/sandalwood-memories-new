"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight, Shield, Share2, Lock } from "lucide-react"
import { features, relatedFeatures } from "@/lib/features-data"

const securityFeatures = [
  { title: "Private by default", detail: "Memorials stay invite-only unless you choose to share.", icon: Lock },
  { title: "Securely stored", detail: "Backed by modern encryption and careful data handling.", icon: Shield },
  { title: "Share with ease", detail: "Clean links and QR codes for services, programmes, and gatherings.", icon: Share2 }
]

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Banner */}
      <section className="relative bg-gradient-to-br from-[#1B3B5F] via-[#16304d] to-[#0f243d] text-white">
        <div className="absolute inset-0 opacity-10">
          <Image
            src="/flowers.png"
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        </div>
        
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold leading-tight">
              Everything you need to honour a life story
            </h1>
            <p className="text-xl sm:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              Create beautiful memorials, collect memories, and share tributes—all in one gentle, secure platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Button 
                size="lg" 
                className="bg-white text-[#1B3B5F] hover:bg-slate-100 px-8 py-4 text-lg font-medium rounded-full shadow-lg" 
                asChild
              >
                <Link href="/create">Start for free</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white hover:text-[#1B3B5F] px-8 py-4 text-lg font-medium rounded-full"
                asChild
              >
                <Link href="/pricing">See pricing</Link>
              </Button>
            </div>
            <p className="text-sm text-white/70 pt-2">No credit card required</p>
          </div>
        </div>
      </section>

      {/* Main Features Grid */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-4">
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#1B3B5F]">
              Our features
            </h2>
            <p className="text-lg lg:text-xl text-slate-700 max-w-3xl mx-auto">
              Discover how each feature helps you create and share meaningful memorials.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {features.map((feature) => {
              const FeatureIcon = feature.icon
              
              return (
                <Link
                  key={feature.slug}
                  href={`/features/${feature.slug}`}
                  className="group bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl overflow-hidden transition-all"
                >
                  <div className="relative h-64 overflow-hidden">
                    <Image
                      src={feature.heroImage}
                      alt={feature.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 1024px) 100vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    <div className="absolute top-4 left-4 w-12 h-12 rounded-xl bg-white/90 backdrop-blur-sm flex items-center justify-center text-[#1B3B5F]">
                      <FeatureIcon className="w-6 h-6" />
                    </div>
                  </div>
                  
                  <div className="p-6 lg:p-8">
                    <h3 className="font-serif text-2xl font-semibold text-[#1B3B5F] mb-3 group-hover:text-[#16304d] transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-slate-700 leading-relaxed mb-4">
                      {feature.tagline}
                    </p>
                    <div className="flex items-center gap-2 text-[#1B3B5F] font-medium group-hover:gap-3 transition-all">
                      <span>Learn more</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Related Features */}
      <section className="py-16 lg:py-24 bg-[#F5F5F0]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-4">
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#1B3B5F]">
              Part of our all-in-one memorial platform
            </h2>
            <p className="text-lg lg:text-xl text-slate-700 max-w-3xl mx-auto">
              Everything you need to honour your loved one, all in one place.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedFeatures.map(({ title, description, icon: Icon, image, slug }) => (
              <Link
                key={title}
                href={`/features/${slug}`}
                className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md overflow-hidden transition-shadow"
              >
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={image}
                    alt={title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                </div>
                <div className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-[#E8F0F5] flex items-center justify-center text-[#1B3B5F] mb-4">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif text-xl font-semibold text-[#1B3B5F] mb-2 group-hover:text-[#16304d] transition-colors">
                    {title}
                  </h3>
                  <p className="text-slate-700 text-sm leading-relaxed">
                    {description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Security & Privacy */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative h-[500px] rounded-3xl overflow-hidden shadow-xl">
              <Image
                src="/elderly-woman-gardening.png"
                alt="Privacy and security"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </div>
            
            <div className="space-y-8">
              <div>
                <h2 className="font-serif text-3xl lg:text-4xl font-semibold text-[#1B3B5F] mb-4">
                  Care and protection
                </h2>
                <p className="text-lg text-slate-700 leading-relaxed">
                  Privacy sits beside usability. We keep controls straightforward and readable so you never worry who can see a memory.
                </p>
              </div>
              
              <div className="space-y-6">
                {securityFeatures.map(({ title, detail, icon: Icon }) => (
                  <div key={title} className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white border border-[#C7D6E2] flex items-center justify-center text-[#1B3B5F] flex-shrink-0">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-[#1B3B5F] font-semibold text-lg mb-1">
                        {title}
                      </h3>
                      <p className="text-slate-700 leading-relaxed">
                        {detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-[#1B3B5F] via-[#16304d] to-[#0f243d] text-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold">
            Ready to honour their memory?
          </h2>
          <p className="text-lg sm:text-xl text-white/90 leading-relaxed max-w-2xl mx-auto">
            Start free, keep control of privacy, and build a place your family will return to with ease.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button 
              size="lg" 
              className="bg-white text-[#1B3B5F] hover:bg-slate-100 px-8 py-4 text-lg font-medium rounded-full shadow-lg" 
              asChild
            >
              <Link href="/create">Start creating now</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white hover:text-[#1B3B5F] px-8 py-4 text-lg font-medium rounded-full"
              asChild
            >
              <Link href="/pricing">View pricing plans</Link>
            </Button>
          </div>
          <p className="text-sm text-white/70 pt-2">No credit card required</p>
        </div>
      </section>
    </div>
  )
}
