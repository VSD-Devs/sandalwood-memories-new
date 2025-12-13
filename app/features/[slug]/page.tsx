import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { CheckCircle2, ArrowLeft, Heart, Quote, Shield, Share2, Lock } from "lucide-react"
import { getFeatureBySlug, relatedFeatures } from "@/lib/features-data"
import { buildMetadata } from "@/lib/seo"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const feature = getFeatureBySlug(slug)
  
  if (!feature) {
    return buildMetadata({
      title: "Feature Not Found",
      description: "The requested feature page could not be found.",
      path: `/features/${slug}`,
    })
  }

  return buildMetadata({
    title: feature.title,
    description: feature.tagline,
    path: `/features/${slug}`,
    image: feature.heroImage,
  })
}

export default async function FeaturePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const feature = getFeatureBySlug(slug)
  
  if (!feature) {
    notFound()
  }

  const FeatureIcon = feature.icon
  const securityFeatures = [
    { title: "Private by default", detail: "Memorials stay invite-only unless you choose to share.", icon: Lock },
    { title: "Securely stored", detail: "Backed by modern encryption and careful data handling.", icon: Shield },
    { title: "Share with ease", detail: "Clean links and QR codes for services, programmes, and gatherings.", icon: Share2 }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Banner */}
      <section className="relative bg-gradient-to-br from-[#1B3B5F] via-[#16304d] to-[#0f243d] text-white">
        <div className="absolute inset-0 opacity-10">
          <Image
            src={feature.heroImage}
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        </div>
        
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <Link 
            href="/features" 
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to all features</span>
          </Link>
          
          <div className="max-w-4xl space-y-6">
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/20">
              <FeatureIcon className="w-6 h-6" />
              <h1 className="font-serif text-2xl lg:text-3xl font-semibold">
                {feature.title}
              </h1>
            </div>
            
            <p className="text-xl sm:text-2xl text-white/90 max-w-3xl leading-relaxed">
              {feature.tagline}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
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
            <p className="text-sm text-white/70">No credit card required</p>
          </div>
        </div>
      </section>

      {/* Hero Image */}
      <section className="py-12 lg:py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="relative h-[400px] lg:h-[500px] rounded-3xl overflow-hidden shadow-2xl">
              <Image
                src={feature.heroImage}
                alt={feature.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 80vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 lg:py-24 bg-[#F5F5F0]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-serif text-3xl lg:text-4xl font-semibold text-[#1B3B5F] mb-12 text-center">
              How {feature.title.toLowerCase()} works
            </h2>
            
            <div className="space-y-12">
              {feature.steps.map((step) => (
                <div key={step.number} className="grid lg:grid-cols-2 gap-8 items-center">
                  <div className={`space-y-4 ${step.number % 2 === 0 ? 'lg:order-2' : 'lg:order-1'}`}>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-[#1B3B5F] text-white flex items-center justify-center font-bold text-2xl flex-shrink-0">
                        {step.number}
                      </div>
                      <h3 className="font-serif text-2xl lg:text-3xl font-semibold text-[#1B3B5F]">
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-lg text-slate-700 leading-relaxed pl-20 lg:pl-0">
                      {step.description}
                    </p>
                  </div>
                  
                  <div className={`relative h-64 lg:h-80 rounded-2xl overflow-hidden shadow-lg ${step.number % 2 === 0 ? 'lg:order-1' : 'lg:order-2'}`}>
                    <Image
                      src={step.image}
                      alt={step.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-[#F5F5F0] rounded-3xl p-8 lg:p-12 border border-slate-200">
              <h3 className="font-serif text-2xl font-semibold text-[#1B3B5F] mb-6">
                What's included
              </h3>
              <ul className="space-y-4">
                {feature.highlights.map((highlight) => (
                  <li key={highlight} className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-[#4A90A4] mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700 text-base lg:text-lg leading-relaxed">{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
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
            {relatedFeatures.map(({ title, description, icon: Icon, image, slug: relatedSlug }) => {
              const relatedFeature = getFeatureBySlug(relatedSlug)
              const href = relatedFeature ? `/features/${relatedSlug}` : "/features"
              
              return (
              <Link
                key={title}
                href={href}
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
              )
            })}
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

      {/* Testimonial */}
      <section className="py-16 lg:py-24 bg-[#F5F5F0]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-8 lg:p-12 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-[#E8F0F5] border border-[#C7D6E2] flex items-center justify-center text-[#1B3B5F]">
                <Heart className="w-8 h-8" />
              </div>
              <div>
                <p className="font-semibold text-[#1B3B5F] text-lg">Margaret's family</p>
                <p className="text-slate-600 text-sm">Manchester, United Kingdom</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <Quote className="w-8 h-8 text-[#4A90A4] flex-shrink-0 mt-1" />
              <p className="text-slate-700 text-lg lg:text-xl leading-relaxed italic">
                "We set this up on a Sunday afternoon. Within an hour, cousins in three cities added photos and stories we had never seen. It feels like a calm sitting room for our memories."
              </p>
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

