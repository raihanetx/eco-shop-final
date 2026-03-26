import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { productFaqs } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'
import { isApiAuthenticated, authErrorResponse } from '@/lib/api-auth'

// GET /api/product-faqs - Get FAQs by product ID
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
    
    const faqs = await db.select()
      .from(productFaqs)
      .where(eq(productFaqs.productId, parseInt(productId)))
      .orderBy(asc(productFaqs.sortOrder))
    
    return NextResponse.json({
      success: true,
      data: faqs
    })
  } catch (error) {
    console.error('Error fetching product FAQs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product FAQs' },
      { status: 500 }
    )
  }
}

// POST /api/product-faqs - Create new FAQ(s) (Protected: Admin only)
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Authentication required for creating FAQs
    if (!await isApiAuthenticated()) {
      return authErrorResponse()
    }

    const body = await request.json()
    
    // Support single FAQ or array of FAQs
    const faqsData = Array.isArray(body) ? body : [body]
    
    const created = await db.insert(productFaqs).values(
      faqsData.map((faq: any, index: number) => ({
        question: faq.question,
        answer: faq.answer,
        sortOrder: faq.sortOrder ?? index,
        productId: faq.productId,
      }))
    ).returning()
    
    return NextResponse.json({
      success: true,
      data: created
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating product FAQs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create product FAQs' },
      { status: 500 }
    )
  }
}

// DELETE /api/product-faqs - Delete FAQs for a product (Protected: Admin only)
export async function DELETE(request: NextRequest) {
  try {
    // SECURITY: Authentication required for deleting FAQs
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
    
    const deleted = await db.delete(productFaqs)
      .where(eq(productFaqs.productId, parseInt(productId)))
      .returning()
    
    return NextResponse.json({
      success: true,
      message: `Deleted ${deleted.length} FAQs`
    })
  } catch (error) {
    console.error('Error deleting product FAQs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete product FAQs' },
      { status: 500 }
    )
  }
}
