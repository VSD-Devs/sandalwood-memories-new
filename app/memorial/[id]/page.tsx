import { buildMetadata } from "@/lib/seo"
import MemorialClient from "@/components/memorial-page.client"

const humaniseIdentifier = (value: string) =>
  value
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim()

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const readableId = humaniseIdentifier(id)
  const displayTitle = readableId ? `Memorial for ${readableId}` : "Memorial page"
  return buildMetadata({
    title: displayTitle,
    description: "Visit this Sandalwood Memories page to read tributes, stories, and photos shared privately with family.",
    path: `/memorial/${id}`,
  })
}

export default async function MemorialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <MemorialClient identifier={id} />
}
