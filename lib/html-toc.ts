export type TocItem = {
  id: string
  text: string
  level: 2 | 3
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
}

/**
 * Adds ids to h2/h3 headings if missing and returns the updated HTML and a TOC list.
 * This is a simple, dependency-free parser suitable for well-formed policy HTML.
 */
export function addHeadingAnchorsAndExtractToc(html: string): { htmlWithIds: string; toc: TocItem[] } {
  let updated = html
  const toc: TocItem[] = []

  // Match <h2> and <h3> with optional attributes. Non-greedy for inner text.
  const headingRegex = /<h(2|3)([^>]*)>([\s\S]*?)<\/h\1>/gi

  updated = updated.replace(headingRegex, (match, levelStr: string, attrs: string, inner: string) => {
    const level = parseInt(levelStr, 10) as 2 | 3

    // Try to find existing id in attributes
    const idMatch = attrs.match(/id=["']([^"']+)["']/i)
    const rawText = inner.replace(/<[^>]*>/g, "").trim()
    const generatedId = slugify(rawText)
    const id = idMatch?.[1] || generatedId

    // Build the TOC item if we have meaningful text
    if (rawText.length > 0) {
      toc.push({ id, text: rawText, level })
    }

    // Ensure id attribute exists exactly once
    let newAttrs = attrs
    if (!idMatch) {
      newAttrs = `${attrs} id="${id}"`
    }

    return `<h${level}${newAttrs}>${inner}</h${level}>`
  })

  return { htmlWithIds: updated, toc }
}


