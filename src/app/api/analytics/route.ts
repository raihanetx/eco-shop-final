import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { productViews, cartEvents, products, orders, orderItems, categories } from '@/db/schema'
import { eq, sql, desc, and, gte, lte, inArray } from 'drizzle-orm'
import { isApiAuthenticated, authErrorResponse } from '@/lib/api-auth'

// GET /api/analytics - Fetch analytics data (Protected: Admin only)
export async function GET(request: NextRequest) {
  // Authentication required for analytics access
  if (!await isApiAuthenticated()) {
    return authErrorResponse()
  }

  const searchParams = request.nextUrl.searchParams
  const action = searchParams.get('action')

  try {
    // Get most viewed products
    if (action === 'most-viewed') {
      const limit = parseInt(searchParams.get('limit') || '5')
      
      const views = await db
        .select({
          productId: productViews.productId,
          totalViews: sql<number>`sum(${productViews.viewCount})`.as('totalViews'),
        })
        .from(productViews)
        .groupBy(productViews.productId)
        .orderBy(desc(sql`sum(${productViews.viewCount})`))
        .limit(limit)

      // Get product details for each
      const result = await Promise.all(
        views.map(async (v) => {
          const product = await db.select().from(products).where(eq(products.id, v.productId)).limit(1)
          if (product.length === 0) return null
          return {
            id: v.productId,
            name: product[0].name,
            category: product[0].category,
            image: product[0].image,
            views: v.totalViews,
          }
        })
      )

      return NextResponse.json({
        success: true,
        data: result.filter(Boolean),
      })
    }

    // Get most added to cart products
    if (action === 'most-in-cart') {
      const limit = parseInt(searchParams.get('limit') || '5')
      
      const cartAdditions = await db
        .select({
          productId: cartEvents.productId,
          totalAdds: sql<number>`count(*)`.as('totalAdds'),
        })
        .from(cartEvents)
        .where(eq(cartEvents.action, 'add'))
        .groupBy(cartEvents.productId)
        .orderBy(desc(sql`count(*)`))
        .limit(limit)

      // Get product details for each
      const result = await Promise.all(
        cartAdditions.map(async (c) => {
          const product = await db.select().from(products).where(eq(products.id, c.productId)).limit(1)
          if (product.length === 0) return null
          return {
            id: c.productId,
            name: product[0].name,
            category: product[0].category,
            image: product[0].image,
            adds: c.totalAdds,
          }
        })
      )

      return NextResponse.json({
        success: true,
        data: result.filter(Boolean),
      })
    }

    // Get 7-day sales chart data
    if (action === 'sales-chart') {
      const chartData: { day: string; revenue: number; orders: number }[] = []
      const today = new Date()
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        const dayStart = new Date(date.setHours(0, 0, 0, 0))
        const dayEnd = new Date(date.setHours(23, 59, 59, 999))
        
        // Get orders for this day (using createdAt timestamp)
        const dayOrders = await db.select().from(orders)
          .where(and(
            gte(orders.createdAt, dayStart),
            lte(orders.createdAt, dayEnd),
            eq(orders.status, 'approved')
          ))
        
        const dayTotal = dayOrders.reduce((sum, o) => sum + Math.round(parseFloat(String(o.total)) || 0), 0)
        
        chartData.push({
          day: dateStr,
          revenue: dayTotal,
          orders: dayOrders.length,
        })
      }

      return NextResponse.json({
        success: true,
        data: chartData,
      })
    }

    // Get revenue by category
    if (action === 'revenue-by-category') {
      const allOrders = await db.select().from(orders).where(eq(orders.status, 'approved'))
      const orderIds = allOrders.map(o => o.id)
      
      if (orderIds.length === 0) {
        return NextResponse.json({
          success: true,
          data: [],
        })
      }

      // SECURITY: Use inArray() instead of raw SQL to prevent SQL injection
      const items = await db.select().from(orderItems)
        .where(inArray(orderItems.orderId, orderIds))
      
      // Group by category
      const categoryRevenue: Record<string, number> = {}
      let totalRevenue = 0

      for (const item of items) {
        if (item.productId) {
          const product = await db.select().from(products).where(eq(products.id, item.productId)).limit(1)
          if (product.length > 0) {
            const category = product[0].category
            const itemTotal = Math.round(parseFloat(String(item.basePrice)) || 0) * item.qty
            categoryRevenue[category] = (categoryRevenue[category] || 0) + itemTotal
            totalRevenue += itemTotal
          }
        }
      }

      const result = Object.entries(categoryRevenue)
        .map(([category, revenue]) => ({
          category,
          revenue,
          percentage: totalRevenue > 0 ? Math.round((revenue / totalRevenue) * 100) : 0,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)

      return NextResponse.json({
        success: true,
        data: result,
        totalRevenue,
      })
    }

    // Get dashboard overview stats
    if (action === 'overview') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      // Today's orders
      const todayOrders = await db.select().from(orders)
        .where(gte(orders.createdAt, today))
      
      // Total revenue from approved orders
      const approvedOrders = await db.select().from(orders).where(eq(orders.status, 'approved'))
      const totalRevenue = approvedOrders.reduce((sum, o) => sum + Math.round(parseFloat(String(o.total)) || 0), 0)
      
      // Pending orders
      const pendingOrders = await db.select().from(orders).where(eq(orders.status, 'pending'))
      
      // Total customers
      const allCustomers = await db.select().from(
        sql`SELECT COUNT(DISTINCT phone) as count FROM orders`
      ) as Array<{ count: string }>
      
      return NextResponse.json({
        success: true,
        data: {
          totalRevenue,
          totalOrders: approvedOrders.length,
          pendingOrders: pendingOrders.length,
          todayOrders: todayOrders.length,
          todayRevenue: todayOrders.filter(o => o.status === 'approved').reduce((sum, o) => sum + Math.round(parseFloat(String(o.total)) || 0), 0),
          totalCustomers: parseInt(allCustomers[0]?.count || '0'),
        },
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action',
    }, { status: 400 })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch analytics',
    }, { status: 500 })
  }
}

// POST /api/analytics - Track analytics events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, productId } = body

    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

    if (type === 'view' && productId) {
      // Check if we already have a view record for today
      const existing = await db.select().from(productViews)
        .where(and(
          eq(productViews.productId, productId),
          eq(productViews.date, today)
        ))
        .limit(1)

      if (existing.length > 0) {
        // Increment view count
        await db.update(productViews)
          .set({
            viewCount: sql`${productViews.viewCount} + 1`,
          })
          .where(eq(productViews.id, existing[0].id))
      } else {
        // Create new view record
        await db.insert(productViews).values({
          productId,
          date: today,
          viewCount: 1,
        })
      }

      return NextResponse.json({ success: true })
    }

    if (type === 'cart-add' && productId) {
      await db.insert(cartEvents).values({
        productId,
        action: 'add',
        date: today,
      })

      return NextResponse.json({ success: true })
    }

    if (type === 'cart-remove' && productId) {
      await db.insert(cartEvents).values({
        productId,
        action: 'remove',
        date: today,
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid tracking type',
    }, { status: 400 })
  } catch (error) {
    console.error('Analytics tracking error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to track event',
    }, { status: 500 })
  }
}
