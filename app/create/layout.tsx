import type { ReactNode } from "react"
import { buildMetadata } from "@/lib/seo"

export const metadata = buildMetadata({
  title: "Create a memorial",
  description: "Create a free digital memorial page in minutes with guided steps, clear privacy controls, and accessible design.",
  path: "/create",
  image: "/flowers.png",
})

export default function CreateLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}









