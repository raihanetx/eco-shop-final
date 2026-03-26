/**
 * Database Migration Script
 * Run with: bun run scripts/migrate.ts
 */
import postgres from 'postgres'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env file with override
config({ path: resolve(__dirname, '../.env'), override: true })

async function runMigrations() {
  const DATABASE_URL = process.env.DATABASE_URL
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not configured')
    process.exit(1)
  }

  console.log('🔄 Running database migrations...')
  
  const sql = postgres(DATABASE_URL, { ssl: 'require', max: 1 })

  try {
    // Migration 1: Add checkout duration columns to abandoned_checkouts
    console.log('  → Adding checkout duration columns...')
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

    console.log('✅ All migrations completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await sql.end()
  }
}

runMigrations()
