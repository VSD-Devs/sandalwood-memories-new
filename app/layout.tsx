import type React from "react"
import type { Metadata } from "next"
import { Merriweather } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { AppStateProvider } from "@/contexts/app-state"
import VerifyBanner from "@/components/verify-banner"
import { Toaster } from "@/components/ui/toaster"
import Footer from "@/components/footer"
import PublicHeader from "@/components/public-header"

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-merriweather",
})

export const metadata: Metadata = {
  title: "Sandalwood Memories - Digital Memorial Platform",
  description: "Create beautiful, personalised memorial pages to honour and celebrate the lives of your loved ones.",
  generator: "v0.app",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Sandalwood Memories",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "Sandalwood Memories",
    "msapplication-tap-highlight": "no",
  },
}

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
  return (
    <html lang="en" className={`${merriweather.variable} antialiased`}>
      <body className="font-sans" suppressHydrationWarning>
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
