"use client"

import { useState, useRef, useEffect } from "react"
import { Video, Loader2 } from "lucide-react"

interface LazyVideoProps {
  src: string
  className?: string
  placeholderClassName?: string
  muted?: boolean
  playsInline?: boolean
  controls?: boolean
  autoPlay?: boolean
  onLoad?: () => void
  onError?: () => void
}

export default function LazyVideo({
  src,
  className = "",
  placeholderClassName = "",
  muted = true,
  playsInline = true,
  controls = false,
  autoPlay = false,
  onLoad,
  onError
}: LazyVideoProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const [hasError, setHasError] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    const element = videoRef.current
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
        rootMargin: '100px', // Start loading 100px before the video comes into view (videos are heavier)
        threshold: 0.1
      }
    )

    observerRef.current.observe(element)

    return () => {
      observerRef.current?.disconnect()
    }
  }, [])

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setHasError(true)
    onError?.()
  }

  return (
    <div className={`relative ${className}`}>
      {/* Placeholder/Loading state */}
      {!isLoaded && !hasError && (
        <div className={`absolute inset-0 flex items-center justify-center bg-gray-900 ${placeholderClassName}`}>
          {isInView ? (
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          ) : (
            <div className="flex items-center justify-center text-white">
              <Video className="h-8 w-8" />
            </div>
          )}
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className={`absolute inset-0 flex items-center justify-center bg-gray-900 ${placeholderClassName}`}>
          <div className="text-center text-white">
            <Video className="h-8 w-8 mx-auto mb-2" />
            <span className="text-sm">Failed to load video</span>
          </div>
        </div>
      )}

      {/* Actual video */}
      {isInView && (
        <video
          ref={videoRef}
          src={src}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          muted={muted}
          playsInline={playsInline}
          controls={controls}
          autoPlay={autoPlay}
          onLoadedData={handleLoad}
          onError={handleError}
          preload="metadata"
        />
      )}

      {/* Intersection observer target (invisible) */}
      {!isInView && (
        <div
          ref={videoRef}
          className={`absolute inset-0 bg-gray-900 ${className}`}
          aria-hidden="true"
        />
      )}
    </div>
  )
}
