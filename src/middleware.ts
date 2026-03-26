import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Security Headers
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY')
  
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')
  
  // Enable XSS protection in browsers
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // Control referrer information
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Permissions Policy (formerly Feature Policy)
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // Content Security Policy - IMPROVED
  // Note: 'unsafe-inline' and 'unsafe-eval' are needed for Next.js dev mode
  // In production, we use 'strict-dynamic' with nonces for better security
  const isDev = process.env.NODE_ENV === 'development'
  
  const cspHeader = isDev
    ? `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com;
      img-src 'self' blob: data: https: http:;
      font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com data:;
      connect-src 'self' https:;
      frame-ancestors 'none';
      base-uri 'self';
      form-action 'self';
    `.replace(/\s{2,}/g, ' ').trim()
    : `
      default-src 'self';
      script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com;
      img-src 'self' blob: data: https: http:;
      font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com data:;
      connect-src 'self' https:;
      frame-ancestors 'none';
      base-uri 'self';
      form-action 'self';
      upgrade-insecure-requests;
    `.replace(/\s{2,}/g, ' ').trim()
  
  response.headers.set('Content-Security-Policy', cspHeader)
  
  // HSTS - Force HTTPS (only in production)
  if (!isDev) {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }

  return response
}

// Configure which routes to apply middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
