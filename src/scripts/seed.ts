/**
 * Database Seed Script
 * Run this script to initialize the database with default values
 *
 * Usage: npx tsx src/scripts/seed.ts
 *
 * This creates:
 * - Default admin credentials (username: admin, password: admin123)
 * - Default settings row
 *
 * IMPORTANT: Change the default password immediately after first login!
 */

import { db } from '../db'
import { settings } from '../db/schema'
import { hashPassword } from '../lib/auth'
import { eq } from 'drizzle-orm'

async function seed() {
  console.log('🌱 Starting database seed...')

  try {
    // Check if settings already exist
    const existingSettings = await db.select().from(settings).where(eq(settings.id, 1)).limit(1)

    if (existingSettings.length > 0) {
      console.log('⚠️  Settings already exist. Checking if admin is configured...')

      if (existingSettings[0].adminPassword) {
        console.log('✅ Admin credentials already configured!')
        console.log('   Username:', existingSettings[0].adminUsername || 'admin')
        console.log('')
        console.log('   If you forgot your password, you can reset it by running:')
        console.log('   npx tsx src/scripts/reset-admin.ts')
        return
      }

      // Update existing settings with admin credentials
      console.log('📝 Adding admin credentials to existing settings...')
      const hashedPassword = await hashPassword('admin123')

      await db.update(settings)
        .set({
          adminUsername: 'admin',
          adminPassword: hashedPassword,
          adminUsernameUpdatedAt: new Date().toISOString(),
          adminPasswordUpdatedAt: new Date().toISOString(),
        })
        .where(eq(settings.id, 1))

      console.log('✅ Admin credentials added successfully!')
      printSuccessMessage()
      return
    }

    // Create new settings with default values
    console.log('📝 Creating default settings...')
    const hashedPassword = await hashPassword('admin123')

    await db.insert(settings).values({
      id: 1,
      websiteName: 'Krishi Bitan',
      slogan: 'Fresh from farm to your table',
      insideDhakaDelivery: '60',
      outsideDhakaDelivery: '120',
      freeDeliveryMin: '500',
      universalDelivery: false,
      universalDeliveryCharge: '60',
      adminUsername: 'admin',
      adminPassword: hashedPassword,
      adminUsernameUpdatedAt: new Date().toISOString(),
      adminPasswordUpdatedAt: new Date().toISOString(),
      heroAnimationSpeed: 3000,
      heroAnimationType: 'Fade',
      stockLowPercent: 25,
      stockMediumPercent: 50,
      courierEnabled: false,
      offerTitle: 'Offers',
      offerSlogan: 'Exclusive deals just for you',
      firstSectionName: 'Categories',
      firstSectionSlogan: 'Browse by category',
      secondSectionName: 'Offers',
      secondSectionSlogan: 'Exclusive deals for you',
      thirdSectionName: 'Featured',
      thirdSectionSlogan: 'Handpicked products',
    })

    console.log('✅ Default settings created successfully!')
    printSuccessMessage()

  } catch (error) {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  }
}

function printSuccessMessage() {
  console.log('')
  console.log('═══════════════════════════════════════════════════════════')
  console.log('🎉 DATABASE SEEDED SUCCESSFULLY!')
  console.log('═══════════════════════════════════════════════════════════')
  console.log('')
  console.log('📋 Default Admin Credentials:')
  console.log('   Username: admin')
  console.log('   Password: admin123')
  console.log('')
  console.log('⚠️  IMPORTANT: Please change the password after first login!')
  console.log('   Go to: Admin Dashboard → Settings → Change Password')
  console.log('')
  console.log('═══════════════════════════════════════════════════════════')
}

// Run seed
seed()
  .then(() => {
    console.log('🌱 Seed completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Seed error:', error)
    process.exit(1)
  })
