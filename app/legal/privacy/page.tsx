import { promises as fs } from "fs"
import path from "path"
import Link from "next/link"
import { addHeadingAnchorsAndExtractToc } from "@/lib/html-toc"
import { buildMetadata } from "@/lib/seo"

export const metadata = buildMetadata({
  title: "Privacy policy",
  description: "How Sandalwood Memories collects, uses, and protects personal data and memorial content.",
  path: "/legal/privacy",
})

export default async function PrivacyPolicyPage() {
  const filePath = path.join(process.cwd(), "content", "legal", "privacy.html")
  let html: string | null = null
  try {
    html = await fs.readFile(filePath, "utf8")
  } catch {}

  const processed = html ? addHeadingAnchorsAndExtractToc(html) : null

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <header className="mb-8">
        <p className="text-sm text-muted-foreground">Legal</p>
        <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight">Privacy policy</h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          This page explains how we collect, use, store, and protect your personal data.
        </p>
      </header>

      <div className="grid gap-8 md:grid-cols-[1fr_280px]">
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          {processed ? (
            <div dangerouslySetInnerHTML={{ __html: processed.htmlWithIds }} />
          ) : (
          <>
        <details open>
          <summary className="font-semibold">Intro</summary>
          <p>
            Placeholder content. If you have permission to reuse text from your
            existing site, we can import it here; otherwise we will supply fresh,
            clear, and accessible copy.
          </p>
        </details>

        <details>
          <summary className="font-semibold">Data we collect</summary>
          <ul>
            <li>Account and contact information</li>
            <li>Content you upload (e.g., photos, stories, tributes)</li>
            <li>Usage data and diagnostic information</li>
          </ul>
        </details>

        <details>
          <summary className="font-semibold">How we use data</summary>
          <ul>
            <li>To provide and improve our services</li>
            <li>To communicate important updates</li>
            <li>To keep our platform safe and secure</li>
          </ul>
        </details>

        <details>
          <summary className="font-semibold">Your rights</summary>
          <ul>
            <li>Access, correction, deletion</li>
            <li>Portability and objection</li>
            <li>Cookie controls and marketing preferences</li>
          </ul>
        </details>

        <div className="mt-8 text-sm text-muted-foreground border rounded-md p-4">
          Want us to import your existing policy? Confirm permission to copy from your
          site and we will replace this with your official text.
        </div>
          </>
          )}
        </div>
        <aside className="md:sticky md:top-20 h-fit border rounded-lg p-4 bg-card text-sm">
          <div className="font-semibold mb-2">On this page</div>
          {processed && processed.toc.length > 0 ? (
            <ul className="space-y-1">
              {processed.toc.map((item) => (
                <li key={item.id} className={item.level === 3 ? "pl-3" : undefined}>
                  <a href={`#${item.id}`} className="hover:underline">
                    {item.text}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-muted-foreground">Headings will appear here.</div>
          )}
        </aside>
      </div>
    </main>
  )
}


