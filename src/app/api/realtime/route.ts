import { NextRequest } from 'next/server'
import { isApiAuthenticated } from '@/lib/api-auth'

// ============================================
// SERVER-SENT EVENTS (SSE) FOR REAL-TIME PUSH
// ============================================

// Store connected clients
const clients = new Set<WritableStreamDefaultWriter>()

// Event queue for each client (in case they miss events)
const eventQueue = new Map<WritableStreamDefaultWriter, any[]>()
const MAX_QUEUE_SIZE = 10

// Track active connections count
let connectionCount = 0

export async function GET(request: NextRequest) {
  // Create a TransformStream for SSE
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

  // Register this client
  clients.add(writer)
  connectionCount++
  eventQueue.set(writer, [])

  console.log(`[RealTime] Client connected. Total: ${connectionCount}`)

  // Send initial connection message
  const encoder = new TextEncoder()

  // Helper to send SSE event
  const sendEvent = async (event: any) => {
    try {
      await writer.write(
        encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
      )
    } catch {
      // Client disconnected
    }
  }

  // Send connection established event
  await sendEvent({ type: 'CONNECTED', timestamp: Date.now() })

  // Heartbeat to keep connection alive (every 30 seconds)
  const heartbeatInterval = setInterval(async () => {
    try {
      await writer.write(encoder.encode(': heartbeat\n\n'))
    } catch {
      clearInterval(heartbeatInterval)
    }
  }, 30000)

  // Return the readable stream
  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  })
}

// ============================================
// BROADCAST FUNCTIONS - Call these from other API routes
// ============================================

// Broadcast to all connected clients
export async function broadcast(event: any) {
  const encoder = new TextEncoder()
  const message = `data: ${JSON.stringify(event)}\n\n`

  const deadClients: WritableStreamDefaultWriter[] = []

  for (const client of clients) {
    try {
      await client.write(encoder.encode(message))
    } catch {
      // Client is dead, mark for removal
      deadClients.push(client)
    }
  }

  // Clean up dead clients
  deadClients.forEach(client => {
    clients.delete(client)
    eventQueue.delete(client)
    connectionCount--
  })

  console.log(`[RealTime] Broadcast "${event.type}" to ${clients.size} clients`)
}

// Broadcast stock update
export async function broadcastStockUpdate(productId: number, stock: number, variantId?: number) {
  await broadcast({
    type: 'STOCK_UPDATED',
    productId,
    stock,
    variantId,
    timestamp: Date.now(),
  })
}

// Broadcast new order
export async function broadcastNewOrder(orderId: string | number, order: any) {
  await broadcast({
    type: 'NEW_ORDER',
    orderId,
    order,
    timestamp: Date.now(),
  })
}

// Broadcast order status change
export async function broadcastOrderStatusChange(orderId: string | number, status: string) {
  await broadcast({
    type: 'ORDER_STATUS_CHANGED',
    orderId,
    status,
    timestamp: Date.now(),
  })
}

// Broadcast new review
export async function broadcastNewReview(productId: number, review: any) {
  await broadcast({
    type: 'NEW_REVIEW',
    productId,
    review,
    timestamp: Date.now(),
  })
}

// Broadcast cache invalidation (when static data changes)
export async function broadcastCacheInvalidate(keys: string[]) {
  await broadcast({
    type: 'CACHE_INVALIDATE',
    keys,
    timestamp: Date.now(),
  })
}

// Broadcast settings update
export async function broadcastSettingsUpdate(settings: Record<string, any>) {
  await broadcast({
    type: 'SETTINGS_UPDATED',
    settings,
    timestamp: Date.now(),
  })
}

// Broadcast abandoned checkout
export async function broadcastAbandonedCheckout(checkoutId: number, checkout: any) {
  await broadcast({
    type: 'ABANDONED_CHECKOUT',
    checkoutId,
    checkout,
    timestamp: Date.now(),
  })
}

// Get connection stats
export function getConnectionStats() {
  return {
    activeConnections: clients.size,
    totalConnections: connectionCount,
  }
}

// Clean up function for graceful shutdown
export function cleanup() {
  for (const client of clients) {
    try {
      client.close()
    } catch {}
  }
  clients.clear()
  eventQueue.clear()
  connectionCount = 0
}
