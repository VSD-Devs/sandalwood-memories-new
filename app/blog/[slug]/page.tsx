import Link from "next/link"

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const { slug } = params
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
        <Link href="/blog" className="underline underline-offset-4">Blog</Link>
        <span className="px-1">/</span>
        <span className="text-foreground">{slug.replace(/-/g, " ")}</span>
      </nav>

      <article>
        <header className="mb-6">
          <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight capitalize">{slug.replace(/-/g, " ")}</h1>
          <p className="mt-2 text-muted-foreground">Article content coming soon.</p>
        </header>

        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <p>
            This is a placeholder article. Share your draft or confirm we can import text
            from your current site and we will populate this page.
          </p>
        </div>
      </article>
    </main>
  )
}


