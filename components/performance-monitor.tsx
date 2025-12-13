"use client"

import { useEffect } from 'react'

interface WebVitalsMetric {
  name: string
  value: number
  id: string
  delta: number
}

declare global {
  interface Window {
    webVitals?: {
      onCLS: (callback: (metric: WebVitalsMetric) => void) => void
      onFID: (callback: (metric: WebVitalsMetric) => void) => void
      onFCP: (callback: (metric: WebVitalsMetric) => void) => void
      onLCP: (callback: (metric: WebVitalsMetric) => void) => void
      onTTFB: (callback: (metric: WebVitalsMetric) => void) => void
    }
  }
}

export default function PerformanceMonitor() {
  useEffect(() => {
    // Only run in production and if web-vitals is available
    if (process.env.NODE_ENV !== 'production') return

    // Dynamically import web-vitals to avoid bundle size in development
    import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB }) => {
      // Track Core Web Vitals
      onCLS((metric) => {
        console.log('CLS:', metric)
        sendToAnalytics('CLS', metric)
      })

      onFID((metric) => {
        console.log('FID:', metric)
        sendToAnalytics('FID', metric)
      })

      onFCP((metric) => {
        console.log('FCP:', metric)
        sendToAnalytics('FCP', metric)
      })

      onLCP((metric) => {
        console.log('LCP:', metric)
        sendToAnalytics('LCP', metric)
      })

      onTTFB((metric) => {
        console.log('TTFB:', metric)
        sendToAnalytics('TTFB', metric)
      })
    }).catch((error) => {
      console.warn('Failed to load web-vitals:', error)
    })

    // Track page load performance
    if ('performance' in window && 'getEntriesByType' in window.performance) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
          const paint = window.performance.getEntriesByType('paint')

          if (navigation) {
            const pageLoadTime = navigation.loadEventEnd - navigation.fetchStart
            console.log('Page Load Time:', pageLoadTime, 'ms')
            sendToAnalytics('PageLoadTime', { value: pageLoadTime, name: 'PageLoadTime' } as WebVitalsMetric)
          }

          // Track First Paint and First Contentful Paint
          paint.forEach((entry) => {
            console.log(`${entry.name}:`, entry.startTime, 'ms')
            sendToAnalytics(entry.name, {
              value: entry.startTime,
              name: entry.name,
              id: entry.name,
              delta: entry.startTime
            } as WebVitalsMetric)
          })
        }, 0)
      })
    }
  }, [])

  const sendToAnalytics = async (name: string, metric: WebVitalsMetric) => {
    try {
      // Send to your analytics service
      // For now, we'll just log to console, but you could send to:
      // - Google Analytics 4
      // - Vercel Analytics
      // - Custom analytics endpoint

      const data = {
        name,
        value: metric.value,
        id: metric.id,
        delta: metric.delta,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent
      }

      // Example: Send to custom analytics endpoint
      // await fetch('/api/analytics/web-vitals', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(data)
      // })

      // For development, just log
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Web Vitals] ${name}:`, {
          value: Math.round(metric.value * 100) / 100,
          id: metric.id
        })
      }
    } catch (error) {
      console.warn('Failed to send analytics:', error)
    }
  }

  // This component doesn't render anything
  return null
}