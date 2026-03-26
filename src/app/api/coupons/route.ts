import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { coupons, products } from '@/db/schema'
import { eq, inArray } from 'drizzle-orm'
import { isApiAuthenticated, authErrorResponse } from '@/lib/api-auth'

// GET /api/coupons - Get all coupons or validate a specific code
// Public: Can validate a specific coupon code (for checkout) or get active coupons (public=true)
// Protected: Listing all coupons requires authentication
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const publicList = searchParams.get('public')
    const cartItems = searchParams.get('cartItems') // JSON string of cart items with productId and category
    
    // PUBLIC: Get active coupons for offers page (LIMITED INFO - no codes exposed)
    // This only shows promotional coupons for display purposes
    if (publicList === 'true') {
      const allCoupons = await db.select().from(coupons)
      
      // Filter active coupons (not expired and active status)
      const activeCoupons = allCoupons.filter(coupon => {
        if (!coupon.expiry) return true
        return new Date(coupon.expiry) >= new Date()
      })
      
      // SECURITY: Only return display info, NOT the actual coupon codes
      // Codes should only be validated via the code parameter (checkout flow)
      return NextResponse.json({
        success: true,
        coupons: activeCoupons.map(c => ({
          id: c.id,
          // Mask the code - only show first 2 and last 2 characters
          codePreview: c.code ? `${c.code.substring(0, 2)}***${c.code.substring(c.code.length - 2)}` : '',
          type: c.type,
          value: c.value,
          scope: c.scope,
          expiry: c.expiry
        }))
      })
    }
    
    if (code) {
      // PUBLIC: Validate coupon code (needed for checkout flow)
      const coupon = await db.select().from(coupons).where(eq(coupons.code, code))
      
      if (coupon.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'Invalid coupon code'
        }, { status: 404 })
      }
      
      const foundCoupon = coupon[0]
      
      // Check expiry
      if (foundCoupon.expiry) {
        const expiryDate = new Date(foundCoupon.expiry)
        if (expiryDate < new Date()) {
          return NextResponse.json({
            success: false,
            error: 'Coupon has expired'
          }, { status: 400 })
        }
      }
      
      // If cart items provided, validate scope
      if (cartItems && foundCoupon.scope !== 'all') {
        try {
          const items = JSON.parse(cartItems)
          const selectedProducts = foundCoupon.selectedProducts ? JSON.parse(foundCoupon.selectedProducts) : []
          const selectedCategories = foundCoupon.selectedCategories ? JSON.parse(foundCoupon.selectedCategories) : []
          
          // Check if any cart item matches the coupon scope
          let isValidForCart = false
          
          if (foundCoupon.scope === 'products') {
            // Check if any cart item productId is in selectedProducts
            isValidForCart = items.some((item: any) => 
              selectedProducts.includes(item.productId) || selectedProducts.includes(item.id)
            )
          } else if (foundCoupon.scope === 'categories') {
            // Check if any cart item category is in selectedCategories
            isValidForCart = items.some((item: any) => 
              selectedCategories.includes(item.category)
            )
          }
          
          if (!isValidForCart) {
            return NextResponse.json({
              success: false,
              error: 'Coupon not applicable to items in cart'
            }, { status: 400 })
          }
          
          // Return applicable items for discount calculation
          const applicableItems = items.filter((item: any) => {
            if (foundCoupon.scope === 'products') {
              return selectedProducts.includes(item.productId) || selectedProducts.includes(item.id)
            } else if (foundCoupon.scope === 'categories') {
              return selectedCategories.includes(item.category)
            }
            return true
          })
          
          return NextResponse.json({
            success: true,
            data: foundCoupon,
            applicableItems: applicableItems.map((i: any) => i.productId || i.id)
          })
        } catch (e) {
          console.error('Error parsing cart items for coupon validation:', e)
        }
      }
      
      return NextResponse.json({
        success: true,
        data: foundCoupon
      })
    }
    
    // PROTECTED: List all coupons (admin only)
    if (!await isApiAuthenticated()) {
      return authErrorResponse()
    }

    const allCoupons = await db.select().from(coupons)
    
    return NextResponse.json({
      success: true,
      data: allCoupons,
      count: allCoupons.length
    })
  } catch (error) {
    console.error('Error fetching coupons:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch coupons' },
      { status: 500 }
    )
  }
}

// POST /api/coupons - Create new coupon (Protected: Admin only)
export async function POST(request: NextRequest) {
  try {
    // Authentication required
    if (!await isApiAuthenticated()) {
      return authErrorResponse()
    }

    const body = await request.json()
    
    // FIX: Validate coupon data
    const validationErrors: string[] = []
    
    // Validate code
    if (!body.code || typeof body.code !== 'string' || body.code.trim().length < 3) {
      validationErrors.push('Coupon code must be at least 3 characters')
    } else if (!/^[A-Z0-9]+$/i.test(body.code)) {
      validationErrors.push('Coupon code must contain only letters and numbers')
    }
    
    // Validate type
    if (!['pct', 'fixed'].includes(body.type)) {
      validationErrors.push('Type must be "pct" or "fixed"')
    }
    
    // Validate value
    const value = parseFloat(body.value)
    if (isNaN(value) || value <= 0) {
      validationErrors.push('Discount value must be a positive number')
    } else if (body.type === 'pct' && value > 100) {
      validationErrors.push('Percentage discount cannot exceed 100%')
    } else if (body.type === 'fixed' && value > 100000) {
      validationErrors.push('Fixed discount cannot exceed 100,000 TK')
    }
    
    // Validate scope
    if (!['all', 'products', 'categories'].includes(body.scope)) {
      validationErrors.push('Scope must be "all", "products", or "categories"')
    }
    
    // Validate scope-specific selections
    if (body.scope === 'products' && (!body.selectedProducts || !Array.isArray(body.selectedProducts) || body.selectedProducts.length === 0)) {
      validationErrors.push('At least one product must be selected for product-specific coupons')
    }
    if (body.scope === 'categories' && (!body.selectedCategories || !Array.isArray(body.selectedCategories) || body.selectedCategories.length === 0)) {
      validationErrors.push('At least one category must be selected for category-specific coupons')
    }
    
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validationErrors },
        { status: 400 }
      )
    }
    
    const newCoupon = await db.insert(coupons).values({
      id: body.id || `coupon-${Date.now()}`,
      code: body.code.toUpperCase(),
      type: body.type,
      value: body.value,
      scope: body.scope,
      expiry: body.expiry || null,
      selectedProducts: body.selectedProducts ? JSON.stringify(body.selectedProducts) : null,
      selectedCategories: body.selectedCategories ? JSON.stringify(body.selectedCategories) : null,
    }).returning()
    
    return NextResponse.json({
      success: true,
      data: newCoupon[0]
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating coupon:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create coupon' },
      { status: 500 }
    )
  }
}

// PUT /api/coupons - Update coupon (Protected: Admin only)
export async function PUT(request: NextRequest) {
  try {
    // Authentication required
    if (!await isApiAuthenticated()) {
      return authErrorResponse()
    }

    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Coupon ID is required' },
        { status: 400 }
      )
    }
    
    const updated = await db.update(coupons)
      .set({
        code: updateData.code?.toUpperCase(),
        type: updateData.type,
        value: updateData.value,
        scope: updateData.scope,
        expiry: updateData.expiry || null,
        selectedProducts: updateData.selectedProducts ? JSON.stringify(updateData.selectedProducts) : null,
        selectedCategories: updateData.selectedCategories ? JSON.stringify(updateData.selectedCategories) : null,
      })
      .where(eq(coupons.id, id))
      .returning()
    
    if (updated.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Coupon not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: updated[0]
    })
  } catch (error) {
    console.error('Error updating coupon:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update coupon' },
      { status: 500 }
    )
  }
}

// DELETE /api/coupons - Delete coupon (Protected: Admin only)
export async function DELETE(request: NextRequest) {
  try {
    // Authentication required
    if (!await isApiAuthenticated()) {
      return authErrorResponse()
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Coupon ID is required' },
        { status: 400 }
      )
    }
    
    const deleted = await db.delete(coupons).where(eq(coupons.id, id)).returning()
    
    if (deleted.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Coupon not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Coupon deleted successfully',
      data: deleted[0]
    })
  } catch (error) {
    console.error('Error deleting coupon:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete coupon' },
      { status: 500 }
    )
  }
}
