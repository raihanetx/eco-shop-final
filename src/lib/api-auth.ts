/**
 * API Authentication Utilities
 * Use these to protect write operations in API routes
 * 
 * SECURITY: Requires SESSION_SECRET environment variable
 * No hardcoded fallbacks!
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'

const SESSION_COOKIE = 'admin_session'

// Cache the secret key after first retrieval
let _cachedSecret: string | null = null

/**
 * Get the session secret - MUST be configured in environment
 * No fallback to hardcoded values!
 */
async function getSessionSecret(): Promise<string> {
  // Return cached if available
  if (_cachedSecret) return _cachedSecret
  
  const envSecret = process.env.SESSION_SECRET
  
  if (!envSecret || envSecret.length < 32) {
    throw new Error(
      '❌ SESSION_SECRET not configured or too short (min 32 chars).\n' +
      'Please set SESSION_SECRET in your .env file.\n' +
      'Example: SESSION_SECRET=your-very-long-random-string-at-least-32-characters'
    )
  }
  
  _cachedSecret = envSecret
  return envSecret
}

// Get secret key for JWT operations
async function getSecretKey(): Promise<Uint8Array> {
  const secret = await getSessionSecret()
  return new TextEncoder().encode(secret)
}

// Verify session token
export async function verifyApiSession(token: string): Promise<{ username: string; role: string } | null> {
  try {
    const key = await getSecretKey()
    const { payload } = await jwtVerify(token, key)
    return payload as { username: string; role: string }
  } catch {
    return null
  }
}

// Check if request is authenticated
export async function isApiAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE)?.value
    if (!token) return false
    
    const session = await verifyApiSession(token)
    return session !== null
  } catch {
    return false
  }
}

// Get current session for API routes
export async function getApiSession(): Promise<{ username: string; role: string } | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE)?.value
    if (!token) return null
    
    return await verifyApiSession(token)
  } catch {
    return null
  }
}

// Authentication error response
export function authErrorResponse() {
  return NextResponse.json(
    { success: false, error: 'Unauthorized - Please login first' },
    { status: 401 }
  )
}

// Higher-order function to protect API handlers
export async function withAuth<T>(
  handler: () => Promise<T>
): Promise<T | NextResponse> {
  const authenticated = await isApiAuthenticated()
  if (!authenticated) {
    return authErrorResponse()
  }
  return handler()
}

// Check if request is from admin (for protected routes)
export async function requireAuth(): Promise<{ authenticated: boolean; session?: { username: string; role: string } }> {
  try {
    const session = await getApiSession()
    if (session) {
      return { authenticated: true, session }
    }
    return { authenticated: false }
  } catch {
    return { authenticated: false }
  }
}

/**
 * Protect an API handler with authentication
 * Returns auth error if not authenticated, otherwise runs the handler
 */
export async function protectApiRoute<T>(
  handler: () => Promise<T>
): Promise<T | NextResponse> {
  const auth = await requireAuth()
  if (!auth.authenticated) {
    return authErrorResponse()
  }
  return handler()
}
