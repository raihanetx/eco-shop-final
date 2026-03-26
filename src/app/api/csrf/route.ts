/**
 * CSRF Token API
 * 
 * GET: Get a new CSRF token
 * 
 * HOW TO USE:
 * 1. Call GET /api/csrf to get a token
 * 2. Include token in request headers as X-CSRF-Token
 * 3. Server validates token before processing request
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCsrfTokenEndpoint, validateCsrfToken, csrfErrorResponse } from '@/lib/csrf'

// GET /api/csrf - Get CSRF token
export async function GET() {
  return getCsrfTokenEndpoint()
}

// POST /api/csrf - Validate CSRF token (for testing)
export async function POST(request: NextRequest) {
  const validation = await validateCsrfToken(request)
  
  if (!validation.valid) {
    return csrfErrorResponse(validation.error)
  }
  
  return NextResponse.json({
    success: true,
    message: 'CSRF token is valid',
  })
}
