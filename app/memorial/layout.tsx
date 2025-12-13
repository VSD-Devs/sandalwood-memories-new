import type { ReactNode } from "react"
import { buildMetadata } from "@/lib/seo"

export const metadata = buildMetadata({
  title: "Memorial pages",
  description: "Visit or manage memorial pages on Sandalwood Memories. Private, invite-only spaces for family stories, photos, and tributes.",
  path: "/memorial",
})

export default function MemorialLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}







