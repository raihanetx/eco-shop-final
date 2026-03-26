import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { visitorSessions } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'

// POST /api/visitors - Track visitor session with device info
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, deviceType, browser, os } = body

    if (!sessionId || !deviceType || !browser || !os) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 })
    }

    const today = new Date().toISOString().split('T')[0]

    // Check if session already tracked today
    const existing = await db.select().from(visitorSessions)
      .where(eq(visitorSessions.sessionId, sessionId))
      .limit(1)

    // Only track once per session per day
    const todaySession = existing.find(s => s.date === today)
    if (todaySession) {
      return NextResponse.json({ success: true, message: 'Session already tracked' })
    }

    // Insert new session record
    await db.insert(visitorSessions).values({
      sessionId,
      deviceType,
      browser,
      os,
      date: today,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Visitor tracking error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to track visitor'
    }, { status: 500 })
  }
}

// GET /api/visitors - Get visitor stats
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '30')

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startDateStr = startDate.toISOString().split('T')[0]

    // Get device type breakdown
    const deviceStats = await db.execute(sql`
      SELECT device_type, COUNT(DISTINCT session_id) as count 
      FROM visitor_sessions 
      WHERE date >= ${startDateStr}
      GROUP BY device_type
    `)

    // Get browser breakdown
    const browserStats = await db.execute(sql`
      SELECT browser, COUNT(DISTINCT session_id) as count 
      FROM visitor_sessions 
      WHERE date >= ${startDateStr}
      GROUP BY browser
    `)

    // Get OS breakdown
    const osStats = await db.execute(sql`
      SELECT os, COUNT(DISTINCT session_id) as count 
      FROM visitor_sessions 
      WHERE date >= ${startDateStr}
      GROUP BY os
    `)

    // Total unique visitors
    const totalResult = await db.execute(sql`
      SELECT COUNT(DISTINCT session_id) as total 
      FROM visitor_sessions 
      WHERE date >= ${startDateStr}
    `) as any

    const total = totalResult.rows?.[0]?.total || totalResult[0]?.total || 0

    return NextResponse.json({
      success: true,
      data: {
        total,
        devices: (deviceStats as any).rows || deviceStats,
        browsers: (browserStats as any).rows || browserStats,
        os: (osStats as any).rows || osStats,
      }
    })
  } catch (error) {
    console.error('Visitor stats error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get visitor stats'
    }, { status: 500 })
  }
}
