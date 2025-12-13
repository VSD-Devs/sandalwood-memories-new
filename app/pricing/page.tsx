"use client"
import { useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Star, Crown, Heart, ArrowRight, Sparkles, Shield, Image as ImageIcon, Users } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const pricingTiers = [
  {
    name: "Free",
    price: "£0",
    period: "forever",
    description: "Perfect for creating a simple memorial",
    tagline: "Start preserving memories today",
    icon: Heart,
    image: "/elderly-woman-reading.png",
    features: [
      "Create 1 memorial page",
      "Upload up to 3 photos",
      "Upload 1 video (up to 50MB)",
      "Unlimited timeline events",
      "QR code generation",
      "Community support",
    ],
    cta: "Start Free",
    popular: false,
    planId: "free",
    available: true,
  },
  {
    name: "Premium",
    price: "£99",
    period: "per year",
    description: "Enhanced features for meaningful memorials",
    tagline: "Unlimited memories, unlimited love",
    icon: Star,
    image: "/family-gathering-dinner.png",
    features: [
      "Unlimited memorial pages",
      "Unlimited photos per memorial",
      "Unlimited videos per memorial",
      "Unlimited timeline events",
      "Premium QR codes (no watermark)",
      "Large video uploads (up to 2GB)",
      "Custom memorial themes",
      "Priority email support",
      "Advanced sharing options",
    ],
    cta: "Coming Soon",
    popular: true,
    planId: "premium",
    available: false,
  },
  {
    name: "Fully Managed",
    price: "£250",
    period: "per memorial",
    description: "Complete memorial creation service",
    tagline: "We'll help tell their story",
    icon: Crown,
    image: "/elderly-woman-gardening.png",
    features: [
      "Everything in Premium",
      "Professional memorial creation",
      "Dedicated memorial specialist",
      "Content writing assistance",
      "Photo restoration service",
      "Custom design consultation",
      "Physical QR code plaques",
      "White-glove setup service",
      "Phone support",
      "Memorial maintenance",
    ],
    cta: "Coming Soon",
    popular: false,
    planId: "fullyManaged",
    available: false,
  },
]

export default function PricingPage() {
  const { user } = useAuth()
  const router = useRouter()

  const scrollToPlans = useCallback(() => {
    document.querySelector("#plans")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [])

  const handlePlanSelect = async (planId: string) => {
    if (planId === "free") {
      if (!user) {
        toast.error("Please sign in to start your free memorial")
        return
      }
      router.push("/create")
      return
    }

    toast.info("Premium plans coming soon! Contact us for early access.")
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f4ec] via-white to-[#f4f8ff]">
      <main>
        {/* Hero */}
        <section className="relative py-16 sm:py-20 lg:py-24 overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/qr-scan.png"
              alt="QR code scanning at memorial"
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
            {/* Overlay for text visibility */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/90 to-white/95" />
            <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-transparent to-white/80" />
          </div>

          {/* Content */}
          <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* Text Content */}
              <div className="text-center lg:text-left space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 shadow-md ring-1 ring-slate-200">
                  <Sparkles className="w-4 h-4 text-[#0f3c5d]" aria-hidden />
                  <span className="text-sm font-medium text-[#0f3c5d]">Calm plans, clear pricing</span>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-slate-900 leading-tight">
                  Simple, transparent pricing
                </h1>
                <p className="text-xl sm:text-2xl text-slate-700 leading-relaxed">
                  Start free and upgrade when you are ready. No surprises, only warm, accessible colours.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button
                    size="lg"
                    onClick={scrollToPlans}
                    className="bg-[#0f3c5d] hover:bg-[#0c304c] text-white h-12 px-8 text-base shadow-md"
                  >
                    View plans
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => handlePlanSelect("free")}
                    className="border-2 border-[#0f3c5d]/30 text-slate-800 hover:bg-white h-12 px-8 text-base bg-white/90"
                  >
                    Start free
                  </Button>
                </div>
              </div>

              {/* Image Preview - Desktop only */}
              <div className="hidden lg:block relative h-[400px] rounded-2xl overflow-hidden shadow-2xl ring-2 ring-white/50">
                <Image
                  src="/qr-scan.png"
                  alt="QR code scanning demonstration"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 0vw, 50vw"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Plans */}
        <section id="plans" className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-white via-slate-50/30 to-white">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
            <div className="text-center mb-12 space-y-4">
              <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900">Choose your plan</h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Start with our free plan and upgrade when you need more features
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 lg:gap-10 items-stretch">
              {pricingTiers.map((tier) => {
                const IconComponent = tier.icon
                const isComingSoon = !tier.available
                return (
                  <div
                    key={tier.name}
                    className={cn(
                      "relative rounded-2xl border transition-all overflow-hidden bg-white/90 backdrop-blur-sm h-full flex flex-col shadow-sm hover:shadow-lg",
                      tier.popular
                        ? "border-[#0f3c5d] ring-2 ring-[#0f3c5d]/18"
                        : "border-slate-200",
                      isComingSoon && "opacity-95"
                    )}
                  >
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#0f3c5d] via-transparent to-[#0f3c5d] opacity-45" aria-hidden />
                    <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-white to-slate-50/35" aria-hidden />
                    <div className="relative flex flex-col h-full p-7 sm:p-8 space-y-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-[#0f3c5d]/12 flex items-center justify-center shadow-sm">
                            <IconComponent className="w-6 h-6 text-[#0f3c5d]" />
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-2xl font-semibold text-slate-900">{tier.name}</h3>
                            {tier.popular && tier.available && (
                              <Badge className="bg-[#0f3c5d] text-white px-2.5 py-1 text-xs">Most chosen</Badge>
                            )}
                            {isComingSoon && <Badge className="bg-slate-700 text-white px-2.5 py-1 text-xs">Coming soon</Badge>}
                          </div>
                        </div>
                        {tier.tagline && <p className="text-sm font-semibold text-[#0f3c5d]">{tier.tagline}</p>}
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-bold text-slate-900">{tier.price}</span>
                          <span className="text-sm text-slate-600">/ {tier.period}</span>
                        </div>
                        <p className="text-base text-slate-600">{tier.description}</p>
                      </div>

                      {/* Features */}
                      <div className="space-y-2 flex-1">
                        {tier.features.map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-emerald-700 mt-0.5 flex-shrink-0" />
                            <span className="text-base text-slate-700 leading-relaxed">{feature}</span>
                          </div>
                        ))}
                      </div>

                      {/* CTA */}
                      <Button
                        onClick={() => handlePlanSelect(tier.planId)}
                        disabled={isComingSoon}
                        className={cn(
                          "w-full h-12 text-base font-semibold mt-4",
                          isComingSoon
                            ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                            : tier.popular
                            ? "bg-[#0f3c5d] hover:bg-[#0c304c] text-white"
                            : "bg-slate-900 hover:bg-slate-800 text-white"
                        )}
                      >
                        {tier.cta}
                        {!isComingSoon && <ArrowRight className="ml-2 w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-12 text-center">
              <p className="text-base text-slate-600">
                Premium and Fully Managed plans launching soon. Your free memorial stays active forever.
              </p>
            </div>
          </div>
        </section>

        {/* Included with every plan */}
        <section className="py-16 sm:py-20 lg:py-24 bg-white">
          <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
            <div className="text-center mb-12 space-y-4">
              <h3 className="text-3xl sm:text-4xl font-semibold text-slate-900">Included with every plan</h3>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                The same thoughtful, accessible design—kept simple so every generation can take part.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              <div className="bg-gradient-to-br from-white to-slate-50/50 rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-[#0f3c5d]/10 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-[#0f3c5d]" />
                </div>
                <h4 className="text-lg font-semibold text-slate-900 mb-2">Privacy first</h4>
                <p className="text-base text-slate-600 leading-relaxed">Invite-only access with controls that keep your family space protected.</p>
              </div>
              <div className="bg-gradient-to-br from-white to-slate-50/50 rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-[#0f3c5d]/10 flex items-center justify-center mb-4">
                  <ImageIcon className="w-6 h-6 text-[#0f3c5d]" />
                </div>
                <h4 className="text-lg font-semibold text-slate-900 mb-2">Beautiful galleries</h4>
                <p className="text-base text-slate-600 leading-relaxed">Photos, videos, and moments displayed with calm, accessible colours.</p>
              </div>
              <div className="bg-gradient-to-br from-white to-slate-50/50 rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-[#0f3c5d]/10 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-[#0f3c5d]" />
                </div>
                <h4 className="text-lg font-semibold text-slate-900 mb-2">Collaboration</h4>
                <p className="text-base text-slate-600 leading-relaxed">Invite relatives to add stories, keeping everything organised and kind.</p>
              </div>
              <div className="bg-gradient-to-br from-white to-slate-50/50 rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-[#0f3c5d]/10 flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-[#0f3c5d]" />
                </div>
                <h4 className="text-lg font-semibold text-slate-900 mb-2">Accessible design</h4>
                <p className="text-base text-slate-600 leading-relaxed">Large type, strong contrast, and mobile-first layouts for effortless reading.</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-white via-slate-50/30 to-white">
          <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
            <div className="text-center mb-12 space-y-4">
              <h3 className="text-3xl sm:text-4xl font-semibold text-slate-900">Frequently asked questions</h3>
              <p className="text-lg text-slate-600">Straight answers so you can decide quickly.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <h4 className="text-lg font-semibold text-slate-900 mb-3">When will Premium plans be available?</h4>
                <p className="text-base text-slate-600 leading-relaxed">
                  Premium and Fully Managed plans are nearly ready. Begin with our free plan and we'll notify you before upgrades go live.
                </p>
              </div>
              <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <h4 className="text-lg font-semibold text-slate-900 mb-3">What happens to my memorial if I cancel?</h4>
                <p className="text-base text-slate-600 leading-relaxed">
                  Free memorials remain active indefinitely. Premium memorials stay visible for 12 months after cancellation.
                </p>
              </div>
              <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <h4 className="text-lg font-semibold text-slate-900 mb-3">Do you offer refunds?</h4>
                <p className="text-base text-slate-600 leading-relaxed">
                  We provide a 30-day money-back guarantee on Premium subscriptions. Fully Managed services are bespoke and quoted with care.
                </p>
              </div>
              <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <h4 className="text-lg font-semibold text-slate-900 mb-3">What is included in Fully Managed?</h4>
                <p className="text-base text-slate-600 leading-relaxed">
                  Our team curates your memorial end-to-end: writing support, design guidance, photo curation, and optional physical QR plaques.
                </p>
              </div>
              <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <h4 className="text-lg font-semibold text-slate-900 mb-3">Can I create multiple memorials?</h4>
                <p className="text-base text-slate-600 leading-relaxed">
                  Free accounts include one memorial. Premium will unlock unlimited memorials, while Fully Managed is priced per memorial.
                </p>
              </div>
              <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <h4 className="text-lg font-semibold text-slate-900 mb-3">Is my data secure?</h4>
                <p className="text-base text-slate-600 leading-relaxed">
                  Yes. All memorial data is encrypted and stored securely. We never share personal information with third parties.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-[#0f3c5d] via-[#0c304c] to-[#0a2538] text-white">
          <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center space-y-6">
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold">
              Begin a memorial in minutes
            </h3>
            <p className="text-lg sm:text-xl text-slate-100 leading-relaxed max-w-2xl mx-auto">
              Create a calm, beautiful space. It's free to start, and you can invite family whenever you're ready.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button
                size="lg"
                onClick={() => handlePlanSelect("free")}
                className="bg-white text-[#0f3c5d] hover:bg-slate-100 h-12 px-8 text-base font-semibold shadow-lg"
              >
                Start free memorial
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => router.push("/features")}
                className="border-2 border-white/30 text-white hover:bg-white/10 h-12 px-8 text-base"
              >
                View all features
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
