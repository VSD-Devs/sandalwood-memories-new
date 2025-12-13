import type React from "react"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { AppStateProvider } from "@/contexts/app-state"
import VerifyBanner from "@/components/verify-banner"
import { Toaster } from "@/components/ui/toaster"
import Footer from "@/components/footer"
import PublicHeader from "@/components/public-header"
import ResourceHints from "@/components/resource-hints"
import Script from "next/script"
import { buildMetadata, siteName, siteUrl } from "@/lib/seo"

export const metadata = buildMetadata({
  title: "Digital memorial platform",
  description:
    "Create beautiful, private memorial pages with Sandalwood Memories. Invite family, collect stories, and share photos with accessible, UK-friendly design.",
  path: "/",
})

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: siteName,
        url: siteUrl,
        logo: `${siteUrl}/logo.png`,
        contactPoint: [
          {
            "@type": "ContactPoint",
            contactType: "customer service",
            telephone: "+44 20 3003 4855",
            areaServed: "GB",
            availableLanguage: "English",
          },
        ],
      },
      {
        "@type": "WebSite",
        name: siteName,
        url: siteUrl,
      },
    ],
  }

  return (
    <html lang="en-GB" className="antialiased">
      <body className="font-sans" suppressHydrationWarning>
        <ResourceHints />
        <Script id="structured-data" type="application/ld+json" strategy="afterInteractive">
          {JSON.stringify(structuredData)}
        </Script>
        <AuthProvider>
          <AppStateProvider>
            <PublicHeader />
            <VerifyBanner />
            {children}
            <Footer />
            <Toaster />
          </AppStateProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
