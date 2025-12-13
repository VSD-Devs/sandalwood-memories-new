import type { ReactNode } from "react"
import { buildMetadata } from "@/lib/seo"

export const metadata = buildMetadata({
  title: "Pricing",
  description:
    "Transparent memorial pricing. Start free, invite family, and upgrade only when you need more media, QR sharing, or white-glove support.",
  path: "/pricing",
  image: "/qr-scan.png",
})

export default function PricingLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}








