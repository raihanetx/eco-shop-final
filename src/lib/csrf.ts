/**
 * CSRF Protection
 * 
 * WHY: SameSite cookies are NOT enough protection:
 * - SameSite=strict doesn't protect against same-site attacks
 * - Subdomains can still make requests
 * - Some older browsers don't support SameSite
 * 
 * HOW: Double-submit cookie pattern:
 * 1. Server generates CSRF token, sends in response
 * 2. Client includes token in request header
 * 3. Server validates token matches
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'

const CSRF_COOKIE_NAME = 'csrf_token'
const CSRF_HEADER_NAME = 'x-csrf-token'
const CSRF_TOKEN_LENGTH = 32

// Generate a cryptographically secure random token
function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex')
}

// Get CSRF token from cookie
export async function getCsrfTokenFromCookie(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    return cookieStore.get(CSRF_COOKIE_NAME)?.value || null
  } catch {
    return null
  }
}

// Generate and set CSRF token cookie
export async function setCsrfToken(): Promise<string> {
  const token = generateCsrfToken()
  
  try {
    const cookieStore = await cookies()
    const isProduction = process.env.NODE_ENV === 'production'
    
    cookieStore.set(CSRF_COOKIE_NAME, token, {
      httpOnly: true,           // Not accessible via JavaScript
      secure: isProduction,      // HTTPS only in production
      sameSite: 'strict',        // Strictest same-site policy
      maxAge: 60 * 60 * 24,      // 24 hours
      path: '/',
    })
  } catch {
    // Cookie setting might fail in some contexts
  }
  
  return token
}

// Validate CSRF token from request
export async function validateCsrfToken(request: NextRequest): Promise<{ valid: boolean; error?: string }> {
  try {
    // Get token from header (client must send this)
    const headerToken = request.headers.get(CSRF_HEADER_NAME)
    
    // Get token from cookie
    const cookieStore = await cookies()
    const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value
    
    if (!headerToken) {
      return { valid: false, error: 'CSRF token missing from request' }
    }
    
    if (!cookieToken) {
      return { valid: false, error: 'CSRF token missing from cookie' }
    }
    
    // Constant-time comparison to prevent timing attacks
    const headerBuffer = Buffer.from(headerToken, 'hex')
    const cookieBuffer = Buffer.from(cookieToken, 'hex')
    
    if (headerBuffer.length !== cookieBuffer.length) {
      return { valid: false, error: 'Invalid CSRF token' }
    }
    
    const isValid = crypto.timingSafeEqual(headerBuffer, cookieBuffer)
    
    if (!isValid) {
      return { valid: false, error: 'Invalid CSRF token' }
    }
    
    return { valid: true }
  } catch (error) {
    return { valid: false, error: 'CSRF validation failed' }
  }
}

// CSRF error response
export function csrfErrorResponse(error: string = 'CSRF validation failed') {
  return NextResponse.json(
    { success: false, error: 'Security validation failed. Please refresh and try again.' },
    { status: 403 }
  )
}

// Higher-order function to wrap API handlers with CSRF protection
export function withCsrfProtection<T>(
  handler: (request: NextRequest) => Promise<T>
): (request: NextRequest) => Promise<T | NextResponse> {
  return async (request: NextRequest) => {
    const validation = await validateCsrfToken(request)
    
    if (!validation.valid) {
      return csrfErrorResponse(validation.error)
    }
    
    return handler(request)
  }
}

// API endpoint to get CSRF token
export async function getCsrfTokenEndpoint(): Promise<NextResponse> {
  const token = await setCsrfToken()
  
  return NextResponse.json({
    success: true,
    token,
  })
}
