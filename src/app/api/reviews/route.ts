import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { reviews } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { isApiAuthenticated, authErrorResponse } from '@/lib/api-auth'
import { checkRateLimit, rateLimitErrorResponse } from '@/lib/validation'
import { initializeDatabase, isDatabaseReady } from '@/lib/auto-init'

// GET /api/reviews - Get reviews by product ID or all reviews
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const productId = searchParams.get('productId')
    
    if (productId) {
      // Get reviews for specific product
      const productReviews = await db.select()
        .from(reviews)
        .where(eq(reviews.productId, parseInt(productId)))
        .orderBy(desc(reviews.id))
      
      return NextResponse.json({
        success: true,
        data: productReviews
      })
    }
    
    // Get all reviews with product info
    const allReviews = await db.select()
      .from(reviews)
      .orderBy(desc(reviews.id))
    
    return NextResponse.json({
      success: true,
      data: allReviews,
      count: allReviews.length
    })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}

// POST /api/reviews - Create new review (Public with rate limiting)
export async function POST(request: NextRequest) {
  try {
    // Ensure database is initialized
    if (!await isDatabaseReady()) {
      await initializeDatabase()
    }

    // SECURITY: Rate limiting to prevent review spam
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitKey = `review-create:${ip}`
    const rateLimit = checkRateLimit(rateLimitKey, 5, 60000) // 5 reviews per minute per IP

    if (!rateLimit.allowed) {
      return rateLimitErrorResponse(rateLimit.resetAt)
    }

    const body = await request.json()
    
    // SECURITY: Input validation
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Name is required (min 2 characters)' },
        { status: 400 }
      )
    }
    
    if (!body.rating || typeof body.rating !== 'number' || body.rating < 1 || body.rating > 5) {
      return NextResponse.json(
        { success: false, error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }
    
    if (!body.text || typeof body.text !== 'string' || body.text.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: 'Review text is required (min 5 characters)' },
        { status: 400 }
      )
    }

    // Parse productId if it's a string
    let productId = body.productId
    if (typeof productId === 'string') {
      productId = parseInt(productId)
    }

    const newReview = await db.insert(reviews).values({
      initials: body.initials || body.name?.substring(0, 2).toUpperCase() || 'AN',
      name: body.name.trim(),
      rating: body.rating,
      text: body.text.trim(),
      date: body.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      productId: productId || null,
      customerId: body.customerId || null,
    }).returning()
    
    return NextResponse.json({
      success: true,
      data: newReview[0]
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create review: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}

// DELETE /api/reviews - Delete review (Admin only)
export async function DELETE(request: NextRequest) {
  try {
    // Authentication required for delete operations
    if (!await isApiAuthenticated()) {
      return authErrorResponse()
    }

    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Review ID is required' },
        { status: 400 }
      )
    }
    
    const deleted = await db.delete(reviews)
      .where(eq(reviews.id, parseInt(id)))
      .returning()
    
    if (deleted.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting review:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete review' },
      { status: 500 }
    )
  }
}
