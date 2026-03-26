import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { relatedProducts, products } from '@/db/schema'
import { eq, inArray, asc } from 'drizzle-orm'
import { isApiAuthenticated, authErrorResponse } from '@/lib/api-auth'

// GET /api/related-products - Get related products by product ID
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
    
    // Get related product IDs
    const related = await db.select()
      .from(relatedProducts)
      .where(eq(relatedProducts.productId, parseInt(productId)))
      .orderBy(asc(relatedProducts.sortOrder))
    
    // If no related products, return empty
    if (related.length === 0) {
      return NextResponse.json({
        success: true,
        data: []
      })
    }
    
    // Get the actual product details for related products
    const relatedIds = related.map(r => r.relatedProductId)
    const relatedProductDetails = await db.select()
      .from(products)
      .where(inArray(products.id, relatedIds))
    
    // Combine the data
    const result = related.map(r => {
      const product = relatedProductDetails.find(p => p.id === r.relatedProductId)
      return {
        id: r.id,
        relatedProductId: r.relatedProductId,
        sortOrder: r.sortOrder,
        product: product || null
      }
    })
    
    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Error fetching related products:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch related products' },
      { status: 500 }
    )
  }
}

// POST /api/related-products - Create new related product(s) (Protected: Admin only)
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Authentication required for creating related products
    if (!await isApiAuthenticated()) {
      return authErrorResponse()
    }

    const body = await request.json()
    
    // Support single related product or array
    const relatedData = Array.isArray(body) ? body : [body]
    
    const created = await db.insert(relatedProducts).values(
      relatedData.map((r: any, index: number) => ({
        relatedProductId: r.relatedProductId,
        sortOrder: r.sortOrder ?? index,
        productId: r.productId,
      }))
    ).returning()
    
    return NextResponse.json({
      success: true,
      data: created
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating related products:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create related products' },
      { status: 500 }
    )
  }
}

// DELETE /api/related-products - Delete related products for a product (Protected: Admin only)
export async function DELETE(request: NextRequest) {
  try {
    // SECURITY: Authentication required for deleting related products
    if (!await isApiAuthenticated()) {
      return authErrorResponse()
    }

    const searchParams = request.nextUrl.searchParams
    const productId = searchParams.get('productId')
    
    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      )
    }
    
    const deleted = await db.delete(relatedProducts)
      .where(eq(relatedProducts.productId, parseInt(productId)))
      .returning()
    
    return NextResponse.json({
      success: true,
      message: `Deleted ${deleted.length} related products`
    })
  } catch (error) {
    console.error('Error deleting related products:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete related products' },
      { status: 500 }
    )
  }
}
