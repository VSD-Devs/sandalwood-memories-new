import type { MetadataRoute } from "next"
import { siteUrl } from "@/lib/seo"

const lastModified = new Date()

const routes: Array<{ path: string; changeFrequency?: MetadataRoute.Sitemap[0]["changeFrequency"]; priority?: number }> = [
  { path: "/", changeFrequency: "weekly", priority: 0.9 },
  { path: "/about", changeFrequency: "monthly", priority: 0.7 },
  { path: "/features", changeFrequency: "monthly", priority: 0.7 },
  { path: "/features/guided-storytelling", changeFrequency: "monthly", priority: 0.6 },
  { path: "/features/media-galleries", changeFrequency: "monthly", priority: 0.6 },
  { path: "/features/collaboration", changeFrequency: "monthly", priority: 0.6 },
  { path: "/pricing", changeFrequency: "monthly", priority: 0.7 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.6 },
  { path: "/create", changeFrequency: "weekly", priority: 0.8 },
  { path: "/memorial", changeFrequency: "weekly", priority: 0.6 },
  { path: "/legal", changeFrequency: "yearly", priority: 0.4 },
  { path: "/legal/privacy", changeFrequency: "yearly", priority: 0.5 },
  { path: "/legal/terms", changeFrequency: "yearly", priority: 0.5 },
  { path: "/legal/cookies", changeFrequency: "yearly", priority: 0.5 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map(({ path, changeFrequency, priority }) => ({
    url: `${siteUrl}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }))
}







