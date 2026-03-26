import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { products, variants, productImages, productFaqs, relatedProducts, reviews } from '@/db/schema'
import { eq, sql, inArray } from 'drizzle-orm'

// OPTIMIZED: Cache for product details with longer TTL
const productCache = new Map<number, { data: any; timestamp: number }>()
const CACHE_TTL = 2 * 60 * 1000 // 2 minutes - products don't change often

// HTTP Cache headers for CDN caching
const HTTP_CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
  'CDN-Cache-Control': 'public, max-age=60',
}

// GET /api/product-details - Get ALL product data in ONE request
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const productId = parseInt(searchParams.get('productId') || '0')

  if (!productId) {
    return NextResponse.json({ success: false, error: 'Product ID required' }, { status: 400 })
  }

  // Check cache first - INSTANT response
  const cached = productCache.get(productId)
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return NextResponse.json({ success: true, cached: true, data: cached.data }, { headers: HTTP_CACHE_HEADERS })
  }

  try {
    // Fetch ALL product data in PARALLEL
    const [productData, variantsData, imagesData, faqsData, relatedData, reviewsData] = await Promise.all([
      // Product basic info
      db.select().from(products).where(eq(products.id, productId)).limit(1),
      
      // Variants
      db.select().from(variants).where(eq(variants.productId, productId)),
      
      // Images
      db.select().from(productImages).where(eq(productImages.productId, productId)),
      
      // FAQs
      db.select().from(productFaqs).where(eq(productFaqs.productId, productId)),
      
      // Related products IDs
      db.select().from(relatedProducts).where(eq(relatedProducts.productId, productId)),
      
      // Reviews
      db.select().from(reviews).where(eq(reviews.productId, productId)),
    ])

    if (productData.length === 0) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 })
    }

    // Fetch related product details if any
    let relatedProductsData: any[] = []
    if (relatedData.length > 0) {
      const relatedIds = relatedData.map(r => r.relatedProductId)
      relatedProductsData = await db.select({
        id: products.id,
        name: products.name,
        image: products.image,
        price: products.price,
        oldPrice: products.oldPrice,
        discount: products.discount,
        discountType: products.discountType,
        discountValue: products.discountValue,
        offer: products.offer,
        category: products.category,
      }).from(products).where(inArray(products.id, relatedIds))
    }

    const data = {
      product: {
        ...productData[0],
        price: Number(productData[0].price) || 0,
        oldPrice: productData[0].oldPrice ? Number(productData[0].oldPrice) : null,
        discountValue: productData[0].discountValue ? Number(productData[0].discountValue) : null,
      },
      variants: variantsData.map(v => ({
        ...v,
        price: Number(v.price) || 0,
        discountValue: v.discountValue ? Number(v.discountValue) : null,
      })),
      images: imagesData,
      faqs: faqsData,
      relatedProducts: relatedProductsData,
      reviews: reviewsData,
    }

    // Update cache
    productCache.set(productId, { data, timestamp: Date.now() })

    return NextResponse.json({ success: true, cached: false, data }, { headers: HTTP_CACHE_HEADERS })
  } catch (error) {
    console.error('Product details fetch error:', error)
    
    // Return cached data if available (stale but better than error)
    const cached = productCache.get(productId)
    if (cached) {
      return NextResponse.json({ success: true, cached: true, stale: true, data: cached.data }, { headers: HTTP_CACHE_HEADERS })
    }
    
    return NextResponse.json({ success: false, error: 'Failed to fetch product' }, { status: 500 })
  }
}
