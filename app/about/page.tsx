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
    detail: "Traditional and contemporary designs crafted for UK cemeteries with thoughtful inscription guidance.",
  },
  {
    title: "Kerb sets & bespoke designs",
    detail: "Complete kerb sets and personalised shapes that reflect the character of each life remembered.",
  },
  {
    title: "Cremation memorials",
    detail: "Gentle options for gardens of remembrance, including tablets, desks, and markers.",
  },
  {
    title: "Heart & children’s memorials",
    detail: "Soft, compassionate designs that speak to enduring love and care.",
  },
  {
    title: "Laser etching & fine lettering",
    detail: "Detailed artwork, portraits, and precise lettering carried out by skilled craftspeople.",
  },
  {
    title: "Granite vases & markers",
    detail: "Considered finishing touches that keep tributes tidy, weather-safe, and beautiful.",
  },
]

const values = [
  {
    icon: <Heart className="h-6 w-6 text-[#1B3B5F]" aria-hidden />,
    title: "Family-run care",
    copy: "Over 25 years supporting families with clear guidance, patient listening, and practical help.",
  },
  {
    icon: <Hammer className="h-6 w-6 text-[#1B3B5F]" aria-hidden />,
    title: "Craft you can see",
    copy: "Memorial masonry completed in trusted UK workshops, using durable stone and careful finishing.",
  },
  {
    icon: <ShieldCheck className="h-6 w-6 text-[#1B3B5F]" aria-hidden />,
    title: "Steady reassurance",
    copy: "Transparent pricing, cemetery liaison, and paperwork support so nothing feels overwhelming.",
  },
  {
    icon: <Users className="h-6 w-6 text-[#1B3B5F]" aria-hidden />,
    title: "Accessible for every generation",
    copy: "Clear language, strong contrast, and calm layouts online and in print so families feel included.",
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
    <div className="bg-[#F5F5F0] text-slate-800">
      <section className="bg-gradient-to-br from-white via-[#F7F8F5] to-[#E8F0F5] border-b border-slate-200/60">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-[#1B3B5F] shadow-sm">
              Sandalwood Memorials · Serving families across the UK
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl font-medium text-[#0f3c5d] leading-tight">
              A calm, caring partner for memorial masonry — and lasting digital remembrance.
            </h1>
            <p className="text-lg sm:text-xl leading-relaxed text-slate-700">
              Our family-run team has guided loved ones for more than two decades, crafting headstones, kerb sets, and
              cremation memorials with patience and respect. Sandalwood Memories extends that care online, giving every
              family a gentle, private space to share stories and photographs.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button asChild className="rounded-full bg-[#1B3B5F] hover:bg-[#16304d] text-white px-6">
                <Link href="/create">
                  Start a digital memorial
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-full border-2 border-[#1B3B5F] text-[#1B3B5F] hover:bg-[#1B3B5F] hover:text-white px-6"
              >
                <Link href="tel:+442030034855">Speak with the team</Link>
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-3xl border border-slate-200 bg-white shadow-md overflow-hidden">
              <div className="relative h-64 sm:h-80">
                <Image
                  src="/elderly-woman-gardening.png"
                  alt="A family member tending to a garden"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
                <div className="p-6 space-y-2">
                  <p className="text-sm font-semibold text-[#1B3B5F]">25+ years</p>
                  <p className="text-sm text-slate-600 leading-relaxed">Family-led memorial masonry and guidance.</p>
                </div>
                <div className="p-6 space-y-2">
                  <p className="text-sm font-semibold text-[#1B3B5F]">UK showrooms</p>
                  <p className="text-sm text-slate-600 leading-relaxed">London head office with support across Oxford, Canterbury, Bristol, Cambridge, and Ashford.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white border-b border-slate-200/60">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-14 lg:py-20 space-y-10">
          <div className="max-w-3xl space-y-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#1B3B5F]">Our story</p>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#0f3c5d]">Rooted in craft, guided by kindness.</h2>
            <p className="text-lg leading-relaxed text-slate-700">
              Sandalwood Memorials began with the simple belief that every family deserves steady, honest support when
              choosing a memorial. We liaise with cemeteries, handle permissions, and shape each stone with care. Online,
              we offer the same reassurance: straightforward controls, private sharing, and accessible design that suits
              every generation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {values.map((value) => (
              <div
                key={value.title}
                className="h-full rounded-2xl border border-slate-200 bg-[#F9FAFB] p-6 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-slate-200">
                    {value.icon}
                  </div>
                  <p className="font-semibold text-[#0f3c5d]">{value.title}</p>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{value.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#F5F5F0] border-b border-slate-200/60">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-14 lg:py-20 space-y-8">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#1B3B5F]">Memorial masonry</p>
            <h3 className="font-serif text-3xl text-[#0f3c5d]">Practical guidance and thoughtful choice.</h3>
            <p className="text-lg text-slate-700 leading-relaxed max-w-4xl">
              Whether you prefer a classic headstone, a bespoke kerb set, or a discreet cremation tablet, we help you
              compare materials, finishes, and cemetery requirements. Everything is explained in plain English with clear
              timelines and pricing.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((service) => (
              <div key={service.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h4 className="text-lg font-semibold text-[#0f3c5d]">{service.title}</h4>
                <p className="mt-3 text-sm text-slate-700 leading-relaxed">{service.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white border-b border-slate-200/60">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-14 lg:py-20 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#1B3B5F]">Digital remembrance</p>
            <h3 className="font-serif text-3xl text-[#0f3c5d]">A private online space that complements the stone.</h3>
            <p className="text-lg text-slate-700 leading-relaxed">
              Sandalwood Memories lets families gather stories, photographs, and tributes alongside the physical memorial.
              You choose who can contribute, keep everything secure, and preserve memories for relatives near and far.
            </p>
            <ul className="space-y-3 text-slate-700">
              <li className="flex items-start gap-3">
                <BookOpen className="mt-1 h-5 w-5 text-[#1B3B5F]" aria-hidden />
                <span>Simple timelines for life stories, key dates, and favourite moments.</span>
              </li>
              <li className="flex items-start gap-3">
                <ShieldCheck className="mt-1 h-5 w-5 text-[#1B3B5F]" aria-hidden />
                <span>Privacy-first controls with invitation-based access for friends and family.</span>
              </li>
              <li className="flex items-start gap-3">
                <Heart className="mt-1 h-5 w-5 text-[#1B3B5F]" aria-hidden />
                <span>Accessible colours, generous type, and a calm layout for all ages.</span>
              </li>
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-[#F9FAFB] p-6 shadow-sm space-y-5">
            <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3">
              <p className="text-sm font-semibold text-[#1B3B5F]">Showrooms & support</p>
              <p className="text-sm text-slate-700 leading-relaxed">
                Head office in Muswell Hill, London, with friendly support across Oxford, Canterbury, Bristol, Cambridge, and
                Ashford. We can arrange home visits where helpful.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {contactPoints.map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#0f3c5d]">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.href ? (
                    <Link href={item.href} className="text-sm text-[#1B3B5F] hover:underline">
                      {item.value}
                    </Link>
                  ) : (
                    <p className="text-sm text-slate-700">{item.value}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild className="rounded-full bg-[#1B3B5F] hover:bg-[#16304d] text-white px-6">
                <Link href="/auth?mode=signup">Create a memorial page</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-full border-2 border-[#1B3B5F] text-[#1B3B5F] hover:bg-[#1B3B5F] hover:text-white px-6"
              >
                <Link href="mailto:info@sandalwoodmemorials.co.uk">Email the team</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#0f3c5d] text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 lg:py-20 flex flex-col lg:flex-row items-center gap-6 lg:gap-10">
          <div className="flex-1 space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-white/80">Here for you</p>
            <h3 className="font-serif text-3xl sm:text-4xl font-medium leading-tight">
              Ready when you are — for the stone, the story, or both.
            </h3>
            <p className="text-lg text-white/90 leading-relaxed">
              Whether you need measured guidance on memorial masonry or a calm digital space to gather tributes, we will
              keep every step clear and kind. Speak to us, or begin your memorial online today.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Button asChild className="rounded-full bg-white text-[#0f3c5d] hover:bg-slate-100 px-6">
              <Link href="tel:+442030034855">Call 020 3003 4855</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-full border-2 border-white text-white hover:bg-white hover:text-[#0f3c5d] px-6"
            >
              <Link href="/create">Start a memorial</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

