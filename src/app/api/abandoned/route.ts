import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { abandonedCheckouts } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { isApiAuthenticated, authErrorResponse } from '@/lib/api-auth'

// Helper: Get Bangladesh date and time directly
function getBangladeshDateTime(): { date: string; time: string } {
  const now = new Date()
  
  // Get Bangladesh date
  const date = now.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric',
    timeZone: 'Asia/Dhaka'
  })
  
  // Get Bangladesh time
  const time = now.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Dhaka'
  })
  
  return { date, time }
}

// Helper: Calculate time ago
function getTimeAgo(dateStr: string, timeStr: string): string {
  try {
    // Parse the time string (e.g., "10:25 AM")
    const now = new Date()
    const nowBD = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }))
    
    // Create visit date by combining date string with time
    const visitStr = `${dateStr} ${timeStr}`
    const visitDate = new Date(visitStr)
    
    const diffMs = nowBD.getTime() - visitDate.getTime()
    
    if (diffMs < 0) return 'Just now'
    
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffDays > 0) return `${diffDays}d ago`
    if (diffHours > 0) return `${diffHours}h ago`
    if (diffMins > 0) return `${diffMins}m ago`
    return 'Just now'
  } catch {
    return 'Just now'
  }
}

// GET: Get all abandoned checkouts GROUPED BY SESSION ID (Admin only)
export async function GET() {
  try {
    // Authentication required - abandoned cart data is business sensitive
    const isAuthenticated = await isApiAuthenticated()
    if (!isAuthenticated) {
      return authErrorResponse()
    }

    const allRecords = await db.select().from(abandonedCheckouts).orderBy(desc(abandonedCheckouts.createdAt))
    
    const sessionGroups = new Map<string, typeof allRecords>()
    
    for (const record of allRecords) {
      const key = record.sessionId
      if (!sessionGroups.has(key)) {
        sessionGroups.set(key, [])
      }
      sessionGroups.get(key)!.push(record)
    }
    
    const result = Array.from(sessionGroups.entries()).map(([sessionId, records], index) => {
      const sorted = [...records].sort((a, b) => {
        const timeA = new Date(a.createdAt || 0).getTime()
        const timeB = new Date(b.createdAt || 0).getTime()
        return timeB - timeA
      })
      
      const latest = sorted[0]
      const totalVisits = records.length
      const completedCount = records.filter(r => r.status === 'completed').length
      
      const history = sorted.map(r => {
        let products = []
        try {
          products = r.items ? JSON.parse(r.items) : []
        } catch { products = [] }
        
        // Read actual checkout duration from database
        const checkoutSeconds = r.checkoutSeconds || 0
        
        return {
          id: r.id,
          visitNumber: r.visitNumber || 1,
          date: r.visitDate,
          time: r.visitTime,
          timeAgo: getTimeAgo(r.visitDate, r.visitTime),
          status: r.status as 'abandoned' | 'completed',
          products,
          total: r.total || 0,
          name: r.name,
          phone: r.phone,
          address: r.address,
          completedOrderId: r.completedOrderId,
          checkoutSeconds
        }
      })
      
      return {
        id: index + 1,
        sessionId,
        name: latest.name || 'Unknown',
        phone: latest.phone || '',
        address: latest.address || '',
        visitTime: latest.visitTime,
        visitDate: latest.visitDate,
        totalVisits,
        completedOrders: completedCount,
        history
      }
    })
    
    return NextResponse.json({ success: true, data: result, count: result.length })
  } catch (error) {
    console.error('Error fetching abandoned:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch', data: [], count: 0 }, { status: 500 })
  }
}

// POST: Create new visit OR update existing visit with customer info (Public - used during checkout)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, name, phone, address, items, subtotal, delivery, total, isNewVisit } = body
    
    console.log('📥 POST abandoned:', { sessionId, isNewVisit, name, phone, itemsCount: items?.length })
    
    if (!sessionId || !items || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }
    
    // Get current Bangladesh time
    const { date, time } = getBangladeshDateTime()
    
    if (isNewVisit) {
      // Count existing visits for this session
      const existing = await db.select().from(abandonedCheckouts).where(eq(abandonedCheckouts.sessionId, sessionId))
      const nextVisitNumber = existing.length + 1
      
      // Record checkout start time (use provided time or current time)
      const checkoutStartTime = body.checkoutStartedAt ? new Date(body.checkoutStartedAt) : new Date()
      
      const newRecord = await db.insert(abandonedCheckouts).values({
        sessionId,
        visitNumber: nextVisitNumber,
        name: name || null,
        phone: phone || null,
        address: address || null,
        items: JSON.stringify(items),
        subtotal: subtotal || 0,
        delivery: delivery || 0,
        total: total || 0,
        status: 'abandoned',
        completedOrderId: null,
        visitDate: date,
        visitTime: time,
        checkoutStartedAt: checkoutStartTime,
      }).returning()
      
      console.log('✅ Created visit #' + nextVisitNumber + ' at', time, date)
      
      return NextResponse.json({ success: true, data: newRecord[0] }, { status: 201 })
      
    } else {
      // UPDATE LATEST VISIT with customer info
      const latest = await db.select().from(abandonedCheckouts)
        .where(eq(abandonedCheckouts.sessionId, sessionId))
        .orderBy(desc(abandonedCheckouts.createdAt))
        .limit(1)
      
      if (latest.length === 0) {
        return NextResponse.json({ success: false, error: 'No visit found to update' }, { status: 404 })
      }
      
      const updated = await db.update(abandonedCheckouts)
        .set({
          name: name || latest[0].name,
          phone: phone || latest[0].phone,
          address: address || latest[0].address,
          items: JSON.stringify(items),
          subtotal: subtotal ?? latest[0].subtotal,
          delivery: delivery ?? latest[0].delivery,
          total: total ?? latest[0].total,
        })
        .where(eq(abandonedCheckouts.id, latest[0].id))
        .returning()
      
      console.log('📝 Updated visit with customer info:', { name, phone, address })
      
      return NextResponse.json({ success: true, data: updated[0] })
    }
  } catch (error) {
    console.error('Error in POST abandoned:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed: ' + (error instanceof Error ? error.message : String(error)) 
    }, { status: 500 })
  }
}

// PATCH: Mark ONLY the LATEST visit as completed (Public - used during checkout completion)
export async function PATCH(request: NextRequest) {
  try {
    const { sessionId, completedOrderId } = await request.json()
    
    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'Session ID required' }, { status: 400 })
    }
    
    // Find ONLY the latest visit for this session
    const latestVisit = await db.select()
      .from(abandonedCheckouts)
      .where(eq(abandonedCheckouts.sessionId, sessionId))
      .orderBy(desc(abandonedCheckouts.createdAt))
      .limit(1)
    
    if (latestVisit.length === 0) {
      return NextResponse.json({ success: false, error: 'No visit found' }, { status: 404 })
    }
    
    // Calculate checkout duration
    const endTime = new Date()
    const startTime = latestVisit[0].checkoutStartedAt
    let checkoutSeconds = 0
    
    if (startTime) {
      const diffMs = endTime.getTime() - new Date(startTime).getTime()
      checkoutSeconds = Math.floor(diffMs / 1000)
    }
    
    // Mark ONLY the latest visit as completed with duration
    const updated = await db.update(abandonedCheckouts)
      .set({ 
        status: 'completed', 
        completedOrderId,
        checkoutEndedAt: endTime,
        checkoutSeconds: checkoutSeconds
      })
      .where(eq(abandonedCheckouts.id, latestVisit[0].id))
      .returning()
    
    console.log('✅ Marked Visit #' + latestVisit[0].visitNumber + ' as completed (duration: ' + checkoutSeconds + 's)')
    
    return NextResponse.json({ success: true, data: updated[0] })
  } catch (error) {
    console.error('Error in PATCH abandoned:', error)
    return NextResponse.json({ success: false, error: 'Failed to update' }, { status: 500 })
  }
}
