import MemorialClient from "@/components/memorial-page.client"

export default async function MemorialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <MemorialClient identifier={id} />
}
