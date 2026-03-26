import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin } from '@/lib/auth'
import { checkHoneypot, detectBot } from '@/lib/bot-detection'

// Cookie settings
const SESSION_COOKIE_NAME = 'admin_session'
const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60 // 7 days

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // === BOT DETECTION ===
    // Check honeypot fields (invisible to humans)
    const honeypotCheck = checkHoneypot(body)
    if (!honeypotCheck.valid) {
      // Silently reject - don't tell bots why
      console.log('[SECURITY] Bot detected on login via honeypot')
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid credentials'
      }, { status: 401 })
    }
    
    // Additional bot detection
    const botCheck = detectBot(request, body)
    if (botCheck.shouldBlock) {
      console.log('[SECURITY] Bot blocked on login:', botCheck.reasons)
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid credentials'
      }, { status: 401 })
    }
    
    // Get client info for audit logging
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() 
      || request.headers.get('x-real-ip') 
      || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    const { username, password } = body
    
    if (!username || !password) {
      return NextResponse.json({ 
        success: false, 
        error: 'Username and password required'
      }, { status: 400 })
    }
    
    // Authenticate with rate limiting and audit logging
    const result = await authenticateAdmin(username, password, ip, userAgent)
    
    if (result.success && result.token) {
      // Set secure session cookie with proper settings for persistence
      const response = NextResponse.json({ success: true })
      
      // Use secure cookies in production
      const isProduction = process.env.NODE_ENV === 'production'
      
      response.cookies.set(SESSION_COOKIE_NAME, result.token, {
        httpOnly: true,
        secure: isProduction, // Only secure in production (HTTPS required)
        sameSite: isProduction ? 'strict' : 'lax',
        maxAge: SESSION_DURATION_SECONDS,
        path: '/',
        // Don't set domain for localhost
      })
      console.log('[LOGIN] Session cookie set, duration:', SESSION_DURATION_SECONDS, 'seconds (7 days), secure:', isProduction)
      return response
    }
    
    // Failed login - return error with remaining attempts
    const statusCode = result.lockedMinutes ? 429 : 401
    
    return NextResponse.json({ 
      success: false, 
      error: result.error || 'Invalid credentials',
      remainingAttempts: result.remainingAttempts || 0,
      lockedMinutes: result.lockedMinutes || 0
    }, { status: statusCode })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Something went wrong' 
    }, { status: 500 })
  }
}
