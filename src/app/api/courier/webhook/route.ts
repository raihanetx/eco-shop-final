import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { orders, settings } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { decrypt } from '@/lib/security'

/**
 * Steadfast Courier Webhook Handler
 * 
 * Receives status updates from Steadfast Courier API
 * Endpoint: POST /api/courier/webhook
 * 
 * Webhook payload types:
 * 1. delivery_status - Delivery status updates
 * 2. tracking_update - Tracking updates
 * 
 * SECURITY: Requires authentication via one of:
 * - STEADFAST_API_KEY environment variable (Bearer token)
 * - Courier credentials stored in database settings
 */

interface WebhookPayload {
  notification_type: 'delivery_status' | 'tracking_update'
  consignment_id: number
  invoice: string
  cod_amount?: number
  status?: string
  delivery_charge?: number
  tracking_message?: string
  updated_at?: string
}

/**
 * Get courier API key - check environment first, then database
 */
async function getCourierApiKey(): Promise<string | null> {
  // First check environment variable
  if (process.env.STEADFAST_API_KEY) {
    return process.env.STEADFAST_API_KEY
  }
  
  // Then check database settings
  try {
    // FIX: Use correct column name - steadfastApiKey, not courierApiKey
    const result = await db.select({ apiKey: settings.steadfastApiKey })
      .from(settings)
      .where(eq(settings.id, 1))
      .limit(1)
    
    if (result.length > 0 && result[0].apiKey) {
      // Decrypt if encrypted
      return decrypt(result[0].apiKey) || result[0].apiKey
    }
  } catch (error) {
    console.error('[Webhook] Error fetching API key from database:', error)
  }
  
  return null
}

/**
 * Verify webhook signature from Steadfast
 * Uses Bearer token authentication
 */
async function verifyWebhookSignature(
  authHeader: string | null
): Promise<{ valid: boolean; reason?: string }> {
  // Get API key from env or database
  const apiKey = await getCourierApiKey()
  
  if (!apiKey) {
    return { 
      valid: false, 
      reason: 'Courier API key not configured. Set STEADFAST_API_KEY in environment or save credentials in admin settings.' 
    }
  }
  
  if (!authHeader) {
    return { valid: false, reason: 'Missing Authorization header' }
  }
  
  try {
    // Extract Bearer token
    if (!authHeader.startsWith('Bearer ')) {
      return { valid: false, reason: 'Invalid Authorization header format. Expected: Bearer <token>' }
    }
    
    const token = authHeader.replace('Bearer ', '')
    
    // Constant-time comparison to prevent timing attacks
    const expectedBytes = Buffer.from(apiKey, 'utf8')
    const providedBytes = Buffer.from(token, 'utf8')
    
    if (expectedBytes.length !== providedBytes.length) {
      return { valid: false, reason: 'Invalid authentication token' }
    }
    
    // Use timing-safe comparison (Node.js crypto.timingSafeEqual)
    const isValid = crypto.timingSafeEqual(expectedBytes, providedBytes)
    
    return { valid: isValid, reason: isValid ? undefined : 'Invalid authentication token' }
  } catch (error) {
    console.error('[Webhook] Signature verification error:', error)
    return { valid: false, reason: 'Authentication verification failed' }
  }
}

// Import crypto for timing-safe comparison
import crypto from 'crypto'

// Map Steadfast statuses to our internal statuses
function mapCourierStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'pending',
    'in_review': 'in_review',
    'delivered_approval_pending': 'delivered_approval_pending',
    'partial_delivered_approval_pending': 'partial_delivered_approval_pending',
    'cancelled_approval_pending': 'cancelled_approval_pending',
    'unknown_approval_pending': 'unknown_approval_pending',
    'delivered': 'delivered',
    'partial_delivered': 'partial_delivered',
    'cancelled': 'cancelled',
    'hold': 'hold',
    'unknown': 'unknown',
  }
  return statusMap[status?.toLowerCase()] || status
}

export async function POST(request: NextRequest) {
  try {
    // Get Authorization header
    const authHeader = request.headers.get('Authorization')
    
    // SECURITY: Always verify authentication - no bypass allowed
    const verification = await verifyWebhookSignature(authHeader)
    
    if (!verification.valid) {
      console.error('[Webhook] Rejected:', verification.reason)
      return NextResponse.json(
        { status: 'error', message: verification.reason || 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Get raw body
    const rawBody = await request.text()
    const body: WebhookPayload = JSON.parse(rawBody)
    
    console.log('[Webhook] Received from Steadfast:', JSON.stringify(body, null, 2))
    
    // Validate required fields
    if (!body.consignment_id && !body.invoice) {
      return NextResponse.json(
        { status: 'error', message: 'Missing consignment_id or invoice' },
        { status: 400 }
      )
    }
    
    // Find the order by consignment_id or invoice
    let order
    if (body.consignment_id) {
      const result = await db.select().from(orders)
        .where(eq(orders.consignmentId, body.consignment_id))
        .limit(1)
      order = result[0]
    }
    
    if (!order && body.invoice) {
      const result = await db.select().from(orders)
        .where(eq(orders.id, body.invoice))
        .limit(1)
      order = result[0]
    }
    
    if (!order) {
      console.log('[Webhook] Order not found for:', body.consignment_id || body.invoice)
      return NextResponse.json(
        { status: 'error', message: 'Order not found' },
        { status: 404 }
      )
    }
    
    // Handle delivery_status notification
    if (body.notification_type === 'delivery_status') {
      const courierStatus = mapCourierStatus(body.status || '')
      
      // Update order with new status
      const updateData: Record<string, unknown> = {
        courierStatus,
        updatedAt: new Date(),
      }
      
      // If delivered, record delivery time
      if (body.status?.toLowerCase() === 'delivered') {
        updateData.courierDeliveredAt = body.updated_at || new Date().toISOString()
      }
      
      // If cancelled, also update order status
      if (body.status?.toLowerCase() === 'cancelled') {
        updateData.status = 'canceled'
        updateData.canceledBy = 'Courier'
      }
      
      await db.update(orders)
        .set(updateData)
        .where(eq(orders.id, order.id))
      
      console.log(`[Webhook] Updated order ${order.id} status to ${courierStatus}`)
      
      return NextResponse.json({
        status: 'success',
        message: 'Webhook received successfully.',
        orderId: order.id,
        courierStatus,
      })
    }
    
    // Handle tracking_update notification
    if (body.notification_type === 'tracking_update') {
      console.log(`[Webhook] Tracking update for order ${order.id}: ${body.tracking_message}`)
      
      return NextResponse.json({
        status: 'success',
        message: 'Tracking update received.',
        orderId: order.id,
        trackingMessage: body.tracking_message,
      })
    }
    
    // Unknown notification type
    return NextResponse.json({
      status: 'success',
      message: 'Webhook received.',
    })
    
  } catch (error) {
    console.error('[Webhook] Error processing webhook:', error)
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET for webhook verification/health check
export async function GET() {
  // Check if courier is configured (without revealing credentials)
  const apiKey = await getCourierApiKey()
  
  return NextResponse.json({
    status: 'success',
    message: 'Steadfast webhook endpoint is active',
    configured: !!apiKey,
    timestamp: new Date().toISOString(),
  })
}
