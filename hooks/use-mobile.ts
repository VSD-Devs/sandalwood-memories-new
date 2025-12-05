import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

// Hook for swipe gestures (simplified version for native feel)
export function useSwipeGesture(onSwipeLeft?: () => void, onSwipeRight?: () => void, threshold = 50) {
  const touchStartX = React.useRef<number>(0)
  const touchEndX = React.useRef<number>(0)

  const handleTouchStart = React.useCallback((e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }, [])

  const handleTouchEnd = React.useCallback((e: TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX
    const diff = touchStartX.current - touchEndX.current

    if (Math.abs(diff) > threshold) {
      if (diff > 0 && onSwipeLeft) {
        onSwipeLeft()
      } else if (diff < 0 && onSwipeRight) {
        onSwipeRight()
      }
    }
  }, [onSwipeLeft, onSwipeRight, threshold])

  return { handleTouchStart, handleTouchEnd }
}

// Hook for pull-to-refresh functionality
export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [pullDistance, setPullDistance] = React.useState(0)
  const [startY, setStartY] = React.useState(0)
  const [canRefresh, setCanRefresh] = React.useState(false)

  const handleTouchStart = React.useCallback((e: TouchEvent) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY)
    }
  }, [])

  const handleTouchMove = React.useCallback((e: TouchEvent) => {
    if (startY > 0 && window.scrollY === 0) {
      const currentY = e.touches[0].clientY
      const distance = Math.max(0, currentY - startY)
      setPullDistance(distance)
      setCanRefresh(distance > 80) // Threshold for refresh
    }
  }, [startY])

  const handleTouchEnd = React.useCallback(async () => {
    if (canRefresh && !isRefreshing) {
      setIsRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
      }
    }
    setPullDistance(0)
    setStartY(0)
    setCanRefresh(false)
  }, [canRefresh, isRefreshing, onRefresh])

  return {
    isRefreshing,
    pullDistance,
    canRefresh,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  }
}

// Hook for viewport-based animations (Intersection Observer)
export function useInView(threshold = 0.1, triggerOnce = true) {
  const [isInView, setIsInView] = React.useState(false)
  const [hasTriggered, setHasTriggered] = React.useState(false)
  const ref = React.useRef<HTMLElement>(null)

  React.useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        const inView = entry.isIntersecting
        setIsInView(inView)

        if (inView && triggerOnce && !hasTriggered) {
          setHasTriggered(true)
        }
      },
      { threshold }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [threshold, triggerOnce, hasTriggered])

  return { ref, isInView: triggerOnce ? hasTriggered : isInView }
}
