import { NextRequest } from 'next/server'

// ============================================
// DELTA SYNC - Server-Sent Events Endpoint
// Server pushes ONLY changes - NO polling needed!
// ============================================

// Store connected clients
const clients = new Set<WritableStreamDefaultWriter>()
let connectionCount = 0

export async function GET(request: NextRequest) {
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

  clients.add(writer)
  connectionCount++

  console.log(`[DeltaSync] Client connected. Total: ${connectionCount}`)

  const encoder = new TextEncoder()

  // Send connection confirmation
  const sendEvent = async (event: any) => {
    try {
      await writer.write(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
    } catch {
      // Client disconnected
    }
  }

  await sendEvent({ type: 'CONNECTED', timestamp: Date.now() })

  // Heartbeat every 30 seconds to keep connection alive
  const heartbeat = setInterval(async () => {
    try {
      await writer.write(encoder.encode(': heartbeat\n\n'))
    } catch {
      clearInterval(heartbeat)
    }
  }, 30000)

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

// ============================================
// BROADCAST FUNCTIONS - Send ONLY what changed
// ============================================

// Helper to broadcast to all clients
async function broadcast(event: any) {
  const encoder = new TextEncoder()
  const message = `data: ${JSON.stringify(event)}\n\n`
  const deadClients: WritableStreamDefaultWriter[] = []

  for (const client of clients) {
    try {
      await client.write(encoder.encode(message))
    } catch {
      deadClients.push(client)
    }
  }

  // Clean up dead clients
  deadClients.forEach(c => {
    clients.delete(c)
    connectionCount--
  })

  console.log(`[DeltaSync] Pushed "${event.type}" to ${clients.size} clients`)
}

// ============================================
// PRODUCT BROADCASTS
// ============================================

export async function broadcastProductCreated(product: any) {
  await broadcast({ type: 'PRODUCT_CREATED', product })
}

export async function broadcastProductUpdated(product: any) {
  await broadcast({ type: 'PRODUCT_UPDATED', product })
}

export async function broadcastProductDeleted(productId: number) {
  await broadcast({ type: 'PRODUCT_DELETED', productId })
}

// ============================================
// CATEGORY BROADCASTS
// ============================================

export async function broadcastCategoryCreated(category: any) {
  await broadcast({ type: 'CATEGORY_CREATED', category })
}

export async function broadcastCategoryUpdated(category: any) {
  await broadcast({ type: 'CATEGORY_UPDATED', category })
}

export async function broadcastCategoryDeleted(categoryId: string) {
  await broadcast({ type: 'CATEGORY_DELETED', categoryId })
}

// ============================================
// STOCK BROADCASTS - Only stock data, not full product
// ============================================

export async function broadcastStockChanged(productId: number, stock: number, variantId?: number) {
  await broadcast({ type: 'STOCK_CHANGED', productId, stock, variantId })
}

// ============================================
// ORDER BROADCASTS
// ============================================

export async function broadcastOrderCreated(order: any) {
  await broadcast({ type: 'ORDER_CREATED', order })
}

export async function broadcastOrderStatusChanged(orderId: string, status: string, courierStatus?: string) {
  await broadcast({ type: 'ORDER_STATUS_CHANGED', orderId, status, courierStatus })
}

export async function broadcastOrderUpdated(order: any) {
  await broadcast({ type: 'ORDER_UPDATED', order })
}

// ============================================
// REVIEW BROADCASTS
// ============================================

export async function broadcastReviewCreated(productId: number, review: any) {
  await broadcast({ type: 'REVIEW_CREATED', productId, review })
}

// ============================================
// SETTINGS BROADCASTS - Send only changed fields
// ============================================

export async function broadcastSettingsChanged(changes: Record<string, any>) {
  await broadcast({ type: 'SETTINGS_CHANGED', changes })
}

// ============================================
// COUPON BROADCASTS
// ============================================

export async function broadcastCouponCreated(coupon: any) {
  await broadcast({ type: 'COUPON_CREATED', coupon })
}

export async function broadcastCouponUpdated(coupon: any) {
  await broadcast({ type: 'COUPON_UPDATED', coupon })
}

export async function broadcastCouponDeleted(couponId: string) {
  await broadcast({ type: 'COUPON_DELETED', couponId })
}

// Get connection stats
export function getConnectionStats() {
  return { activeConnections: clients.size, totalConnections: connectionCount }
}

// Cleanup
export function cleanup() {
  clients.forEach(c => { try { c.close() } catch {} })
  clients.clear()
  connectionCount = 0
}
