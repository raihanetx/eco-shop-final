import { NextRequest, NextResponse } from 'next/server'
import { db, sqlClient } from '@/db'
import { settings } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { hashPassword } from '@/lib/auth'
import { isPasswordStrongEnough } from '@/lib/password-strength'
import { initializeDatabase, isDatabaseReady } from '@/lib/auto-init'

/**
 * GET /api/setup
 * Check if setup is needed (no admin configured)
 */
export async function GET() {
  try {
    // Ensure database is initialized
    if (!await isDatabaseReady()) {
      await initializeDatabase()
    }
    
    const result = await db.select().from(settings).where(eq(settings.id, 1)).limit(1)

    if (result.length === 0 || !result[0].adminPassword) {
      return NextResponse.json({
        needsSetup: true,
        message: 'Admin credentials not configured'
      })
    }

    return NextResponse.json({
      needsSetup: false,
      message: 'Admin already configured'
    })
  } catch (error) {
    console.error('[SETUP] Check error:', error)
    return NextResponse.json({
      needsSetup: true,
      message: 'Could not verify setup status',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

/**
 * POST /api/setup
 * Create initial admin credentials (only if not already configured)
 */
export async function POST(request: NextRequest) {
  try {
    // Ensure database is initialized
    if (!await isDatabaseReady()) {
      const initResult = await initializeDatabase()
      if (!initResult.success) {
        return NextResponse.json({
          success: false,
          error: 'Failed to initialize database: ' + initResult.message
        }, { status: 500 })
      }
    }
    
    // Check if already configured
    const existing = await db.select().from(settings).where(eq(settings.id, 1)).limit(1)

    if (existing.length > 0 && existing[0].adminPassword) {
      return NextResponse.json({
        success: false,
        error: 'Admin already configured. Use login page.'
      }, { status: 400 })
    }

    const body = await request.json()
    const { username, password, confirmPassword } = body

    // Validate inputs
    if (!username || !password) {
      return NextResponse.json({
        success: false,
        error: 'Username and password are required'
      }, { status: 400 })
    }

    if (username.length < 3) {
      return NextResponse.json({
        success: false,
        error: 'Username must be at least 3 characters'
      }, { status: 400 })
    }

    if (password !== confirmPassword) {
      return NextResponse.json({
        success: false,
        error: 'Passwords do not match'
      }, { status: 400 })
    }

    // Check password strength
    const strengthCheck = isPasswordStrongEnough(password)
    if (!strengthCheck.valid) {
      return NextResponse.json({
        success: false,
        error: strengthCheck.error || 'Password is too weak'
      }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create or update settings
    if (existing.length === 0) {
      // Create new settings row
      await db.insert(settings).values({
        id: 1,
        websiteName: 'Krishi Bitan',
        slogan: 'Fresh from farm to your table',
        adminUsername: username,
        adminPassword: hashedPassword,
        adminUsernameUpdatedAt: new Date().toISOString(),
        adminPasswordUpdatedAt: new Date().toISOString(),
        insideDhakaDelivery: '60',
        outsideDhakaDelivery: '120',
        freeDeliveryMin: '500',
        universalDelivery: false,
        universalDeliveryCharge: '60',
        heroAnimationSpeed: 3000,
        heroAnimationType: 'Fade',
        stockLowPercent: 25,
        stockMediumPercent: 50,
        courierEnabled: false,
      })
    } else {
      // Update existing settings
      await db.update(settings)
        .set({
          adminUsername: username,
          adminPassword: hashedPassword,
          adminUsernameUpdatedAt: new Date().toISOString(),
          adminPasswordUpdatedAt: new Date().toISOString(),
        })
        .where(eq(settings.id, 1))
    }

    console.log('[SETUP] Admin created successfully:', username)

    return NextResponse.json({
      success: true,
      message: 'Admin credentials created successfully! Please login now.'
    })
  } catch (error) {
    console.error('[SETUP] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Setup failed. Please try again.'
    }, { status: 500 })
  }
}
