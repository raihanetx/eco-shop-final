/**
 * Reset Admin Password Script
 * Run this script to reset the admin password
 *
 * Usage: npx tsx src/scripts/reset-admin.ts [new-password]
 *
 * If no password is provided, it will reset to 'admin123'
 */

import { db } from '../db'
import { settings } from '../db/schema'
import { hashPassword } from '../lib/auth'
import { eq } from 'drizzle-orm'
import * as readline from 'readline'

async function resetAdminPassword(newPassword?: string) {
  console.log('🔐 Resetting admin password...')

  try {
    // Check if settings exist
    const existingSettings = await db.select().from(settings).where(eq(settings.id, 1)).limit(1)

    if (existingSettings.length === 0) {
      console.log('❌ No settings found. Please run the seed script first:')
      console.log('   npx tsx src/scripts/seed.ts')
      process.exit(1)
    }

    const password = newPassword || 'admin123'
    const hashedPassword = await hashPassword(password)

    await db.update(settings)
      .set({
        adminPassword: hashedPassword,
        adminPasswordUpdatedAt: new Date().toISOString(),
      })
      .where(eq(settings.id, 1))

    console.log('')
    console.log('═══════════════════════════════════════════════════════════')
    console.log('✅ ADMIN PASSWORD RESET SUCCESSFULLY!')
    console.log('═══════════════════════════════════════════════════════════')
    console.log('')
    console.log('📋 New Admin Credentials:')
    console.log('   Username:', existingSettings[0].adminUsername || 'admin')
    console.log('   Password:', password)
    console.log('')
    console.log('⚠️  IMPORTANT: Please change the password after login!')
    console.log('═══════════════════════════════════════════════════════════')

  } catch (error) {
    console.error('❌ Reset failed:', error)
    process.exit(1)
  }
}

// Get password from command line argument
const newPassword = process.argv[2]

// Run reset
resetAdminPassword(newPassword)
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('Reset error:', error)
    process.exit(1)
  })
