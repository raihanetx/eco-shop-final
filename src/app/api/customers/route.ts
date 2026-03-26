import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { customers } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { isApiAuthenticated, authErrorResponse } from '@/lib/api-auth'

// GET /api/customers - Get all customers (Admin only)
export async function GET(request: NextRequest) {
  try {
    // Authentication required - customer data is sensitive
    const isAuthenticated = await isApiAuthenticated()
    if (!isAuthenticated) {
      return authErrorResponse()
    }

    const searchParams = request.nextUrl.searchParams
    const phone = searchParams.get('phone')
    
    if (phone) {
      // Find customer by phone
      const customer = await db.select().from(customers).where(eq(customers.phone, phone)).limit(1)
      
      if (customer.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'Customer not found'
        }, { status: 404 })
      }
      
      return NextResponse.json({
        success: true,
        data: customer[0]
      })
    }
    
    // Get all customers ordered by most recent
    const allCustomers = await db.select().from(customers).orderBy(sql`${customers.createdAt} DESC`)
    
    return NextResponse.json({
      success: true,
      data: allCustomers,
      count: allCustomers.length
    })
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}

// POST /api/customers - Create new customer (Public - used during checkout)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // FIX: Input validation for security
    const validationErrors: string[] = []
    
    // Validate phone (required, 11 digits starting with 01)
    if (!body.phone || typeof body.phone !== 'string') {
      validationErrors.push('Phone number is required')
    } else {
      const phoneDigits = body.phone.replace(/\D/g, '')
      if (phoneDigits.length !== 11 || !phoneDigits.startsWith('01')) {
        validationErrors.push('Phone must be 11 digits starting with 01')
      }
      body.phone = phoneDigits // Normalize phone
    }
    
    // Validate name (optional, but if provided must be valid)
    if (body.name !== undefined && body.name !== null && typeof body.name !== 'string') {
      validationErrors.push('Name must be a string')
    }
    
    // Validate address (optional, but if provided must be valid)
    if (body.address !== undefined && body.address !== null && typeof body.address !== 'string') {
      validationErrors.push('Address must be a string')
    }
    
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validationErrors },
        { status: 400 }
      )
    }
    
    // Check if customer with this phone already exists
    const existing = await db.select().from(customers).where(eq(customers.phone, body.phone)).limit(1)
    
    if (existing.length > 0) {
      // Update existing customer's stats
      const updated = await db.update(customers)
        .set({
          name: body.name || existing[0].name,
          address: body.address || existing[0].address,
          totalOrders: sql`${customers.totalOrders} + 1`,
          totalSpent: sql`${customers.totalSpent} + ${body.totalSpent || 0}`,
        })
        .where(eq(customers.id, existing[0].id))
        .returning()
      
      return NextResponse.json({
        success: true,
        data: updated[0],
        isNew: false
      })
    }
    
    // Create new customer
    const newCustomer = await db.insert(customers).values({
      name: body.name,
      phone: body.phone,
      address: body.address,
      email: body.email,
      totalOrders: 1,
      totalSpent: body.totalSpent || 0,
    }).returning()
    
    return NextResponse.json({
      success: true,
      data: newCustomer[0],
      isNew: true
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create customer' },
      { status: 500 }
    )
  }
}

// PUT /api/customers - Update customer (Admin only)
export async function PUT(request: NextRequest) {
  try {
    // Authentication required for updating customer data
    const isAuthenticated = await isApiAuthenticated()
    if (!isAuthenticated) {
      return authErrorResponse()
    }

    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Customer ID is required' },
        { status: 400 }
      )
    }
    
    const updated = await db.update(customers)
      .set({
        name: updateData.name,
        address: updateData.address,
        email: updateData.email,
      })
      .where(eq(customers.id, id))
      .returning()
    
    if (updated.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: updated[0]
    })
  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update customer' },
      { status: 500 }
    )
  }
}
