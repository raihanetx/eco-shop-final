/**
 * SERVER STARTUP HOOK
 * 
 * This file runs automatically when the Next.js server starts.
 * It initializes all database tables automatically - no manual setup needed!
 */

import { initializeDatabase } from '@/lib/auto-init'

export async function register() {
  // Only run on server side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('[STARTUP] 🚀 Server starting...')
    
    // Auto-initialize database on startup
    try {
      const result = await initializeDatabase()
      if (result.success) {
        console.log('[STARTUP] ✅ Database ready!')
      } else {
        console.error('[STARTUP] ⚠️ Database initialization issue:', result.message)
      }
    } catch (error) {
      console.error('[STARTUP] ❌ Database initialization failed:', error)
    }
  }
}
