import Link from "next/link"
import { buildMetadata } from "@/lib/seo"

export const metadata = buildMetadata({
  title: "Blog",
  description: "Updates, guidance, and stories from Sandalwood Memories. Calm, readable posts to help you share memories well.",
  path: "/blog",
})

export default function BlogPage() {
  const categories = [
    { slug: "product", name: "Product updates" },
    { slug: "guides", name: "Guides" },
    { slug: "stories", name: "Stories" },
    { slug: "news", name: "News" },
  ]

  const featured = [
    {
      slug: "coming-soon",
      title: "Our journal is coming soon",
      summary:
        "Thoughtfully written updates, guidance on creating memorials, and stories that celebrate life.",
      category: "News",
    },
  ]

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <header className="mb-8">
        <p className="text-sm text-muted-foreground">Journal</p>
        <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight">Blog</h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Short, readable articles. No fuss, no distractions.
        </p>
      </header>

      <nav aria-label="Categories" className="mb-8">
        <ul className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/blog?category=${c.slug}`}
                className="border rounded-full px-3 py-1 text-sm hover:bg-muted transition-none"
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <section aria-label="Featured articles" className="grid gap-6 md:grid-cols-2">
        {featured.map((post) => (
          <article key={post.slug} className="border rounded-lg p-5 bg-card">
            <div className="text-xs text-muted-foreground mb-1">{post.category}</div>
            <h2 className="font-serif text-xl font-semibold">
              <Link href={`/blog/${post.slug}`} className="hover:underline">
                {post.title}
              </Link>
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{post.summary}</p>
          </article>
        ))}
      </section>

      <section className="mt-10">
        <div className="border rounded-md p-4 text-sm text-muted-foreground">
          Want your existing articles here? Share the text or confirm we can import
          content from your site, and we’ll populate these pages.
        </div>
      </section>
    </main>
  )
}


