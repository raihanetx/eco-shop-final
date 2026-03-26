import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { orders } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { steadfastService } from '@/lib/steadfast'
import { isApiAuthenticated, authErrorResponse } from '@/lib/api-auth'

// GET /api/courier - Check balance, status, or configuration (Protected: Admin only)
export async function GET(request: NextRequest) {
  // Authentication required
  if (!await isApiAuthenticated()) {
    return authErrorResponse()
  }

  const searchParams = request.nextUrl.searchParams
  const action = searchParams.get('action')
  
  try {
    // Check if Steadfast is configured
    const isConfigured = await steadfastService.isConfiguredAsync()
    if (!isConfigured) {
      return NextResponse.json({
        success: false,
        error: 'Steadfast API credentials not configured. Please add STEADFAST_API_KEY and STEADFAST_SECRET_KEY to environment variables or save them in Credentials settings.',
      }, { status: 400 })
    }
    
    // Check balance
    if (action === 'balance') {
      const result = await steadfastService.getBalance()
      
      if (!result) {
        return NextResponse.json(
          { success: false, error: 'Failed to fetch balance from Steadfast' },
          { status: 500 }
        )
      }
      
      return NextResponse.json({
        success: true,
        balance: result.current_balance || 0,
      })
    }
    
    // Check status by consignment ID
    if (action === 'status' && searchParams.get('consignmentId')) {
      const consignmentId = parseInt(searchParams.get('consignmentId') || '0')
      const result = await steadfastService.getStatusByConsignmentId(consignmentId)
      
      return NextResponse.json({
        success: !!result,
        data: result,
      })
    }
    
    // Check status by invoice (order ID)
    if (action === 'status' && searchParams.get('invoice')) {
      const invoice = searchParams.get('invoice') || ''
      const result = await steadfastService.getStatusByInvoice(invoice)
      
      return NextResponse.json({
        success: !!result,
        data: result,
      })
    }
    
    // Check status by tracking code
    if (action === 'status' && searchParams.get('trackingCode')) {
      const trackingCode = searchParams.get('trackingCode') || ''
      const result = await steadfastService.getStatusByTrackingCode(trackingCode)
      
      return NextResponse.json({
        success: !!result,
        data: result,
      })
    }
    
    // Get configuration status
    if (action === 'config') {
      const configured = await steadfastService.isConfiguredAsync()
      return NextResponse.json({
        success: true,
        configured,
      })
    }
    
    // Verify credentials with Steadfast API
    if (action === 'verify') {
      const result = await steadfastService.verifyCredentials()
      return NextResponse.json({
        success: result.valid,
        message: result.message,
        balance: result.balance,
      })
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid action. Use: balance, status, config' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Courier API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

// POST /api/courier - Create order with Steadfast (Protected: Admin only)
export async function POST(request: NextRequest) {
  try {
    // Authentication required
    if (!await isApiAuthenticated()) {
      return authErrorResponse()
    }

    // Check if Steadfast is configured
    const isConfigured = await steadfastService.isConfiguredAsync()
    if (!isConfigured) {
      return NextResponse.json({
        success: false,
        error: 'Steadfast API credentials not configured. Please configure them in Admin > Credentials.',
      }, { status: 400 })
    }

    const body = await request.json()
    const { orderId } = body
    
    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      )
    }
    
    // Get the order from database
    const orderResult = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1)
    
    if (orderResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }
    
    const order = orderResult[0]
    
    // Check if already sent to courier
    if (order.consignmentId) {
      return NextResponse.json({
        success: true,
        message: 'Order already sent to courier',
        consignment: {
          consignmentId: order.consignmentId,
          trackingCode: order.trackingCode,
          status: order.courierStatus
        },
      })
    }
    
    // Validate phone number (must be 11 digits)
    let phone = order.phone.replace(/[^0-9]/g, '')
    console.log('[Courier] Original phone:', order.phone)
    console.log('[Courier] Cleaned phone:', phone)
    if (phone.length > 11) {
      phone = phone.slice(-11) // Take last 11 digits
    } else if (phone.length < 11) {
      phone = phone.padStart(11, '0')
    }
    console.log('[Courier] Final phone:', phone)
    
    // Prepare order data for Steadfast
    const orderData = {
      invoice: order.id,
      recipient_name: order.customerName,
      recipient_phone: phone,
      recipient_address: order.address,
      cod_amount: parseFloat(String(order.total)) || 0,
      note: `Payment: ${order.paymentMethod}`,
    }
    console.log('[Courier] Sending to Steadfast:', JSON.stringify(orderData, null, 2))
    
    // Send to Steadfast
    const result = await steadfastService.createOrder(orderData)
    
    if (result.status !== 200 || !result.consignment) {
      return NextResponse.json(
        { success: false, error: result.message || 'Failed to create consignment' },
        { status: 400 }
      )
    }
    
    // Update order with consignment details
    const consignment = result.consignment
    await db.update(orders)
      .set({
        consignmentId: consignment.consignment_id,
        trackingCode: consignment.tracking_code,
        courierStatus: consignment.status || 'in_review',
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
    
    return NextResponse.json({
      success: true,
      message: result.message || 'Order sent to courier successfully',
      consignment: {
        consignmentId: consignment.consignment_id,
        trackingCode: consignment.tracking_code,
        status: consignment.status,
      },
    })
  } catch (error) {
    console.error('Create courier order error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
