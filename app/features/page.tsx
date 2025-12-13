"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Sparkles,
  BookText,
  Image as ImageIcon,
  Users,
  Shield,
  Share2,
  Lock,
  MapPin,
  Calendar,
  Heart,
  Quote
} from "lucide-react"

const featurePillars = [
  {
    title: "Guided storytelling",
    icon: BookText,
    description: "Shape a calm biography with prompts, milestones, and gentle wording support when it is hard to start.",
    bullets: [
      "Timeline cards for key moments and dates",
      "Audio notes and captions for every memory",
      "Helpful suggestions so you never face a blank box"
    ]
  },
  {
    title: "Media that feels personal",
    icon: ImageIcon,
    description: "Photos, video, and audio display clearly on any screen so every face and place is easy to see.",
    bullets: [
      "Balanced layouts that honour portrait and landscape shots",
      "Alt-text nudges to keep the page accessible",
      "Downloads and originals stay protected"
    ]
  },
  {
    title: "Invite-only collaboration",
    icon: Users,
    description: "Share with the people who matter most. Everyone can add memories without the worry of a public feed.",
    bullets: [
      "Private invites with simple accept links",
      "Roles for owners, editors, and gentle viewers",
      "Notes and updates that keep the family aligned"
    ]
  }
]

const journey = [
  { title: "Start gently", detail: "Pick a cover image, add a few dates, and set the tone in minutes." },
  { title: "Invite your circle", detail: "Send private invitations so family and friends can contribute safely." },
  { title: "Collect the memories", detail: "Stories, photos, and audio arrive in one calm place—no clutter or ads." },
  { title: "Keep it living", detail: "Return whenever you like to organise, add context, or print a keepsake." }
]

const care = [
  { title: "Private by default", detail: "Memorials stay invite-only unless you choose to share.", icon: Lock },
  { title: "Securely stored", detail: "Backed by modern encryption and careful data handling.", icon: Shield },
  { title: "Share with ease", detail: "Clean links and QR codes for services, programmes, and gatherings.", icon: Share2 }
]

const highlights = [
  { title: "Takes minutes to set up", icon: Calendar },
  { title: "Designed for mobiles first", icon: MapPin },
  { title: "Accessible colour palette", icon: Shield }
]

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      <section className="relative pt-16 pb-14 bg-gradient-to-b from-[#F5F5F0] via-white to-[#F5F5F0]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-4xl space-y-6 text-center mx-auto">
            <Badge className="inline-flex items-center gap-2 bg-[#E8F0F5] text-[#1B3B5F] border-[#C7D6E2] px-4 py-2 rounded-full">
              <Sparkles className="w-4 h-4" />
              Features crafted for calm remembrance
            </Badge>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-semibold text-[#1B3B5F] leading-tight">
              Modern tools to honour every memory
            </h1>
            <p className="text-lg sm:text-xl text-slate-700 max-w-3xl mx-auto leading-relaxed">
              We borrow the same gentle feel as our landing page—serene colours, generous spacing, and clear type—so every feature
              feels welcoming on mobile or desktop.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="bg-[#1B3B5F] hover:bg-[#16304d] text-white px-8 py-4 text-lg font-medium rounded-full" asChild>
                <Link href="/create">Start a free memorial</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-[#1B3B5F] text-[#1B3B5F] hover:bg-[#1B3B5F] hover:text-white px-8 py-4 text-lg font-medium rounded-full"
                asChild
              >
                <Link href="/pricing">See pricing</Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {highlights.map(({ title, icon: Icon }) => (
                <div
                  key={title}
                  className="flex items-center justify-center gap-3 rounded-2xl bg-white border border-slate-200 px-4 py-3"
                >
                  <Icon className="w-5 h-5 text-[#1B3B5F]" />
                  <span className="text-sm font-medium text-[#1B3B5F]">{title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-16 lg:py-20 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            <div className="lg:col-span-5">
              <Card className="bg-[#F5F5F0] border border-slate-200 rounded-3xl overflow-hidden">
                <div className="relative h-80">
                  <Image
                    src="/elderly-woman-reading.png"
                    alt="Calm memorial example"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    priority
                  />
                </div>
                <CardHeader className="space-y-2">
                  <CardTitle className="font-serif text-2xl text-[#1B3B5F]">Built for thoughtful stories</CardTitle>
                  <CardDescription className="text-slate-700">
                    Use structure without losing warmth. Everything is mobile-first, with type and colours that stay readable for every age.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
            <div className="lg:col-span-7 space-y-6">
              {featurePillars.map(({ title, description, bullets, icon: Icon }) => (
                <Card key={title} className="rounded-2xl border border-slate-200 shadow-sm bg-[#F9FBFC]">
                  <CardHeader className="flex flex-row items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#1B3B5F]">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="font-serif text-xl text-[#1B3B5F]">{title}</CardTitle>
                      <CardDescription className="text-slate-700">{description}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    {bullets.map((item) => (
                      <p key={item} className="text-slate-700 text-base leading-relaxed">
                        • {item}
                      </p>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-16 lg:py-20 bg-[#F5F5F0]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-10 space-y-4">
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1B3B5F]">A calm journey from start to share</h2>
            <p className="text-lg text-slate-700 max-w-3xl mx-auto">
              Each step mirrors the gentle feel of our landing page, keeping the flow clear for every visitor.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {journey.map(({ title, detail }) => (
              <Card key={title} className="rounded-2xl border border-slate-200 bg-white shadow-sm h-full">
                <CardHeader>
                  <CardTitle className="font-serif text-xl text-[#1B3B5F]">{title}</CardTitle>
                  <CardDescription className="text-slate-700">{detail}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-16 lg:py-20 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid lg:grid-cols-3 gap-8">
            <Card className="rounded-3xl border border-slate-200 bg-[#F5F5F0] shadow-sm">
              <CardHeader className="space-y-3">
                <CardTitle className="font-serif text-2xl text-[#1B3B5F]">Care and protection</CardTitle>
                <CardDescription className="text-slate-700">
                  Privacy sits beside usability. We keep controls straightforward and readable so you never worry who can see a memory.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {care.map(({ title, detail, icon: Icon }) => (
                  <div key={title} className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#1B3B5F]">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[#1B3B5F] font-semibold">{title}</p>
                      <p className="text-slate-700 text-sm leading-relaxed">{detail}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="relative h-64">
                <Image
                  src="/family-gathering-dinner.png"
                  alt="Family gathered around a table"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
              <CardContent className="space-y-3 pt-6">
                <p className="text-[#1B3B5F] font-serif text-xl">Ready for family gatherings</p>
                <p className="text-slate-700">
                  QR codes and share links look clean on programmes, headstones, and service screens. Nobody needs an account to view,
                  but you stay in charge of who can add more.
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border border-slate-200 bg-[#F5F5F0] shadow-sm">
              <CardHeader className="space-y-3">
                <CardTitle className="font-serif text-2xl text-[#1B3B5F]">Words from a family</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[#1B3B5F]">
                    <Heart className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[#1B3B5F] font-semibold">Margaret’s family</p>
                    <p className="text-slate-600 text-sm">Manchester, United Kingdom</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Quote className="w-6 h-6 text-[#4A90A4]" />
                  <p className="text-slate-700 leading-relaxed">
                    “We set this up on a Sunday afternoon. Within an hour, cousins in three cities added photos and stories we had
                    never seen. It feels like a calm sitting room for our memories.”
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-br from-[#1B3B5F] via-[#16304d] to-[#0f243d] text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold">Ready to honour their memory?</h2>
            <p className="text-lg sm:text-xl text-slate-100/90 leading-relaxed">
              Start free, keep control of privacy, and build a place your family will return to with ease.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="bg-white text-[#1B3B5F] hover:bg-slate-100 px-8 py-4 text-lg font-medium rounded-full" asChild>
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
          </div>
        </div>
      </section>
    </div>
  )
}