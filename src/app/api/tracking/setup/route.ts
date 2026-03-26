import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { isApiAuthenticated, authErrorResponse } from '@/lib/api-auth'

// GET /api/tracking/setup - Create tracking tables if they don't exist
// This is a one-time setup endpoint (Protected: Admin only)
export async function GET() {
  // Authentication required
  if (!await isApiAuthenticated()) {
    return authErrorResponse()
  }

  const DATABASE_URL = process.env.DATABASE_URL
  
  if (!DATABASE_URL) {
    return NextResponse.json({ 
      success: false, 
      error: 'DATABASE_URL not configured' 
    }, { status: 500 })
  }

  try {
    const sql = neon(DATABASE_URL)

    // Create session_analytics table
    await sql`
      CREATE TABLE IF NOT EXISTS session_analytics (
        id SERIAL PRIMARY KEY,
        session_id TEXT NOT NULL UNIQUE,
        started_at TIMESTAMP NOT NULL,
        last_activity_at TIMESTAMP NOT NULL,
        ended_at TIMESTAMP,
        duration_seconds INTEGER DEFAULT 0,
        page_views INTEGER DEFAULT 1,
        product_views INTEGER DEFAULT 0,
        is_bounced BOOLEAN DEFAULT false,
        device_type TEXT NOT NULL,
        browser TEXT NOT NULL,
        os TEXT NOT NULL,
        cart_adds INTEGER DEFAULT 0,
        cart_removes INTEGER DEFAULT 0,
        did_order BOOLEAN DEFAULT false,
        order_id TEXT,
        date TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Create page_views table
    await sql`
      CREATE TABLE IF NOT EXISTS page_views (
        id SERIAL PRIMARY KEY,
        session_id TEXT NOT NULL,
        page TEXT NOT NULL,
        product_id INTEGER,
        referrer TEXT,
        date TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Create indexes for better query performance
    await sql`
      CREATE INDEX IF NOT EXISTS idx_session_analytics_session_id ON session_analytics(session_id)
    `
    await sql`
      CREATE INDEX IF NOT EXISTS idx_session_analytics_date ON session_analytics(date)
    `
    await sql`
      CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON page_views(session_id)
    `
    await sql`
      CREATE INDEX IF NOT EXISTS idx_page_views_date ON page_views(date)
    `

    return NextResponse.json({ 
      success: true, 
      message: 'Tracking tables created successfully',
      tables: ['session_analytics', 'page_views']
    })
  } catch (error) {
    console.error('Error creating tracking tables:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create tracking tables',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
