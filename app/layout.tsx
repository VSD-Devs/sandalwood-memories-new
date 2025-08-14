import type React from "react"
import type { Metadata } from "next"
import { Merriweather } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { AppStateProvider } from "@/contexts/app-state"
import BottomNav from "@/components/bottom-nav"
import VerifyBanner from "@/components/verify-banner"
import { Toaster } from "@/components/ui/toaster"
import Footer from "@/components/footer"

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
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${merriweather.variable} antialiased`}>
      <body className="font-sans">
        <AuthProvider>
          <AppStateProvider>
            <VerifyBanner />
            {children}
            <Footer />
            <BottomNav />
            <Toaster />
          </AppStateProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
