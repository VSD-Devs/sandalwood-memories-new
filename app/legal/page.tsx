import Link from "next/link"
import { buildMetadata } from "@/lib/seo"

export const metadata = buildMetadata({
  title: "Legal policies",
  description: "Read the privacy policy, cookie policy, and terms for Sandalwood Memories.",
  path: "/legal",
})

export default function LegalHubPage() {
  const items = [
    { href: "/legal/privacy", title: "Privacy policy", summary: "How we collect, use, and protect your data." },
    { href: "/legal/cookies", title: "Cookie policy", summary: "What cookies we use and how to manage them." },
    { href: "/legal/terms", title: "Terms & conditions", summary: "The rules for using our service." },
  ]

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <header className="mb-8">
        <p className="text-sm text-muted-foreground">Legal</p>
        <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight">Policies & terms</h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Clear, human-friendly policies. Designed to be readable and easy to navigate.
        </p>
      </header>

      <ul className="grid gap-4">
        {items.map((item) => (
          <li key={item.href} className="border rounded-lg p-5 bg-card">
            <h2 className="font-serif text-xl font-semibold">
              <Link href={item.href} className="hover:underline">
                {item.title}
              </Link>
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{item.summary}</p>
            <div className="mt-3">
              <Link href={item.href} className="text-sm underline underline-offset-4">
                Read more
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </main>
  )
}


