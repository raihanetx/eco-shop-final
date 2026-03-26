import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { isApiAuthenticated, authErrorResponse } from '@/lib/api-auth'

// GET /api/tracking/stats - Get real session statistics
// Protected: Admin only
export async function GET(request: NextRequest) {
  // Authentication required
  if (!await isApiAuthenticated()) {
    return authErrorResponse()
  }

  const DATABASE_URL = process.env.DATABASE_URL
  
  if (!DATABASE_URL) {
    return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 500 })
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const timeFrame = searchParams.get('timeFrame') || '30d'
    
    // Calculate date filter
    const now = new Date()
    let startDate = new Date()
    
    switch (timeFrame) {
      case 'today':
        startDate.setHours(0, 0, 0, 0)
        break
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '15d':
        startDate.setDate(now.getDate() - 15)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '180d':
        startDate.setMonth(now.getMonth() - 6)
        break
      case '365d':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 30)
    }

    const startStr = startDate.toISOString().split('T')[0]
    
    const sql = neon(DATABASE_URL)

    // ============================================
    // SESSION DURATION STATS
    // ============================================
    const durationStats = await sql`
      SELECT 
        AVG(duration_seconds) as avg_duration,
        MAX(duration_seconds) as max_duration,
        MIN(duration_seconds) as min_duration,
        COUNT(*) as total_sessions
      FROM session_analytics 
      WHERE date >= ${startStr} AND duration_seconds > 0
    `

    // ============================================
    // BOUNCE RATE STATS
    // ============================================
    const bounceStats = await sql`
      SELECT 
        COUNT(*) as total_sessions,
        SUM(CASE WHEN is_bounced = true THEN 1 ELSE 0 END) as bounced_sessions
      FROM session_analytics 
      WHERE date >= ${startStr}
    `

    // ============================================
    // CART ACTIONS PER PRODUCT
    // ============================================
    const cartStats = await sql`
      SELECT 
        SUM(cart_adds) as total_adds,
        SUM(cart_removes) as total_removes
      FROM session_analytics 
      WHERE date >= ${startStr}
    `

    // Cart actions per product (from cart_events table)
    const cartActionsPerProduct = await sql`
      SELECT 
        p.id as product_id,
        p.name as product_name,
        COUNT(CASE WHEN ce.action = 'add' THEN 1 END) as cart_adds,
        COUNT(CASE WHEN ce.action = 'remove' THEN 1 END) as cart_removes
      FROM cart_events ce
      JOIN products p ON ce.product_id = p.id
      WHERE ce.date >= ${startStr}
      GROUP BY p.id, p.name
      ORDER BY cart_adds DESC
      LIMIT 10
    `

    // ============================================
    // DEVICE BREAKDOWN
    // ============================================
    const deviceStats = await sql`
      SELECT 
        device_type,
        COUNT(*) as count
      FROM session_analytics 
      WHERE date >= ${startStr}
      GROUP BY device_type
    `

    // ============================================
    // BROWSER BREAKDOWN
    // ============================================
    const browserStats = await sql`
      SELECT 
        browser,
        COUNT(*) as count
      FROM session_analytics 
      WHERE date >= ${startStr}
      GROUP BY browser
    `

    // ============================================
    // OS BREAKDOWN
    // ============================================
    const osStats = await sql`
      SELECT 
        os,
        COUNT(*) as count
      FROM session_analytics 
      WHERE date >= ${startStr}
      GROUP BY os
    `

    // ============================================
    // CALCULATE REAL METRICS
    // ============================================
    
    // Average session duration
    const avgDurationSeconds = Math.round(durationStats[0]?.avg_duration || 0)
    const avgDurationFormatted = formatDuration(avgDurationSeconds)
    
    // Bounce rate
    const totalSessions = parseInt(bounceStats[0]?.total_sessions || 0)
    const bouncedSessions = parseInt(bounceStats[0]?.bounced_sessions || 0)
    const bounceRate = totalSessions > 0 ? Math.round((bouncedSessions / totalSessions) * 100) : 0
    
    // Device breakdown
    const deviceBreakdown = {
      mobile: 0,
      desktop: 0,
      tablet: 0,
      total: totalSessions
    }
    for (const d of deviceStats) {
      if (d.device_type === 'mobile') deviceBreakdown.mobile = parseInt(d.count)
      else if (d.device_type === 'desktop') deviceBreakdown.desktop = parseInt(d.count)
      else if (d.device_type === 'tablet') deviceBreakdown.tablet = parseInt(d.count)
    }

    // Browser breakdown
    const browserBreakdown: Record<string, number> = {}
    for (const b of browserStats) {
      browserBreakdown[b.browser] = parseInt(b.count)
    }

    // OS breakdown
    const osBreakdown: Record<string, number> = {}
    for (const o of osStats) {
      osBreakdown[o.os] = parseInt(o.count)
    }

    return NextResponse.json({
      success: true,
      data: {
        // Session Duration
        avgSessionDuration: avgDurationFormatted,
        avgSessionSeconds: avgDurationSeconds,
        maxSessionSeconds: durationStats[0]?.max_duration || 0,
        minSessionSeconds: durationStats[0]?.min_duration || 0,
        
        // Bounce Rate
        bounceRate,
        totalSessions,
        bouncedSessions,
        
        // Cart Actions
        totalCartAdds: parseInt(cartStats[0]?.total_adds || 0),
        totalCartRemoves: parseInt(cartStats[0]?.total_removes || 0),
        cartActionsPerProduct,
        
        // Device Stats
        deviceBreakdown,
        browserBreakdown,
        osBreakdown
      }
    })
  } catch (error) {
    console.error('Error fetching tracking stats:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch tracking statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Helper function to format duration
function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0s'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`
  } else {
    return `${secs}s`
  }
}
