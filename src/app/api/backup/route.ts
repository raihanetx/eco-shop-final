import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { 
  categories, products, variants, productImages, productFaqs, relatedProducts,
  customers, reviews, orders, orderItems, coupons, abandonedCheckouts, settings
} from '@/db/schema'
import { isApiAuthenticated, authErrorResponse } from '@/lib/api-auth'

// ============================================
// BACKUP API
// ============================================
// GET /api/backup - Download database backup as JSON
// POST /api/backup - Restore database from JSON (Phase 2)

// Tables to backup (in order of dependencies)
const BACKUP_TABLES = {
  // Core config (exclude sensitive credentials)
  settings: { table: settings, excludeFields: ['adminPassword', 'steadfastApiKey', 'steadfastSecretKey', 'cloudinaryApiSecret'] },
  
  // Product structure
  categories: { table: categories, excludeFields: [] },
  products: { table: products, excludeFields: [] },
  variants: { table: variants, excludeFields: [] },
  productImages: { table: productImages, excludeFields: [] },
  productFaqs: { table: productFaqs, excludeFields: [] },
  relatedProducts: { table: relatedProducts, excludeFields: [] },
  
  // Customer data
  customers: { table: customers, excludeFields: [] },
  reviews: { table: reviews, excludeFields: [] },
  
  // Orders
  orders: { table: orders, excludeFields: [] },
  orderItems: { table: orderItems, excludeFields: [] },
  
  // Marketing
  coupons: { table: coupons, excludeFields: [] },
  
  // Abandoned checkouts
  abandonedCheckouts: { table: abandonedCheckouts, excludeFields: [] },
}

// Tables to SKIP in backup (analytics - regenerable)
// - productViews
// - cartEvents
// - visitorSessions
// - sessionAnalytics
// - pageViews

/**
 * GET /api/backup
 * Download a complete database backup as JSON file
 * Admin authentication required
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    if (!await isApiAuthenticated()) {
      return authErrorResponse()
    }

    console.log('[BACKUP] Starting backup process...')
    
    const backupData: Record<string, any> = {
      _meta: {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        exportedBy: 'Krishi Bitan Backup System',
        tables: Object.keys(BACKUP_TABLES),
      }
    }

    // Fetch data from each table
    for (const [tableName, config] of Object.entries(BACKUP_TABLES)) {
      try {
        console.log(`[BACKUP] Fetching ${tableName}...`)
        
        // @ts-ignore - Dynamic table query
        const data = await db.select().from(config.table)
        
        // Exclude sensitive fields if specified
        if (config.excludeFields.length > 0) {
          backupData[tableName] = data.map((row: any) => {
            const cleanedRow = { ...row }
            for (const field of config.excludeFields) {
              if (cleanedRow[field] !== undefined) {
                delete cleanedRow[field]
              }
            }
            return cleanedRow
          })
        } else {
          backupData[tableName] = data
        }
        
        console.log(`[BACKUP] ${tableName}: ${data.length} records`)
      } catch (tableError) {
        console.error(`[BACKUP] Error fetching ${tableName}:`, tableError)
        // Continue with other tables, but log the error
        backupData[tableName] = []
        backupData._meta.errors = backupData._meta.errors || []
        backupData._meta.errors.push({
          table: tableName,
          error: tableError instanceof Error ? tableError.message : 'Unknown error'
        })
      }
    }

    // Create response with JSON file download
    const jsonString = JSON.stringify(backupData, null, 2)
    const filename = `backup-${new Date().toISOString().split('T')[0]}-${Date.now()}.json`
    
    console.log(`[BACKUP] Backup complete. Total size: ${jsonString.length} bytes`)
    
    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': jsonString.length.toString(),
      }
    })
    
  } catch (error) {
    console.error('[BACKUP] Backup failed:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Backup failed. Please try again.' 
    }, { status: 500 })
  }
}
