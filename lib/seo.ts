import type { Metadata } from "next"

const rawSiteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://sandalwoodmemories.com").trim()
export const siteUrl = rawSiteUrl.endsWith("/") ? rawSiteUrl.slice(0, -1) : rawSiteUrl

export const siteName = "Sandalwood Memories"
export const defaultDescription =
  "Create calm, private digital memorial pages with Sandalwood Memories. Invite family, gather stories, and share photos with accessible, UK-friendly design."

const defaultImagePath = "/memorial-field.png"

const baseMetadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: `${siteName} | Digital memorial pages`,
  description: defaultDescription,
  applicationName: siteName,
  generator: "Next.js",
  keywords: [
    "digital memorial",
    "online memorial",
    "tribute page",
    "memorial website",
    "private memorial",
    "family remembrance",
  ],
  alternates: { canonical: siteUrl },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: siteUrl,
    siteName,
    title: `${siteName} | Digital memorial pages`,
    description: defaultDescription,
    images: [
      {
        url: `${siteUrl}${defaultImagePath}`,
        width: 1200,
        height: 630,
        alt: `${siteName} social image`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} | Digital memorial pages`,
    description: defaultDescription,
    images: [`${siteUrl}${defaultImagePath}`],
  },
  robots: { index: true, follow: true },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: siteName,
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": siteName,
    "msapplication-tap-highlight": "no",
  },
}

type BuildMetadataOptions = {
  title?: string
  description?: string
  path?: string
  image?: string
}

const normalisePath = (path?: string) => {
  if (!path) return ""
  if (path === "/") return ""
  return path.startsWith("/") ? path : `/${path}`
}

export function buildMetadata(options: BuildMetadataOptions = {}): Metadata {
  const { title, description, path, image } = options
  const resolvedTitle = title ? `${title} | ${siteName}` : (baseMetadata.title as string)
  const resolvedDescription = description || baseMetadata.description
  const canonicalPath = normalisePath(path)
  const canonicalUrl = `${siteUrl}${canonicalPath}`
  const imageUrl = image
    ? image.startsWith("http")
      ? image
      : `${siteUrl}${image}`
    : `${siteUrl}${defaultImagePath}`

  return {
    ...baseMetadata,
    title: resolvedTitle,
    description: resolvedDescription,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      ...baseMetadata.openGraph,
      url: canonicalUrl,
      title: resolvedTitle,
      description: resolvedDescription,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${siteName} social image`,
        },
      ],
    },
    twitter: {
      ...baseMetadata.twitter,
      title: resolvedTitle,
      description: resolvedDescription,
      images: [imageUrl],
    },
  }
}







