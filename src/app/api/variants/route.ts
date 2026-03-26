import { NextRequest, NextResponse } from 'next/server'
import { db, clearShopDataCache } from '@/db'
import { variants } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { isApiAuthenticated, authErrorResponse } from '@/lib/api-auth'

// Helper function to parse discount string
function parseDiscount(discountStr: string | null): { discountType: 'pct' | 'fixed'; discountValue: number } {
  if (!discountStr || discountStr === '0%' || discountStr === '0') {
    return { discountType: 'pct', discountValue: 0 }
  }
  
  // Check if it's a percentage (e.g., "5%", "10%")
  if (discountStr.includes('%')) {
    const value = parseInt(discountStr.replace('%', ''))
    return { discountType: 'pct', discountValue: value }
  }
  
  // Otherwise it's a fixed amount (e.g., "50", "100")
  const value = parseInt(discountStr)
  return { discountType: 'fixed', discountValue: value }
}

// Helper function to add parsed discount to variant
// Uses DB values if available, otherwise parses from discount string
function addParsedDiscount(variant: any) {
  // Use DB values if discountValue is set and > 0
  if (variant.discountValue !== null && variant.discountValue !== undefined && variant.discountValue > 0) {
    return {
      ...variant,
      discountType: variant.discountType || 'pct',
      discountValue: variant.discountValue
    }
  }
  
  // Otherwise parse from discount string
  const { discountType, discountValue } = parseDiscount(variant.discount)
  return {
    ...variant,
    discountType,
    discountValue
  }
}

// GET /api/variants - Get variants by product ID (Public - needed for product display)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const productId = searchParams.get('productId')
    
    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      )
    }
    
    const productVariants = await db.select()
      .from(variants)
      .where(eq(variants.productId, parseInt(productId)))
    
    // Add parsed discount to each variant
    const variantsWithParsedDiscount = productVariants.map(addParsedDiscount)
    
    return NextResponse.json({
      success: true,
      data: variantsWithParsedDiscount
    })
  } catch (error) {
    console.error('Error fetching variants:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch variants' },
      { status: 500 }
    )
  }
}

// POST /api/variants - Create new variant(s) (Admin only)
export async function POST(request: NextRequest) {
  try {
    // Authentication required for write operations
    const isAuthenticated = await isApiAuthenticated()
    if (!isAuthenticated) {
      return authErrorResponse()
    }

    const body = await request.json()
    
    // Support single variant or array of variants
    const variantsData = Array.isArray(body) ? body : [body]
    
    const created = await db.insert(variants).values(
      variantsData.map((v: any) => ({
        name: v.name,
        stock: v.stock || 0,
        initialStock: v.initialStock || v.stock || 0,
        price: v.price || 0,
        discount: v.discount || '0%',
        discountType: v.discountType || 'pct',
        discountValue: v.discountValue || 0,
        productId: v.productId,
      }))
    ).returning()
    
    // Clear shop data cache so frontend shows updated stock/variants immediately
    clearShopDataCache()
    
    return NextResponse.json({
      success: true,
      data: created
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating variants:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create variants' },
      { status: 500 }
    )
  }
}

// PUT /api/variants - Update variant (Admin only)
export async function PUT(request: NextRequest) {
  try {
    // Authentication required for write operations
    const isAuthenticated = await isApiAuthenticated()
    if (!isAuthenticated) {
      return authErrorResponse()
    }

    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Variant ID is required' },
        { status: 400 }
      )
    }
    
    const updated = await db.update(variants)
      .set({
        name: updateData.name,
        stock: updateData.stock,
        initialStock: updateData.initialStock,
        price: updateData.price,
        discount: updateData.discount,
        discountType: updateData.discountType,
        discountValue: updateData.discountValue,
      })
      .where(eq(variants.id, id))
      .returning()
    
    if (updated.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Variant not found' },
        { status: 404 }
      )
    }
    
    // Clear shop data cache so frontend shows updated stock/variants immediately
    clearShopDataCache()
    
    return NextResponse.json({
      success: true,
      data: updated[0]
    })
  } catch (error) {
    console.error('Error updating variant:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update variant' },
      { status: 500 }
    )
  }
}

// DELETE /api/variants - Delete variant (Admin only)
export async function DELETE(request: NextRequest) {
  try {
    // Authentication required for write operations
    const isAuthenticated = await isApiAuthenticated()
    if (!isAuthenticated) {
      return authErrorResponse()
    }

    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')
    const productId = searchParams.get('productId')
    
    if (productId && !id) {
      // Delete all variants for a product
      const deleted = await db.delete(variants)
        .where(eq(variants.productId, parseInt(productId)))
        .returning()
      
      // Clear shop data cache so frontend updates immediately
      clearShopDataCache()
      
      return NextResponse.json({
        success: true,
        message: `Deleted ${deleted.length} variants`
      })
    }
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Variant ID is required' },
        { status: 400 }
      )
    }
    
    const deleted = await db.delete(variants)
      .where(eq(variants.id, parseInt(id)))
      .returning()
    
    if (deleted.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Variant not found' },
        { status: 404 }
      )
    }
    
    // Clear shop data cache so frontend updates immediately
    clearShopDataCache()
    
    return NextResponse.json({
      success: true,
      message: 'Variant deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting variant:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete variant' },
      { status: 500 }
    )
  }
}
