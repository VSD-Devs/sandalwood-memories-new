"use client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Star, Crown, Heart, Clock, ArrowRight, Sparkles } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import Image from "next/image"
import Link from "next/link"
import { UserNav } from "@/components/user-nav"
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
    <div className="min-h-screen bg-[#F5F5F0]">
      {/* Navigation for logged in users only */}
      {user && (
        <header className="sticky top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <Link href="/memorial" className="flex items-center space-x-3">
                <Image src="/logo.png" alt="Sandalwood Memories" width={72} height={72} />
              </Link>
              <nav className="hidden md:flex items-center space-x-8">
                <Link href="/memorial" className="text-slate-600 hover:text-[#4A90A4] transition-colors font-medium">
                  My Memorials
                </Link>
                <Link href="/create" className="text-slate-600 hover:text-[#4A90A4] transition-colors font-medium">
                  Create Memorial
                </Link>
                <Link href="/pricing" className="text-[#4A90A4] font-medium">
                  Pricing
                </Link>
              </nav>
              <div className="flex items-center space-x-3">
                <Link href="/create" className="md:hidden">
                  <Button size="sm" className="!bg-[#1B3B5F] !text-white rounded-full">Create</Button>
                </Link>
                <UserNav />
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Header */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-16 pb-12">
        <div className="text-center mb-14 max-w-4xl mx-auto">
          <Badge className="bg-[#E8F0F5] text-[#1B3B5F] hover:bg-[#E8F0F5] border-[#C7D6E2] mb-6 rounded-full">
            <Sparkles className="w-3 h-3 mr-1" />
            Choose the right plan for your needs
          </Badge>
          <h1 className="font-serif text-4xl md:text-5xl font-semibold text-[#1B3B5F] mb-6">
            Memorial Plans & Pricing
          </h1>
          <p className="text-xl text-slate-700 max-w-3xl mx-auto leading-relaxed">
            Honour your loved ones with dignity and create lasting memories that celebrate their life story. 
            From simple tributes to comprehensive memorial services.
          </p>
          <div className="mt-8 p-4 bg-white border border-slate-200 rounded-2xl max-w-2xl mx-auto shadow-sm">
            <div className="flex items-center justify-center gap-2 text-[#1B3B5F]">
              <Clock className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">Premium plans launching soon. Start free today.</span>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {pricingTiers.map((tier) => {
            const IconComponent = tier.icon
            return (
              <Card
                key={tier.name}
                className={cn(
                  "relative overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-md transition-all duration-300",
                  "hover:shadow-xl hover:-translate-y-1",
                  !tier.available && "opacity-90",
                  tier.popular && "ring-2 ring-[#4A90A4]",
                )}
              >
                {tier.popular && (
                  <Badge className="absolute top-4 right-4 bg-[#4A90A4] text-white z-10">Most Popular</Badge>
                )}
                {!tier.available && (
                  <Badge className="absolute top-4 left-4 bg-gray-500 text-white z-10">Coming Soon</Badge>
                )}

                {/* Image Header */}
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={tier.image}
                    alt={tier.name}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <h3 className="text-xl font-serif font-bold">{tier.name}</h3>
                    </div>
                    <p className="text-sm text-white/90 italic">{tier.tagline}</p>
                  </div>
                </div>

                <CardHeader className="text-center pb-4">
                  <div className="mt-2">
                    <span className="text-4xl font-bold text-[#1B3B5F]">{tier.price}</span>
                    <span className="text-slate-600 ml-2">/{tier.period}</span>
                  </div>
                  <CardDescription className="text-base text-slate-700">{tier.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 px-6">
                  {/* Features */}
                  <div>
                    <h4 className="font-semibold text-[#1B3B5F] mb-3">What's included:</h4>
                    <ul className="space-y-2">
                      {tier.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start gap-3">
                          <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-slate-700 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>

                <CardFooter className="pt-4 px-6 pb-6">
                  <Button
                    onClick={() => handlePlanSelect(tier.planId)}
                    disabled={!tier.available}
                    className={cn(
                      "w-full py-3 text-base font-semibold transition-all duration-200 rounded-full",
                      !tier.available
                        ? "bg-gray-300 text-white cursor-not-allowed"
                        : tier.popular
                          ? "bg-[#4A90A4] hover:bg-[#3a7a8a] text-white shadow-lg hover:shadow-xl"
                          : tier.name === "Free"
                            ? "bg-[#1B3B5F] hover:bg-[#16304d] text-white"
                            : "bg-slate-800 hover:bg-slate-900 text-white",
                    )}
                  >
                    {tier.cta}
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Trust Section */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="relative aspect-[3/1] rounded-2xl overflow-hidden shadow-lg mb-8 max-w-2xl mx-auto">
              <Image
                src="/rose-garden.png"
                alt="Peaceful memorial garden"
                fill
                className="object-cover"
              />
            </div>
            <h2 className="font-serif text-3xl font-bold text-[#1B3B5F] mb-4">
              A peaceful space to honour their memory
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed mb-8">
              Start with our free plan today and upgrade whenever you're ready. There's no pressure, 
              no time limits—just a beautiful space to celebrate a life well-lived.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="outline"
                onClick={() => router.push("/features")}
                className="text-base px-6 py-3 border-2 border-[#1B3B5F] !text-[#1B3B5F] hover:!bg-[#1B3B5F] hover:!text-white rounded-full"
              >
                Explore All Features
              </Button>
              <Button
                size="lg"
                onClick={() => handlePlanSelect("free")}
                className="!bg-[#1B3B5F] hover:!bg-[#16304d] !text-white text-base px-6 py-3 rounded-full"
              >
                Start Free Memorial
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-[#F5F5F0] py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl font-semibold text-[#1B3B5F] mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-lg text-slate-700">
                Here are some common questions about our pricing and services
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="font-semibold text-[#1B3B5F] mb-2">When will Premium plans be available?</h3>
                <p className="text-slate-600">
                  Premium and Fully Managed plans are launching soon. Start with our free plan and we'll notify you when
                  upgrades are available.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="font-semibold text-[#1B3B5F] mb-2">What happens to my memorial if I cancel?</h3>
                <p className="text-slate-600">
                  Free memorials remain active forever. Premium memorials remain accessible for 1 year after
                  cancellation.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="font-semibold text-[#1B3B5F] mb-2">Do you offer refunds?</h3>
                <p className="text-slate-600">
                  We offer a 30-day money-back guarantee for Premium subscriptions. Fully Managed services are
                  custom-quoted.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="font-semibold text-[#1B3B5F] mb-2">What's included in Fully Managed?</h3>
                <p className="text-slate-600">
                  Our team creates your memorial from start to finish, including content writing, photo curation, and
                  design consultation.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="font-semibold text-[#1B3B5F] mb-2">Can I create multiple memorials?</h3>
                <p className="text-slate-600">
                  Free accounts are limited to 1 memorial. Premium allows unlimited memorials. Fully Managed is priced
                  per memorial.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="font-semibold text-[#1B3B5F] mb-2">Is my data secure?</h3>
                <p className="text-slate-600">
                  Yes, all memorial data is encrypted and stored securely. We never share personal information with
                  third parties.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
