import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

// Get database URL from environment variable (SECURE)
const DATABASE_URL = process.env.DATABASE_URL

// ============================================
// HELPER FUNCTIONS
// ============================================

function getDate(): string {
  return new Date().toISOString().split('T')[0] // YYYY-MM-DD
}

function parseUserAgent(userAgent: string): { deviceType: string; browser: string; os: string } {
  const ua = userAgent.toLowerCase()
  
  // Detect device type
  let deviceType = 'desktop'
  if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
    deviceType = 'mobile'
  } else if (/tablet|ipad|playbook|silk/i.test(ua)) {
    deviceType = 'tablet'
  }
  
  // Detect browser
  let browser = 'other'
  if (ua.includes('firefox')) browser = 'firefox'
  else if (ua.includes('edg/')) browser = 'edge'
  else if (ua.includes('chrome')) browser = 'chrome'
  else if (ua.includes('safari')) browser = 'safari'
  else if (ua.includes('opera') || ua.includes('opr/')) browser = 'opera'
  
  // Detect OS
  let os = 'other'
  if (ua.includes('windows')) os = 'windows'
  else if (ua.includes('mac os')) os = 'macos'
  else if (ua.includes('android')) os = 'android'
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'ios'
  else if (ua.includes('linux')) os = 'linux'
  
  return { deviceType, browser, os }
}

// ============================================
// POST /api/tracking/session - Session tracking
// ============================================
// Actions:
// - start: Start a new session
// - heartbeat: Update session activity (for duration tracking)
// - end: End a session
// - pageview: Track a page view within session
// - cart: Track cart actions
// ============================================

export async function POST(request: NextRequest) {
  if (!DATABASE_URL) {
    return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { action, sessionId, page, productId, cartAction, referrer } = body
    
    if (!action || !sessionId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: action, sessionId' 
      }, { status: 400 })
    }

    const sql = neon(DATABASE_URL)
    const now = new Date()
    const date = getDate()
    const userAgent = request.headers.get('user-agent') || ''
    const { deviceType, browser, os } = parseUserAgent(userAgent)

    switch (action) {
      // ============================================
      // START SESSION
      // ============================================
      case 'start': {
        // Check if session already exists
        const existing = await sql`
          SELECT id FROM session_analytics WHERE session_id = ${sessionId}
        `
        
        if (existing.length > 0) {
          // Update existing session - they came back
          await sql`
            UPDATE session_analytics 
            SET last_activity_at = ${now}, 
                page_views = page_views + 1
            WHERE session_id = ${sessionId}
          `
        } else {
          // Create new session
          await sql`
            INSERT INTO session_analytics 
            (session_id, started_at, last_activity_at, device_type, browser, os, date)
            VALUES (${sessionId}, ${now}, ${now}, ${deviceType}, ${browser}, ${os}, ${date})
          `
        }
        
        return NextResponse.json({ success: true, action: 'start' })
      }

      // ============================================
      // HEARTBEAT - Update activity and calculate duration
      // ============================================
      case 'heartbeat': {
        const session = await sql`
          SELECT id, started_at FROM session_analytics WHERE session_id = ${sessionId}
        `
        
        if (session.length === 0) {
          // Session doesn't exist, create it
          await sql`
            INSERT INTO session_analytics 
            (session_id, started_at, last_activity_at, device_type, browser, os, date)
            VALUES (${sessionId}, ${now}, ${now}, ${deviceType}, ${browser}, ${os}, ${date})
          `
        } else {
          // Calculate duration in seconds
          const startedAt = new Date(session[0].started_at)
          const durationSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000)
          
          await sql`
            UPDATE session_analytics 
            SET last_activity_at = ${now}, 
                duration_seconds = ${durationSeconds}
            WHERE session_id = ${sessionId}
          `
        }
        
        return NextResponse.json({ success: true, action: 'heartbeat' })
      }

      // ============================================
      // END SESSION
      // ============================================
      case 'end': {
        const session = await sql`
          SELECT id, started_at, page_views FROM session_analytics WHERE session_id = ${sessionId}
        `
        
        if (session.length > 0) {
          const startedAt = new Date(session[0].started_at)
          const durationSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000)
          const pageViews = session[0].page_views || 1
          // Bounced = only 1 page AND stayed less than 10 seconds
          const isBounced = pageViews <= 1 && durationSeconds < 10
          
          await sql`
            UPDATE session_analytics 
            SET ended_at = ${now}, 
                duration_seconds = ${durationSeconds},
                is_bounced = ${isBounced}
            WHERE session_id = ${sessionId}
          `
        }
        
        return NextResponse.json({ success: true, action: 'end' })
      }

      // ============================================
      // PAGE VIEW
      // ============================================
      case 'pageview': {
        if (!page) {
          return NextResponse.json({ 
            success: false, 
            error: 'Missing page parameter' 
          }, { status: 400 })
        }

        // Insert page view record
        await sql`
          INSERT INTO page_views 
          (session_id, page, product_id, referrer, date)
          VALUES (${sessionId}, ${page}, ${productId || null}, ${referrer || null}, ${date})
        `
        
        // Update session stats
        const session = await sql`
          SELECT id FROM session_analytics WHERE session_id = ${sessionId}
        `
        
        if (session.length > 0) {
          const isProductPage = page === 'product' && productId
          
          await sql`
            UPDATE session_analytics 
            SET page_views = page_views + 1,
                product_views = product_views + ${isProductPage ? 1 : 0},
                last_activity_at = ${now}
            WHERE session_id = ${sessionId}
          `
        } else {
          // Create session if it doesn't exist
          await sql`
            INSERT INTO session_analytics 
            (session_id, started_at, last_activity_at, device_type, browser, os, date, page_views, product_views)
            VALUES (${sessionId}, ${now}, ${now}, ${deviceType}, ${browser}, ${os}, ${date}, 1, ${page === 'product' && productId ? 1 : 0})
          `
        }
        
        return NextResponse.json({ success: true, action: 'pageview' })
      }

      // ============================================
      // CART ACTION
      // ============================================
      case 'cart': {
        if (!cartAction) {
          return NextResponse.json({ 
            success: false, 
            error: 'Missing cartAction parameter (add/remove)' 
          }, { status: 400 })
        }

        const session = await sql`
          SELECT id FROM session_analytics WHERE session_id = ${sessionId}
        `
        
        if (session.length > 0) {
          if (cartAction === 'add') {
            await sql`
              UPDATE session_analytics 
              SET cart_adds = cart_adds + 1, last_activity_at = ${now}
              WHERE session_id = ${sessionId}
            `
          } else if (cartAction === 'remove') {
            await sql`
              UPDATE session_analytics 
              SET cart_removes = cart_removes + 1, last_activity_at = ${now}
              WHERE session_id = ${sessionId}
            `
          }
        }
        
        return NextResponse.json({ success: true, action: 'cart' })
      }

      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid action. Use: start, heartbeat, end, pageview, cart' 
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Session tracking error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to track session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
