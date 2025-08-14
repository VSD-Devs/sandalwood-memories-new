import { promises as fs } from "fs"
import path from "path"
import { addHeadingAnchorsAndExtractToc } from "@/lib/html-toc"

export default async function CookiePolicyPage() {
  const filePath = path.join(process.cwd(), "content", "legal", "cookies.html")
  let html: string | null = null
  try {
    html = await fs.readFile(filePath, "utf8")
  } catch {}

  const processed = html ? addHeadingAnchorsAndExtractToc(html) : null

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <header className="mb-8">
        <p className="text-sm text-muted-foreground">Legal</p>
        <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight">Cookie policy</h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          This page explains what cookies are, which ones we use, and how you can control them.
        </p>
      </header>

      <div className="grid gap-8 md:grid-cols-[1fr_280px]">
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          {processed ? (
            <div dangerouslySetInnerHTML={{ __html: processed.htmlWithIds }} />
          ) : (
            <>
              <details open>
                <summary className="font-semibold">What are cookies?</summary>
                <p>
                  Cookies are small text files placed on your device. They help a website work and
                  remember your preferences.
                </p>
              </details>

              <details>
                <summary className="font-semibold">Types we use</summary>
                <ul>
                  <li>Essential cookies for core functionality</li>
                  <li>Preference cookies for remembering settings</li>
                  <li>Analytics cookies to understand usage (optional)</li>
                </ul>
              </details>

              <details>
                <summary className="font-semibold">How to control cookies</summary>
                <ul>
                  <li>Browser settings to block or delete cookies</li>
                  <li>Our cookie banner to opt in/out of analytics</li>
                </ul>
              </details>

              <div className="mt-8 text-sm text-muted-foreground border rounded-md p-4">
                If you’d like us to mirror your current cookie policy, confirm we can copy the text
                from your site and we’ll replace this content.
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


