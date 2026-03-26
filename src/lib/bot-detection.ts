/**
 * Bot Detection
 * 
 * WHY: Rate limiting alone doesn't stop bots:
 * - Bots can rotate IPs using proxies
 * - Bots can solve CAPTCHAs using services
 * - Sophisticated bots mimic human behavior
 * 
 * HOW: Multiple layers of detection:
 * 1. Honeypot fields (hidden fields humans don't see)
 * 2. Timing checks (humans take time to fill forms)
 * 3. Request pattern analysis
 * 4. User-Agent validation
 * 
 * WHAT MAKES THIS SMART:
 * - No annoying CAPTCHAs for legitimate users
 * - Invisible to humans, deadly to bots
 * - Multiple detection methods = harder to bypass
 */

import { NextRequest } from 'next/server'

// Minimum time (ms) for a human to fill a form
const MIN_FORM_TIME = 1500 // 1.5 seconds

// Known bot user agent patterns
const BOT_PATTERNS = [
  // Generic bots
  'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget',
  // Headless browsers
  'headless', 'phantomjs', 'selenium', 'puppeteer', 'playwright',
  // Automation tools
  'python-requests', 'python-urllib', 'node-fetch', 'axios',
  'httpclient', 'http_request', 'libwww', 'java/', 'okhttp',
  // Known bad bots
  'scrapy', 'mechanize', 'nikto', 'sqlmap', 'nmap', 'masscan',
]

// Known good bots (search engines) - allow these
const GOOD_BOTS = [
  'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider',
  'yandexbot', 'facebookexternalhit', 'twitterbot', 'linkedinbot',
]

export interface BotDetectionResult {
  isBot: boolean
  confidence: number        // 0-100
  reasons: string[]
  shouldBlock: boolean
}

/**
 * Check if request is from a bot
 */
export function detectBot(request: NextRequest, formData?: Record<string, any>): BotDetectionResult {
  const reasons: string[] = []
  let confidence = 0
  
  // === USER AGENT CHECK ===
  const userAgent = request.headers.get('user-agent') || ''
  const userAgentLower = userAgent.toLowerCase()
  
  // Check for known good bots first
  const isGoodBot = GOOD_BOTS.some(bot => userAgentLower.includes(bot))
  
  if (!isGoodBot) {
    // Check for known bot patterns
    for (const pattern of BOT_PATTERNS) {
      if (userAgentLower.includes(pattern)) {
        reasons.push(`User agent contains "${pattern}"`)
        confidence += 40
        break
      }
    }
    
    // Empty or suspicious user agent
    if (!userAgent || userAgent.length < 10) {
      reasons.push('Missing or suspicious user agent')
      confidence += 30
    }
  }
  
  // === HONEYPOT CHECK ===
  if (formData) {
    // Check honeypot field (should be empty)
    const honeypotField = formData['_hpt'] || formData['website'] || formData['url'] || formData['honeypot']
    if (honeypotField && honeypotField.trim() !== '') {
      reasons.push('Honeypot field was filled')
      confidence += 80 // Almost certainly a bot
    }
    
    // Check form timing (humans take time)
    const formTime = formData['_t'] ? parseInt(formData['_t']) : 0
    const currentTime = Date.now()
    const elapsed = currentTime - formTime
    
    if (formTime > 0 && elapsed < MIN_FORM_TIME) {
      reasons.push('Form submitted too quickly')
      confidence += 30
    }
  }
  
  // === HEADERS CHECK ===
  const acceptLanguage = request.headers.get('accept-language')
  const accept = request.headers.get('accept')
  
  // Real browsers usually send these
  if (!acceptLanguage) {
    reasons.push('Missing Accept-Language header')
    confidence += 15
  }
  
  if (!accept || accept === '*/*') {
    reasons.push('Suspicious Accept header')
    confidence += 10
  }
  
  // === REQUEST PATTERN CHECK ===
  // Check for suspicious referer
  const referer = request.headers.get('referer')
  if (!referer) {
    // No referer is suspicious for form submissions
    if (request.method === 'POST') {
      reasons.push('POST request without referer')
      confidence += 10
    }
  }
  
  // Normalize confidence
  confidence = Math.min(100, confidence)
  
  return {
    isBot: confidence >= 50,
    confidence,
    reasons,
    shouldBlock: confidence >= 70,
  }
}

/**
 * Check honeypot field from request body
 * Use this in API routes
 */
export function checkHoneypot(body: Record<string, any>): { valid: boolean; reason?: string } {
  // Check common honeypot field names
  const honeypotFields = ['_hpt', 'website', 'url', 'honeypot', 'email_confirm', 'fax']
  
  for (const field of honeypotFields) {
    if (body[field] && body[field].trim() !== '') {
      return { 
        valid: false, 
        reason: 'Invalid submission' // Don't tell bots why
      }
    }
  }
  
  // Check timing if provided
  if (body._t) {
    const formTime = parseInt(body._t)
    if (!isNaN(formTime)) {
      const elapsed = Date.now() - formTime
      if (elapsed < MIN_FORM_TIME) {
        return { 
          valid: false, 
          reason: 'Please slow down' // Vague message
        }
      }
    }
  }
  
  return { valid: true }
}

/**
 * Generate honeypot field HTML for forms
 * This creates invisible fields that bots will fill
 */
export function getHoneypotField(): { fieldName: string; html: string } {
  // Use random-looking but consistent field name
  const fieldName = '_hpt'
  
  // CSS that hides from humans but not from bots
  const html = `
    <input 
      type="text" 
      name="${fieldName}" 
      id="${fieldName}"
      style="position: absolute; left: -9999px; width: 1px; height: 1px; opacity: 0; pointer-events: none;"
      tabindex="-1"
      autocomplete="off"
      aria-hidden="true"
    />
  `
  
  return { fieldName, html }
}

/**
 * Generate form timing field
 * Records when form was loaded
 */
export function getTimingField(): { fieldName: string; html: string } {
  const fieldName = '_t'
  const html = `<input type="hidden" name="${fieldName}" value="${Date.now()}" />`
  
  return { fieldName, html }
}

/**
 * Validate that request is from a real browser
 * Use for sensitive operations
 */
export function requireBrowser(request: NextRequest): boolean {
  const userAgent = request.headers.get('user-agent') || ''
  
  // Must have user agent
  if (!userAgent || userAgent.length < 20) {
    return false
  }
  
  // Must look like a browser
  const hasBrowserIndicator = 
    userAgent.includes('Mozilla/') || 
    userAgent.includes('Chrome/') ||
    userAgent.includes('Safari/') ||
    userAgent.includes('Firefox/')
  
  if (!hasBrowserIndicator) {
    return false
  }
  
  return true
}
