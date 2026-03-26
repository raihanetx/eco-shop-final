import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { products, variants, categories } from '@/db/schema'
import { isApiAuthenticated, authErrorResponse } from '@/lib/api-auth'

// GET /api/inventory - SMART: 3 parallel queries, NOT N+N! (Admin only)
export async function GET(request: NextRequest) {
  try {
    // Authentication required - inventory data is business sensitive
    if (!await isApiAuthenticated()) {
      return authErrorResponse()
    }

    // SMART: Fetch ALL data in 3 PARALLEL queries
    const [allProducts, allVariants, allCategories] = await Promise.all([
      db.select().from(products),
      db.select().from(variants),
      db.select().from(categories)
    ])
    
    // SMART: Build lookup maps (O(1) access)
    const variantsByProduct: Record<number, any[]> = {}
    for (const v of allVariants) {
      if (!variantsByProduct[v.productId]) variantsByProduct[v.productId] = []
      variantsByProduct[v.productId].push({
        id: v.id,
        name: v.name,
        stock: v.stock,
        initialStock: v.initialStock,
        label: v.name,
      })
    }
    
    const categoryLookup = new Map(allCategories.map(c => [c.id, c.name]))
    
    // SMART: Process all products in memory (no DB calls!)
    const inventoryData = allProducts.map(product => ({
      id: product.id,
      name: product.name,
      category: product.categoryId 
        ? (categoryLookup.get(product.categoryId) || product.category || 'Uncategorized')
        : (product.category || 'Uncategorized'),
      image: product.image,
      variants: variantsByProduct[product.id] || [],
      lastEdited: product.updatedAt 
        ? new Date(product.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'N/A',
    }))
    
    return NextResponse.json({
      success: true,
      data: inventoryData,
      count: inventoryData.length
    })
  } catch (error) {
    console.error('Error fetching inventory:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch inventory' },
      { status: 500 }
    )
  }
}

// PUT /api/inventory - Update variant stock (Protected: Admin only)
export async function PUT(request: NextRequest) {
  try {
    // Authentication required
    if (!await isApiAuthenticated()) {
      return authErrorResponse()
    }

    const body = await request.json()
    const { variantId, stock } = body
    
    if (variantId === undefined || stock === undefined) {
      return NextResponse.json(
        { success: false, error: 'Variant ID and stock are required' },
        { status: 400 }
      )
    }
    
    // FIX: Validate stock is non-negative
    if (stock < 0) {
      return NextResponse.json(
        { success: false, error: 'Stock cannot be negative' },
        { status: 400 }
      )
    }
    
    // FIX: Validate stock is a number
    if (typeof stock !== 'number' || isNaN(stock)) {
      return NextResponse.json(
        { success: false, error: 'Stock must be a valid number' },
        { status: 400 }
      )
    }
    
    const { eq } = await import('drizzle-orm')
    const updated = await db.update(variants)
      .set({ stock: stock })
      .where(eq(variants.id, variantId))
      .returning()
    
    if (updated.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Variant not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: updated[0]
    })
  } catch (error) {
    console.error('Error updating inventory:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update inventory' },
      { status: 500 }
    )
  }
}
