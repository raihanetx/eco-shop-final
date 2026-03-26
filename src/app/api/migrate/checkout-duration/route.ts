import { NextRequest, NextResponse } from 'next/server'
import { isApiAuthenticated, authErrorResponse } from '@/lib/api-auth'
import postgres from 'postgres'

// GET: Check migration status
// POST: Run migration to add checkout duration columns
export async function GET() {
  return NextResponse.json({ 
    success: true, 
    message: 'Migration endpoint ready. POST to run migration.',
    instructions: 'This will add checkout_started_at, checkout_ended_at, checkout_seconds columns to abandoned_checkouts table'
  })
}

export async function POST(request: NextRequest) {
  try {
    // Authentication required
    if (!await isApiAuthenticated()) {
      return authErrorResponse()
    }

    const DATABASE_URL = process.env.DATABASE_URL
    if (!DATABASE_URL) {
      return NextResponse.json({ success: false, error: 'DATABASE_URL not configured' }, { status: 500 })
    }

    const sql = postgres(DATABASE_URL, { ssl: 'require', max: 1 })

    try {
      // Add columns if they don't exist
      await sql`
        ALTER TABLE abandoned_checkouts 
        ADD COLUMN IF NOT EXISTS checkout_started_at TIMESTAMP
      `
      
      await sql`
        ALTER TABLE abandoned_checkouts 
        ADD COLUMN IF NOT EXISTS checkout_ended_at TIMESTAMP
      `
      
      await sql`
        ALTER TABLE abandoned_checkouts 
        ADD COLUMN IF NOT EXISTS checkout_seconds INTEGER DEFAULT 0
      `

      await sql.end()

      return NextResponse.json({ 
        success: true, 
        message: 'Migration completed successfully! Checkout duration columns added.' 
      })
    } catch (error) {
      await sql.end()
      throw error
    }
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Migration failed' 
    }, { status: 500 })
  }
}
