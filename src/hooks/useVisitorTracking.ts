'use client'

import { useEffect } from 'react'

// Device detection utilities
function getDeviceType(): string {
  if (typeof window === 'undefined') return 'unknown'
  
  const ua = navigator.userAgent.toLowerCase()
  
  if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
    return 'mobile'
  }
  if (/ipad|tablet|playbook|silk/i.test(ua)) {
    return 'tablet'
  }
  return 'desktop'
}

function getBrowser(): string {
  if (typeof window === 'undefined') return 'unknown'
  
  const ua = navigator.userAgent.toLowerCase()
  
  if (ua.includes('edg/')) return 'edge'
  if (ua.includes('opr/') || ua.includes('opera')) return 'opera'
  if (ua.includes('chrome/') && !ua.includes('edg/')) return 'chrome'
  if (ua.includes('safari/') && !ua.includes('chrome/')) return 'safari'
  if (ua.includes('firefox/')) return 'firefox'
  
  return 'other'
}

function getOS(): string {
  if (typeof window === 'undefined') return 'unknown'
  
  const ua = navigator.userAgent.toLowerCase()
  
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios'
  if (/android/i.test(ua)) return 'android'
  if (/windows/i.test(ua)) return 'windows'
  if (/mac os/i.test(ua)) return 'macos'
  if (/linux/i.test(ua)) return 'linux'
  
  return 'other'
}

function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  
  // Check if we already have a session ID
  let sessionId = sessionStorage.getItem('visitor_session_id')
  
  if (!sessionId) {
    // Generate new session ID
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    sessionStorage.setItem('visitor_session_id', sessionId)
  }
  
  return sessionId
}

// Track visitor session
export async function trackVisitorSession(): Promise<void> {
  if (typeof window === 'undefined') return
  
  const sessionId = getSessionId()
  const deviceType = getDeviceType()
  const browser = getBrowser()
  const os = getOS()
  
  try {
    await fetch('/api/visitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, deviceType, browser, os }),
    })
  } catch (error) {
    console.error('Failed to track visitor session:', error)
  }
}

// Hook to use in components
export function useVisitorTracking() {
  useEffect(() => {
    // Track visitor on mount
    trackVisitorSession()
  }, [])
}

export default useVisitorTracking
