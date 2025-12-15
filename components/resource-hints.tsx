"use client"

import { useEffect } from "react"

export default function ResourceHints() {
  useEffect(() => {
    // Preload critical fonts
    const fontPreloads = [
      { href: "/fonts/Frutiger.ttf", as: "font", type: "font/ttf" },
      { href: "/fonts/Frutiger_bold.ttf", as: "font", type: "font/ttf" },
    ]

    fontPreloads.forEach(({ href, as, type }) => {
      const link = document.createElement("link")
      link.rel = "preload"
      link.href = href
      link.as = as
      link.type = type
      link.crossOrigin = "anonymous"
      document.head.appendChild(link)
    })

    // DNS prefetch for external domains
    const dnsPrefetch = [
      "https://supabase.co",
      "https://public.blob.vercel-storage.com",
    ]

    dnsPrefetch.forEach((href) => {
      const link = document.createElement("link")
      link.rel = "dns-prefetch"
      link.href = href
      document.head.appendChild(link)
    })

    // Preconnect to critical external domains
    const preconnect = ["https://supabase.co"]

    preconnect.forEach((href) => {
      const link = document.createElement("link")
      link.rel = "preconnect"
      link.href = href
      link.crossOrigin = "anonymous"
      document.head.appendChild(link)
    })
  }, [])

  return null
}



