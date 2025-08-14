"use client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Star, Crown, Heart, Clock } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"

const pricingTiers = [
  {
    name: "Free",
    price: "£0",
    period: "forever",
    description: "Perfect for creating a simple memorial",
    icon: Heart,
    features: [
      "Create 1 memorial page",
      "Upload up to 10 photos",
      "Basic timeline (5 events)",
      "QR code generation",
      "Community support",
    ],
    limitations: ["Limited to 10MB total media storage", "Basic customization options", "Watermarked QR codes"],
    cta: "Start Free",
    popular: false,
    color: "rose",
    planId: "free",
    available: true,
  },
  {
    name: "Premium",
    price: "£99",
    period: "per year",
    description: "Enhanced features for meaningful memorials",
    icon: Star,
    features: [
      "Unlimited memorial pages",
      "Upload up to 500 photos per memorial",
      "Unlimited timeline events",
      "Premium QR codes (no watermark)",
      "Video uploads (up to 2GB per memorial)",
      "Custom memorial themes",
      "Priority email support",
      "Advanced sharing options",
    ],
    limitations: [],
    cta: "Coming Soon",
    popular: true,
    color: "amber",
    planId: "premium",
    available: false,
  },
  {
    name: "Fully Managed",
    price: "£250",
    period: "per memorial",
    description: "Complete memorial creation service",
    icon: Crown,
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
    limitations: [],
    cta: "Coming Soon",
    popular: false,
    color: "slate",
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
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50">
      {/* Header */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-gray-900 mb-6">Choose Your Memorial Plan</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Honor your loved ones with dignity and create lasting memories that celebrate their life story. From simple
            tributes to comprehensive memorial services.
          </p>
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 text-amber-800">
              <Clock className="w-5 h-5" />
              <span className="font-medium">Premium plans launching soon! Start with our free plan today.</span>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {pricingTiers.map((tier, index) => {
            const IconComponent = tier.icon
            return (
              <Card
                key={tier.name}
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-2xl ${
                  tier.popular ? "ring-2 ring-amber-400 shadow-xl scale-105" : "hover:shadow-lg"
                } ${!tier.available ? "opacity-75" : ""}`}
              >
                {tier.popular && <Badge className="absolute top-4 right-4 bg-amber-500 text-white">Most Popular</Badge>}
                {!tier.available && <Badge className="absolute top-4 left-4 bg-gray-500 text-white">Coming Soon</Badge>}

                <CardHeader className="text-center pb-8">
                  <div
                    className={`w-16 h-16 mx-auto mb-4 rounded-full bg-${tier.color}-100 flex items-center justify-center`}
                  >
                    <IconComponent className={`w-8 h-8 text-${tier.color}-600`} />
                  </div>
                  <CardTitle className="text-2xl font-serif">{tier.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">{tier.price}</span>
                    <span className="text-gray-600 ml-2">/{tier.period}</span>
                  </div>
                  <CardDescription className="mt-2 text-base">{tier.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Features */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">What's included:</h4>
                    <ul className="space-y-2">
                      {tier.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Limitations */}
                  {tier.limitations.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-600 mb-3">Limitations:</h4>
                      <ul className="space-y-2">
                        {tier.limitations.map((limitation, limitIndex) => (
                          <li key={limitIndex} className="flex items-start gap-3">
                            <div className="w-5 h-5 mt-0.5 flex-shrink-0">
                              <div className="w-2 h-2 bg-gray-400 rounded-full mt-1.5 mx-auto"></div>
                            </div>
                            <span className="text-gray-600 text-sm">{limitation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pt-6">
                  <Button
                    onClick={() => handlePlanSelect(tier.planId)}
                    disabled={!tier.available}
                    className={`w-full py-3 text-lg font-semibold transition-all duration-200 ${
                      !tier.available
                        ? "bg-gray-400 cursor-not-allowed"
                        : tier.popular
                          ? "bg-amber-600 hover:bg-amber-700 text-white shadow-lg hover:shadow-xl"
                          : tier.name === "Free"
                            ? "bg-rose-600 hover:bg-rose-700 text-white"
                            : "bg-slate-700 hover:bg-slate-800 text-white"
                    }`}
                  >
                    {tier.cta}
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-24 max-w-4xl mx-auto">
          <h2 className="text-3xl font-serif font-bold text-center text-gray-900 mb-12">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">When will Premium plans be available?</h3>
                <p className="text-gray-600">
                  Premium and Fully Managed plans are launching soon. Start with our free plan and we'll notify you when
                  upgrades are available.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">What happens to my memorial if I cancel?</h3>
                <p className="text-gray-600">
                  Free memorials remain active forever. Premium memorials remain accessible for 1 year after
                  cancellation.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Do you offer refunds?</h3>
                <p className="text-gray-600">
                  We offer a 30-day money-back guarantee for Premium subscriptions. Fully Managed services are
                  custom-quoted.
                </p>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">What's included in Fully Managed?</h3>
                <p className="text-gray-600">
                  Our team creates your memorial from start to finish, including content writing, photo curation, and
                  design consultation.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Can I create multiple memorials?</h3>
                <p className="text-gray-600">
                  Free accounts are limited to 1 memorial. Premium allows unlimited memorials. Fully Managed is priced
                  per memorial.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Is my data secure?</h3>
                <p className="text-gray-600">
                  Yes, all memorial data is encrypted and stored securely. We never share personal information with
                  third parties.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24 text-center bg-gradient-to-r from-rose-600 to-amber-600 rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-serif font-bold mb-4">Ready to Honor Their Memory?</h2>
          <p className="text-xl mb-8 opacity-90">
            Start creating a beautiful memorial today and preserve their legacy forever.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="text-lg px-8 py-3"
              onClick={() => handlePlanSelect("free")}
            >
              Start Free Memorial
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-3 border-white text-white hover:bg-white hover:text-gray-900 bg-transparent"
              onClick={() => router.push("/memorial/demo")}
            >
              View Examples
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
