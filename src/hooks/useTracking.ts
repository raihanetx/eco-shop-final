'use client'

import { useEffect, useRef, useCallback } from 'react'

// ============================================
// SESSION TRACKING HOOK
// ============================================
// This hook tracks:
// - Session duration (start, heartbeat, end)
// - Page views
// - Bounce rate (based on page views and session duration)
// - Cart actions
// ============================================

interface TrackingOptions {
  sessionId: string
  page?: string
  productId?: number
}

export function useTracking(options: TrackingOptions) {
  const { sessionId, page, productId } = options
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const hasStartedRef = useRef(false)
  const sessionIdRef = useRef(sessionId)

  // Generate or get session ID
  const getOrCreateSessionId = useCallback(() => {
    if (typeof window === 'undefined') return sessionId
    
    let sid = sessionStorage.getItem('analytics_session_id')
    if (!sid) {
      sid = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('analytics_session_id', sid)
    }
    return sid
  }, [sessionId])

  // Track session start
  const trackSessionStart = useCallback(async () => {
    const sid = getOrCreateSessionId()
    
    try {
      await fetch('/api/tracking/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          sessionId: sid,
        }),
      })
    } catch (error) {
      console.error('Failed to track session start:', error)
    }
  }, [getOrCreateSessionId])

  // Track heartbeat (for session duration)
  const trackHeartbeat = useCallback(async () => {
    const sid = getOrCreateSessionId()
    
    try {
      await fetch('/api/tracking/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'heartbeat',
          sessionId: sid,
        }),
      })
    } catch (error) {
      console.error('Failed to track heartbeat:', error)
    }
  }, [getOrCreateSessionId])

  // Track page view
  const trackPageView = useCallback(async (pageName: string, prodId?: number) => {
    const sid = getOrCreateSessionId()
    
    try {
      await fetch('/api/tracking/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'pageview',
          sessionId: sid,
          page: pageName,
          productId: prodId,
          referrer: typeof document !== 'undefined' ? document.referrer : undefined,
        }),
      })
    } catch (error) {
      console.error('Failed to track page view:', error)
    }
  }, [getOrCreateSessionId])

  // Track cart action
  const trackCartAction = useCallback(async (action: 'add' | 'remove') => {
    const sid = getOrCreateSessionId()
    
    try {
      await fetch('/api/tracking/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cart',
          sessionId: sid,
          cartAction: action,
        }),
      })
    } catch (error) {
      console.error('Failed to track cart action:', error)
    }
  }, [getOrCreateSessionId])

  // Track session end
  const trackSessionEnd = useCallback(async () => {
    const sid = getOrCreateSessionId()
    
    try {
      await fetch('/api/tracking/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'end',
          sessionId: sid,
        }),
      })
    } catch (error) {
      console.error('Failed to track session end:', error)
    }
  }, [getOrCreateSessionId])

  // Initialize tracking
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Only start once
    if (hasStartedRef.current) return
    hasStartedRef.current = true

    // Track session start
    trackSessionStart()

    // Track initial page view if provided
    if (page) {
      trackPageView(page, productId)
    }

    // Set up heartbeat interval (every 30 seconds)
    heartbeatIntervalRef.current = setInterval(() => {
      trackHeartbeat()
    }, 30000)

    // Track session end on page unload
    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable delivery on page unload
      const sid = getOrCreateSessionId()
      const data = JSON.stringify({
        action: 'end',
        sessionId: sid,
      })
      
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/tracking/session', data)
      } else {
        // Fallback to synchronous fetch
        fetch('/api/tracking/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: data,
          keepalive: true,
        })
      }
    }

    // Also track on visibility change (mobile browsers)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        trackHeartbeat() // Update last activity before leaving
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      // Cleanup
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
      }
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [page, productId, trackSessionStart, trackPageView, trackHeartbeat, getOrCreateSessionId])

  return {
    trackPageView,
    trackCartAction,
    trackHeartbeat,
    trackSessionEnd,
    sessionId: getOrCreateSessionId(),
  }
}

// ============================================
// SIMPLIFIED TRACKING FOR PRODUCT PAGES
// ============================================
export function useProductTracking(productId: number) {
  return useTracking({
    sessionId: '',
    page: 'product',
    productId,
  })
}

// ============================================
// SIMPLIFIED TRACKING FOR GENERAL PAGES
// ============================================
export function usePageTracking(pageName: string) {
  return useTracking({
    sessionId: '',
    page: pageName,
  })
}

export default useTracking
