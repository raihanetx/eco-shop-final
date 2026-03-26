import { NextRequest, NextResponse } from 'next/server'
import { db, getCachedDashboard, setCachedDashboard } from '@/db'
import { neon } from '@neondatabase/serverless'
import { 
  orders, orderItems, products, productViews, cartEvents, visitorSessions, abandonedCheckouts
} from '@/db/schema'
import { eq, gte, sql, and, gte as gteDate, inArray } from 'drizzle-orm'
import { isApiAuthenticated, authErrorResponse } from '@/lib/api-auth'

// Get database URL from environment variable (SECURE)
const DATABASE_URL = process.env.DATABASE_URL

// Cache TTL: 30 seconds
const CACHE_TTL = 30 * 1000

// Helper function to format duration
function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0s'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`
  } else {
    return `${secs}s`
  }
}

// GET /api/dashboard - SMART: Global cache + parallel queries (Admin only)
export async function GET(request: NextRequest) {
  // Authentication required - dashboard data is sensitive
  if (!await isApiAuthenticated()) {
    return authErrorResponse()
  }
  const searchParams = request.nextUrl.searchParams
  const timeFrame = searchParams.get('timeFrame') || '30d'

  const now = Date.now()
  
  // Check global cache
  const cached = getCachedDashboard(timeFrame)
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return NextResponse.json({
      success: true,
      cached: true,
      data: cached.data
    })
  }

  try {
    // Calculate date range
    const currentDate = new Date()
    let days = 30
    if (timeFrame === 'today') days = 1
    else if (timeFrame === '7d') days = 7
    else if (timeFrame === '15d') days = 15
    else if (timeFrame === '30d') days = 30
    else if (timeFrame === '45d') days = 45
    else if (timeFrame === '3m') days = 90
    else if (timeFrame === '6m') days = 180
    else if (timeFrame === '1y') days = 365

    const startDate = new Date(currentDate)
    startDate.setDate(startDate.getDate() - (days - 1))
    startDate.setHours(0, 0, 0, 0)
    const startDateStr = startDate.toISOString().split('T')[0]

    // SMART: ALL queries in PARALLEL with error handling for missing tables
    let allOrders: any[] = []
    let allProductViews: any[] = []
    let allOrderItems: any[] = []
    let allProducts: any[] = []
    let cartAdditions: any[] = []
    let allVisitorSessions: any[] = []
    let allAbandonedCheckouts: any[] = []

    try {
      [allOrders, allProductViews, allOrderItems, allProducts, cartAdditions, allVisitorSessions, allAbandonedCheckouts] = await Promise.all([
        db.select().from(orders).catch(() => []),
        db.select().from(productViews).where(gte(productViews.date, startDateStr)).catch(() => []),
        db.select().from(orderItems).catch(() => []),
        db.select().from(products).catch(() => []),
        db.select().from(cartEvents).where(eq(cartEvents.action, 'add')).catch(() => []),
        db.select().from(visitorSessions).where(gte(visitorSessions.date, startDateStr)).catch(() => []),
        db.select().from(abandonedCheckouts).where(gte(abandonedCheckouts.visitDate, startDateStr)).catch(() => []),
      ])
    } catch (queryError) {
      console.log('[DASHBOARD] Some tables may not exist yet, returning empty data')
    }

    // ============================================
    // REAL SESSION ANALYTICS (from session_analytics table)
    // ============================================
    let sessionAnalyticsData = {
      avgSessionDuration: '0s',
      avgSessionSeconds: 0,
      bounceRate: 0,
      totalSessions: 0,
      bouncedSessions: 0,
      totalCartAdds: 0,
      totalCartRemoves: 0,
    }

    // Fetch from session_analytics table using raw SQL
    if (DATABASE_URL) {
      try {
        const sql = neon(DATABASE_URL)
        
        // Check if table exists
        const tableCheck = await sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'session_analytics'
          )
        `
        
        if (tableCheck[0]?.exists) {
          // Session duration stats
          const durationStats = await sql`
            SELECT 
              AVG(duration_seconds) as avg_duration,
              COUNT(*) as total_sessions
            FROM session_analytics 
            WHERE date >= ${startDateStr} AND duration_seconds > 0
          `
          
          // Bounce rate stats - A bounce is: page_views <= 1 AND duration < 10 seconds
          // Bounce = visitor came and left quickly without engaging
          const bounceStats = await sql`
            SELECT 
              COUNT(*) as total_sessions,
              SUM(CASE 
                WHEN is_bounced = true THEN 1 
                WHEN page_views <= 1 AND duration_seconds < 10 THEN 1 
                ELSE 0 
              END) as bounced_sessions
            FROM session_analytics 
            WHERE date >= ${startDateStr}
          `
          
          // Cart stats from session_analytics
          const cartStatsFromSession = await sql`
            SELECT 
              SUM(cart_adds) as total_adds,
              SUM(cart_removes) as total_removes
            FROM session_analytics 
            WHERE date >= ${startDateStr}
          `

          const avgSeconds = Math.round(durationStats[0]?.avg_duration || 0)
          const totalSessionsCount = parseInt(bounceStats[0]?.total_sessions || 0)
          const bouncedSessionsCount = parseInt(bounceStats[0]?.bounced_sessions || 0)
          
          sessionAnalyticsData = {
            avgSessionDuration: formatDuration(avgSeconds),
            avgSessionSeconds: avgSeconds,
            bounceRate: totalSessionsCount > 0 ? Math.round((bouncedSessionsCount / totalSessionsCount) * 100) : 0,
            totalSessions: totalSessionsCount,
            bouncedSessions: bouncedSessionsCount,
            totalCartAdds: parseInt(cartStatsFromSession[0]?.total_adds || 0),
            totalCartRemoves: parseInt(cartStatsFromSession[0]?.total_removes || 0),
          }
        }
      } catch (sessionError) {
        console.error('Session analytics query error:', sessionError)
        // Continue with default values
      }
    }

    // Cart actions per product (from cart_events table)
    let cartActionsPerProduct: Array<{ productName: string; cartAdds: number; cartRemoves: number }> = []
    if (DATABASE_URL) {
      try {
        const sql = neon(DATABASE_URL)
        const cartProductStats = await sql`
          SELECT 
            p.name as product_name,
            COUNT(CASE WHEN ce.action = 'add' THEN 1 END) as cart_adds,
            COUNT(CASE WHEN ce.action = 'remove' THEN 1 END) as cart_removes
          FROM cart_events ce
          JOIN products p ON ce.product_id = p.id
          WHERE ce.date >= ${startDateStr}
          GROUP BY p.id, p.name
          ORDER BY cart_adds DESC
          LIMIT 10
        `
        cartActionsPerProduct = cartProductStats.map((row: any) => ({
          productName: row.product_name,
          cartAdds: parseInt(row.cart_adds || 0),
          cartRemoves: parseInt(row.cart_removes || 0),
        }))
      } catch (cartError) {
        console.error('Cart actions per product query error:', cartError)
      }
    }

    // Filter orders by time frame (in memory)
    const filteredOrders = allOrders.filter(o => {
      if (!o.createdAt) return false
      return new Date(o.createdAt) >= startDate
    })

    const approvedOrders = filteredOrders.filter(o => o.status === 'approved')
    const approvedOrderIds = new Set(approvedOrders.map(o => o.id))

    // Calculate revenue
    const totalRevenue = approvedOrders.reduce((sum, o) => {
      return sum + Math.round(parseFloat(String(o.total)) || 0)
    }, 0)

    const totalOrdersCount = approvedOrders.length
    const pendingOrdersCount = filteredOrders.filter(o => o.status === 'pending').length
    const canceledOrdersCount = filteredOrders.filter(o => o.status === 'canceled').length

    // ============================================
    // VISITOR METRICS (from visitorSessions table)
    // ============================================
    
    // Total Visits = all session records in the period (each record = 1 visit)
    const totalVisits = allVisitorSessions.length
    
    // Unique Visitors = distinct sessionIds (unique people/browser sessions)
    const uniqueVisitorSet = new Set(allVisitorSessions.map(s => s.sessionId))
    const uniqueVisitors = uniqueVisitorSet.size
    
    // ============================================
    // NEW vs REPEAT VISITOR LOGIC (SIMPLE & CORRECT)
    // ============================================
    // Total Visitors = New Visitors + Repeat Visitors
    // New Visitor = First time EVER on website (their FIRST visit is in this period)
    // Repeat Visitor = Had visited BEFORE (their first visit was before this period)
    // Each visitor is EITHER New OR Repeat (mutually exclusive)
    
    // Get ALL historical sessions for these visitors to find their FIRST visit date
    const allSessionsForVisitors = uniqueVisitorSet.size > 0 
      ? await db.select({
          sessionId: visitorSessions.sessionId,
          date: visitorSessions.date
        })
          .from(visitorSessions)
          .where(inArray(visitorSessions.sessionId, Array.from(uniqueVisitorSet)))
      : []
    
    // Find the FIRST (earliest) visit date for each sessionId
    const firstVisitDateBySession: Record<string, string> = {}
    for (const session of allSessionsForVisitors) {
      const sid = session.sessionId
      if (!firstVisitDateBySession[sid] || (session.date && session.date < firstVisitDateBySession[sid])) {
        firstVisitDateBySession[sid] = session.date || ''
      }
    }
    
    // Count New vs Repeat Visitors
    let newVisitorsCount = 0
    let returningVisitorsCount = 0
    
    for (const sessionId of uniqueVisitorSet) {
      const firstVisitDate = firstVisitDateBySession[sessionId] || ''
      
      // If their FIRST EVER visit was in this period = NEW Visitor
      if (firstVisitDate >= startDateStr) {
        newVisitorsCount++
      } 
      // If their FIRST visit was BEFORE this period = REPEAT Visitor (they came back)
      else {
        returningVisitorsCount++
      }
    }
    
    // Verify: Total = New + Repeat
    // uniqueVisitors should equal newVisitorsCount + returningVisitorsCount

    // Device Stats from visitorSessions
    const deviceCounts = { mobile: 0, desktop: 0, tablet: 0 }
    const osCounts = { ios: 0, android: 0, windows: 0, macos: 0, linux: 0, other: 0 }
    const browserCounts = { chrome: 0, safari: 0, firefox: 0, edge: 0, opera: 0, other: 0 }
    
    for (const session of allVisitorSessions) {
      // Device counts
      if (session.deviceType === 'mobile') deviceCounts.mobile++
      else if (session.deviceType === 'desktop') deviceCounts.desktop++
      else if (session.deviceType === 'tablet') deviceCounts.tablet++
      
      // OS counts
      if (session.os === 'ios') osCounts.ios++
      else if (session.os === 'android') osCounts.android++
      else if (session.os === 'windows') osCounts.windows++
      else if (session.os === 'macos') osCounts.macos++
      else if (session.os === 'linux') osCounts.linux++
      else osCounts.other++
      
      // Browser counts
      if (session.browser === 'chrome') browserCounts.chrome++
      else if (session.browser === 'safari') browserCounts.safari++
      else if (session.browser === 'firefox') browserCounts.firefox++
      else if (session.browser === 'edge') browserCounts.edge++
      else if (session.browser === 'opera') browserCounts.opera++
      else browserCounts.other++
    }

    // Customer metrics
    const customerMap: Record<string, { count: number; totalSpent: number; name: string }> = {}
    
    for (const order of allOrders) {
      const phone = order.phone?.replace(/\D/g, '')
      if (phone) {
        if (!customerMap[phone]) {
          customerMap[phone] = { count: 0, totalSpent: 0, name: order.customerName || 'Unknown' }
        }
        customerMap[phone].count += 1
        customerMap[phone].totalSpent += Math.round(parseFloat(String(order.total)) || 0)
        customerMap[phone].name = order.customerName || customerMap[phone].name
      }
    }

    const totalCustomers = Object.keys(customerMap).length
    const repeatCustomersCount = Object.values(customerMap).filter(c => c.count > 1).length
    const newCustomers = totalCustomers - repeatCustomersCount

    const topCustomers = Object.entries(customerMap)
      .map(([phone, data]) => ({
        name: data.name,
        phone: phone,
        totalSpent: data.totalSpent,
        orderCount: data.count
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5)

    // Product views
    const totalViews = allProductViews.reduce((sum, v) => sum + (v.viewCount || 0), 0)
    const uniqueProductsViewed = new Set(allProductViews.map(v => v.productId)).size

    // Product lookup map
    const productLookup = new Map(allProducts.map(p => [p.id, p]))

    // Product sales
    const productSales: Record<string, { name: string; sales: number; revenue: number; category: string }> = {}
    
    for (const item of allOrderItems) {
      if (!approvedOrderIds.has(item.orderId || '')) continue
      
      const name = item.name
      if (!productSales[name]) {
        const product = item.productId ? productLookup.get(item.productId) : null
        productSales[name] = {
          name,
          sales: 0,
          revenue: 0,
          category: product?.category || 'Other'
        }
      }
      productSales[name].sales += item.qty
      productSales[name].revenue += Math.round(parseFloat(String(item.basePrice)) || 0) * item.qty
    }

    const topSellingProducts = Object.values(productSales)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5)

    // Product view counts
    const productViewCounts: Record<number, number> = {}
    for (const v of allProductViews) {
      productViewCounts[v.productId] = (productViewCounts[v.productId] || 0) + (v.viewCount || 0)
    }

    const mostViewedProducts = Object.entries(productViewCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([productId, views]) => {
        const product = productLookup.get(parseInt(productId))
        return product ? {
          name: product.name,
          category: product.category,
          views: views,
        } : null
      })
      .filter(Boolean)

    // Daily stats
    const dailyStats: { date: string; sales: number; revenue: number; orders: number; visitors: number; productViews: number }[] = []
    const interval = (timeFrame === '3m' || timeFrame === '6m') ? 7 : (timeFrame === '1y' ? 14 : 1)
    
    // Visitor sessions by date
    const visitorsByDate: Record<string, number> = {}
    for (const s of allVisitorSessions) {
      const d = s.date || ''
      visitorsByDate[d] = (visitorsByDate[d] || 0) + 1
    }
    
    // Product views by date (for product view stats)
    const viewsByDate: Record<string, number> = {}
    for (const v of allProductViews) {
      const d = v.date || ''
      viewsByDate[d] = (viewsByDate[d] || 0) + (v.viewCount || 0)
    }

    for (let i = days - 1; i >= 0; i -= interval) {
      const date = new Date(currentDate)
      date.setDate(date.getDate() - i)
      const dayStart = new Date(date.setHours(0, 0, 0, 0))
      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)
      const dateStr = dayStart.toISOString().split('T')[0]

      const dayOrders = approvedOrders.filter(o => {
        if (!o.createdAt) return false
        const orderDate = new Date(o.createdAt)
        return orderDate >= dayStart && orderDate <= dayEnd
      })

      dailyStats.push({
        date: dateStr,
        sales: dayOrders.length,
        revenue: dayOrders.reduce((sum, o) => sum + Math.round(parseFloat(String(o.total)) || 0), 0),
        orders: dayOrders.length,
        visitors: visitorsByDate[dateStr] || 0, // REAL: visitor sessions per day
        productViews: viewsByDate[dateStr] || 0, // Product views per day
      })
    }

    // Cart additions
    const filteredCartAdditions = cartAdditions.filter(c => {
      if (!c.date) return false
      return new Date(c.date) >= startDate
    })
    const totalCartAdds = filteredCartAdditions.length

    // Product Views (for product analytics - separate from visitor sessions)
    const totalProductViews = allProductViews.reduce((sum, v) => sum + (v.viewCount || 0), 0)

    // Metrics
    const avgOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0
    // Conversion rate = orders / unique visitors
    const conversionRate = uniqueVisitors > 0 ? (totalOrdersCount / uniqueVisitors) * 100 : 0
    const revPerVisitor = uniqueVisitors > 0 ? totalRevenue / uniqueVisitors : 0
    
    // REAL Abandoned Cart Value - from abandoned_checkouts table (status = 'abandoned')
    const abandonedCartValue = allAbandonedCheckouts
      .filter(c => c.status === 'abandoned')
      .reduce((sum, c) => sum + (parseFloat(String(c.total)) || 0), 0)

    const resultData = {
      totalRevenue,
      totalOrders: totalOrdersCount,
      pendingOrders: pendingOrdersCount,
      canceledOrders: canceledOrdersCount,
      // REAL Abandoned Cart Value from abandoned_checkouts table
      abandonedCartValue: Math.round(abandonedCartValue),
      // Visitor metrics (from visitorSessions table)
      totalVisits,              // Total number of visits/sessions
      uniqueVisitors,           // Unique people who visited
      returningVisitors: returningVisitorsCount,  // Visitors who visited before
      newVisitors: newVisitorsCount,              // First-time visitors
      // Customer metrics (from orders table)
      totalCustomers,
      newCustomers,
      repeatCustomers: repeatCustomersCount,
      // Product analytics (from productViews table)
      totalProductViews,    // Total product page views
      uniqueProductsViewed,
      totalCartAdds,
      avgOrderValue: Math.round(avgOrderValue),
      conversionRate: conversionRate.toFixed(2),
      revPerVisitor: revPerVisitor.toFixed(2),
      topSellingProducts,
      mostViewedProducts,
      topCustomers,
      dailyStats,
      // Device stats from visitorSessions (REAL DATA)
      deviceStats: {
        mobile: deviceCounts.mobile,
        desktop: deviceCounts.desktop,
        tablet: deviceCounts.tablet,
        ios: osCounts.ios,
        android: osCounts.android,
        chrome: browserCounts.chrome,
        safari: browserCounts.safari,
        other: osCounts.other + browserCounts.other,
        total: totalVisits, // Total visits
      },
      // REAL Session Analytics (from session_analytics table)
      sessionAnalytics: {
        avgSessionDuration: sessionAnalyticsData.avgSessionDuration,
        avgSessionSeconds: sessionAnalyticsData.avgSessionSeconds,
        bounceRate: sessionAnalyticsData.bounceRate,
        totalSessions: sessionAnalyticsData.totalSessions,
        bouncedSessions: sessionAnalyticsData.bouncedSessions,
      },
      // Cart actions per product (REAL DATA)
      cartActionsPerProduct,
      timeFrame,
      days,
      startDate: startDate.toISOString(),
    }

    // Update global cache
    setCachedDashboard(resultData, timeFrame)

    return NextResponse.json({
      success: true,
      cached: false,
      data: resultData
    })
  } catch (error) {
    console.error('Dashboard analytics error:', error)
    
    // Return stale cache on error
    const cached = getCachedDashboard(timeFrame)
    if (cached) {
      return NextResponse.json({
        success: true,
        cached: true,
        stale: true,
        data: cached.data
      })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch dashboard analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
