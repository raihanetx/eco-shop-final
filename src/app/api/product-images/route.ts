import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { productImages } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'
import { isApiAuthenticated, authErrorResponse } from '@/lib/api-auth'

// GET /api/product-images - Get images by product ID
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
    
    const images = await db.select()
      .from(productImages)
      .where(eq(productImages.productId, parseInt(productId)))
      .orderBy(asc(productImages.sortOrder))
    
    return NextResponse.json({
      success: true,
      data: images
    })
  } catch (error) {
    console.error('Error fetching product images:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product images' },
      { status: 500 }
    )
  }
}

// POST /api/product-images - Create new image(s) (Protected: Admin only)
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Authentication required for creating product images
    if (!await isApiAuthenticated()) {
      return authErrorResponse()
    }

    const body = await request.json()
    
    // Support single image or array of images
    const imagesData = Array.isArray(body) ? body : [body]
    
    const created = await db.insert(productImages).values(
      imagesData.map((img: any, index: number) => ({
        url: img.url,
        sortOrder: img.sortOrder ?? index,
        productId: img.productId,
      }))
    ).returning()
    
    return NextResponse.json({
      success: true,
      data: created
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating product images:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create product images' },
      { status: 500 }
    )
  }
}

// DELETE /api/product-images - Delete images for a product (Protected: Admin only)
export async function DELETE(request: NextRequest) {
  try {
    // SECURITY: Authentication required for deleting product images
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
    
    const deleted = await db.delete(productImages)
      .where(eq(productImages.productId, parseInt(productId)))
      .returning()
    
    return NextResponse.json({
      success: true,
      message: `Deleted ${deleted.length} images`
    })
  } catch (error) {
    console.error('Error deleting product images:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete product images' },
      { status: 500 }
    )
  }
}
