import type { ReactNode } from "react"
import { buildMetadata } from "@/lib/seo"

export const metadata = buildMetadata({
  title: "Features",
  description:
    "Explore Sandalwood Memories features: guided storytelling, private invitations, QR sharing, and accessible, British-friendly design for every memorial.",
  path: "/features",
  image: "/family-gathering-dinner.png",
})

export default function FeaturesLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}





