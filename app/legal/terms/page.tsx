import { promises as fs } from "fs"
import path from "path"
import { addHeadingAnchorsAndExtractToc } from "@/lib/html-toc"

export default async function TermsPage() {
  const filePath = path.join(process.cwd(), "content", "legal", "terms.html")
  let html: string | null = null
  try {
    html = await fs.readFile(filePath, "utf8")
  } catch {}

  const processed = html ? addHeadingAnchorsAndExtractToc(html) : null

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <header className="mb-8">
        <p className="text-sm text-muted-foreground">Legal</p>
        <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight">Terms & conditions</h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          The rules for using our services. Please read this carefully.
        </p>
      </header>

      <div className="grid gap-8 md:grid-cols-[1fr_280px]">
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          {processed ? (
            <div dangerouslySetInnerHTML={{ __html: processed.htmlWithIds }} />
          ) : (
            <>
              <details open>
                <summary className="font-semibold">Key points</summary>
                <ul>
                  <li>You must be at least 16, or have guardian consent where required</li>
                  <li>Do not upload unlawful, infringing, or harmful content</li>
                  <li>We may update these terms; we’ll notify you of material changes</li>
                </ul>
              </details>

              <details>
                <summary className="font-semibold">Your use of the service</summary>
                <p>
                  Use the platform responsibly. Keep login details safe and respect others’ rights
                  when uploading or sharing content.
                </p>
              </details>

              <details>
                <summary className="font-semibold">Subscriptions & billing</summary>
                <p>
                  If you purchase a subscription, billing is handled securely by our payment provider.
                  You can manage or cancel at any time in your account.
                </p>
              </details>

              <div className="mt-8 text-sm text-muted-foreground border rounded-md p-4">
                Need your official terms here? Confirm permission to copy from your current site and
                we’ll replace this with your formal wording.
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


