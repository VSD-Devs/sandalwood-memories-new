import Image from "next/image"
import Link from "next/link"
import { ArrowRight, BookOpen, Hammer, Heart, Mail, MapPin, Phone, ShieldCheck, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { buildMetadata } from "@/lib/seo"

export const metadata = buildMetadata({
  title: "About Sandalwood Memorials",
  description:
    "Meet Sandalwood Memorials — a family-run UK team crafting masonry and calm digital memorial pages so families can honour loved ones with clarity and care.",
  path: "/about",
  image: "/elderly-woman-gardening.png",
})

const services = [
  {
    title: "Headstones & lawn memorials",
    detail: "Timeless designs that stand proud in any cemetery. We help you choose the perfect words and ensure everything meets local guidelines.",
  },
  {
    title: "Kerb sets & bespoke designs",
    detail: "Personalised memorials that reflect unique personalities. From favourite hobbies to family crests, we create something truly individual.",
  },
  {
    title: "Cremation memorials",
    detail: "Peaceful options for gardens of remembrance. Subtle, beautiful markers that provide a gentle place for quiet reflection.",
  },
  {
    title: "Heart & children’s memorials",
    detail: "Tender, compassionate designs that speak of love without words. Soft curves and gentle details for the most precious memories.",
  },
  {
    title: "Laser etching & fine lettering",
    detail: "Intricate artwork and portraits etched with precision. Every letter, every line crafted by hands that understand the importance.",
  },
  {
    title: "Granite vases & markers",
    detail: "Beautiful finishing touches that keep memorials looking cared for. Weather-resistant and designed to last as long as the memories.",
  },
]

const values = [
  {
    icon: <Heart className="h-6 w-6 text-[#1B3B5F]" aria-hidden />,
    title: "Human first, business second",
    copy: "We've been family ourselves, so we know grief doesn't follow a schedule. We take the time to listen, explain, and support you through every step.",
  },
  {
    icon: <Hammer className="h-6 w-6 text-[#1B3B5F]" aria-hidden />,
    title: "Quality you can trust",
    copy: "Every memorial is handcrafted in UK workshops by skilled people who understand that this work matters. We don't rush perfection.",
  },
  {
    icon: <ShieldCheck className="h-6 w-6 text-[#1B3B5F]" aria-hidden />,
    title: "No hidden surprises",
    copy: "Clear pricing, honest timelines, and someone who actually picks up the phone. We'll handle the paperwork so you can focus on remembering.",
  },
  {
    icon: <Users className="h-6 w-6 text-[#1B3B5F]" aria-hidden />,
    title: "Built for everyone",
    copy: "Whether you're 18 or 98, tech-savvy or prefer a good chat, our approach works for all. We speak plainly and design thoughtfully.",
  },
]

const contactPoints = [
  {
    label: "Head office",
    value: "103 Colney Hatch Ln, Muswell Hill, London N10 1LR",
    icon: <MapPin className="h-5 w-5 text-[#1B3B5F]" aria-hidden />,
  },
  {
    label: "Phone",
    value: "020 3003 4855",
    href: "tel:+442030034855",
    icon: <Phone className="h-5 w-5 text-[#1B3B5F]" aria-hidden />,
  },
  {
    label: "Email",
    value: "info@sandalwoodmemorials.co.uk",
    href: "mailto:info@sandalwoodmemorials.co.uk",
    icon: <Mail className="h-5 w-5 text-[#1B3B5F]" aria-hidden />,
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Banner */}
      <section className="relative bg-gradient-to-br from-[#1B3B5F] via-[#16304d] to-[#0f243d] text-white">
        <div className="absolute inset-0 opacity-10">
          <Image
            src="/elderly-woman-gardening.png"
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
              Honouring lives with care — from stone to screen.
            </h1>
            <p className="text-xl sm:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              For over two decades, we've stood by families through their most difficult moments. From crafting beautiful memorials to creating peaceful online spaces, we make remembrance personal and meaningful.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Button
                size="lg"
                className="bg-white text-[#1B3B5F] hover:bg-slate-100 px-8 py-4 text-lg font-medium rounded-full shadow-lg"
                asChild
              >
                <Link href="/create">Start a digital memorial</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white hover:text-[#1B3B5F] px-8 py-4 text-lg font-medium rounded-full"
                asChild
              >
                <Link href="tel:+442030034855">Speak with the team</Link>
              </Button>
            </div>
            <p className="text-sm text-white/70 pt-2">No credit card required</p>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 lg:py-24 bg-[#F5F5F0]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center mb-12 space-y-4">
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#1B3B5F]">
              More than just stone and code
            </h2>
            <p className="text-lg lg:text-xl text-slate-700 max-w-3xl mx-auto leading-relaxed">
              We started with one simple promise: when families need to say goodbye, they shouldn't have to do it alone. Whether it's helping choose the perfect stone or creating a digital space to gather memories, we're here to make the impossible feel possible.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <div
                key={value.title}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md p-6 transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-[#E8F0F5] flex items-center justify-center text-[#1B3B5F] mb-4">
                  {value.icon}
                </div>
                <h3 className="font-serif text-xl font-semibold text-[#1B3B5F] mb-3">
                  {value.title}
                </h3>
                <p className="text-slate-700 leading-relaxed text-sm">{value.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Memorial Masonry */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center mb-12 space-y-4">
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#1B3B5F]">
              Memorials that tell your story
            </h2>
            <p className="text-lg lg:text-xl text-slate-700 max-w-3xl mx-auto leading-relaxed">
              From traditional headstones to contemporary designs, we help you choose what feels right. We'll guide you through materials, explain cemetery rules, and work with you to create something that honours your loved one perfectly.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div key={service.title} className="bg-[#F5F5F0] rounded-3xl p-8 border border-slate-200">
                <h3 className="font-serif text-xl font-semibold text-[#1B3B5F] mb-4">
                  {service.title}
                </h3>
                <p className="text-slate-700 leading-relaxed">{service.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Digital Remembrance */}
      <section className="py-16 lg:py-24 bg-[#F5F5F0]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div>
                <h2 className="font-serif text-3xl lg:text-4xl font-semibold text-[#1B3B5F] mb-4">
                  Memories that live forever online
                </h2>
                <p className="text-lg text-slate-700 leading-relaxed">
                  When the stone can't hold all the stories, our digital memorials step in. Family and friends can share photos, memories, and messages in a peaceful space that stays private and secure. Geography becomes no barrier to remembering together.
                </p>
              </div>

              <div className="space-y-6">
                {[
                  { icon: BookOpen, title: "Life stories unfold", detail: "Timelines that capture milestones, adventures, and the little moments that made them who they were." },
                  { icon: ShieldCheck, title: "Your privacy, your rules", detail: "You control who sees what. Share with close family, invite friends, or keep it completely private." },
                  { icon: Heart, title: "Built for everyone", detail: "Large text, clear navigation, and thoughtful design so grandparents and grandchildren can both feel comfortable." }
                ].map(({ icon: Icon, title, detail }) => (
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

            <div className="relative h-[500px] rounded-3xl overflow-hidden shadow-xl">
              <Image
                src="/elderly-woman-reading.png"
                alt="Digital remembrance"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* Contact & Support */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div>
                <h2 className="font-serif text-3xl lg:text-4xl font-semibold text-[#1B3B5F] mb-4">
                  Here when you need us
                </h2>
                <p className="text-lg text-slate-700 leading-relaxed">
                  Our London office is your home base, but we support families across Oxford, Canterbury, Bristol, Cambridge, and Ashford. Sometimes a home visit or a quiet chat over coffee is exactly what's needed.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {contactPoints.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-slate-200 bg-[#F5F5F0] p-6 flex flex-col gap-3">
                    <div className="flex items-center gap-3 text-[#1B3B5F]">
                      {item.icon}
                      <span className="font-semibold">{item.label}</span>
                    </div>
                    {item.href ? (
                      <Link href={item.href} className="text-slate-700 hover:text-[#1B3B5F] hover:underline transition-colors">
                        {item.value}
                      </Link>
                    ) : (
                      <p className="text-slate-700">{item.value}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#F5F5F0] rounded-3xl p-8 lg:p-12 border border-slate-200">
              <h3 className="font-serif text-2xl font-semibold text-[#1B3B5F] mb-6">
                Ready to begin?
              </h3>
              <p className="text-slate-700 leading-relaxed mb-8">
                Grief has no timeline, and neither do we. Whether you need help with a memorial stone today or want to preserve memories for tomorrow, we're here to support you.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild className="rounded-full bg-[#1B3B5F] hover:bg-[#16304d] text-white px-6 py-3">
                  <Link href="/create">Start a memorial</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-full border-2 border-[#1B3B5F] text-[#1B3B5F] hover:bg-[#1B3B5F] hover:text-white px-6 py-3"
                >
                  <Link href="tel:+442030034855">Call 020 3003 4855</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-[#1B3B5F] via-[#16304d] to-[#0f243d] text-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold">
            Let's honour them together
          </h2>
          <p className="text-lg sm:text-xl text-white/90 leading-relaxed max-w-2xl mx-auto">
            Begin with a free memorial page. Share memories, gather tributes, and create a peaceful space that helps your family heal. We're here every step of the way.
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

