"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { ImageIcon, Loader2 } from "lucide-react"

interface LazyImageProps {
  src: string
  alt: string
  className?: string
  placeholderClassName?: string
  onLoad?: () => void
  onError?: () => void
  sizes?: string
  priority?: boolean
}

export default function LazyImage({
  src,
  alt,
  className = "",
  placeholderClassName = "",
  onLoad,
  onError,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  priority = false
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const [hasError, setHasError] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    // If priority is set, load immediately
    if (priority) {
      setIsInView(true)
      return
    }

    const element = containerRef.current
    if (!element) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observerRef.current?.disconnect()
          }
        })
      },
      {
        rootMargin: '50px', // Start loading 50px before the image comes into view
        threshold: 0.1
      }
    )

    observerRef.current.observe(element)

    return () => {
      observerRef.current?.disconnect()
    }
  }, [priority])

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setHasError(true)
    onError?.()
  }

  // Check if src is a relative path (local image) or external URL
  const isExternal = src.startsWith('http://') || src.startsWith('https://')
  
  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Placeholder/Loading state */}
      {!isLoaded && !hasError && (
        <div className={`absolute inset-0 flex items-center justify-center bg-muted z-10 ${placeholderClassName}`}>
          {isInView ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : (
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className={`absolute inset-0 flex items-center justify-center bg-muted z-10 ${placeholderClassName}`}>
          <div className="text-center text-muted-foreground">
            <ImageIcon className="h-8 w-8 mx-auto mb-2" />
            <span className="text-sm">Failed to load</span>
          </div>
        </div>
      )}

      {/* Actual image - use Next.js Image for optimization */}
      {isInView && (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className={`object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? "eager" : "lazy"}
          quality={85}
          unoptimized={isExternal && !src.includes('supabase.co') && !src.includes('vercel-storage.com')}
        />
      )}
    </div>
  )
}