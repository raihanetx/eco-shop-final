import { NextResponse } from 'next/server'
import { db, getCachedShopData, setCachedShopData, clearShopDataCache, getShopDataLastModified } from '@/db'
import { categories, products, settings, variants } from '@/db/schema'
import { isApiAuthenticated, authErrorResponse } from '@/lib/api-auth'

// Cache TTL: 60 seconds
const CACHE_TTL = 60 * 1000

// OPTIMIZED: Aggressive caching for speed
const HTTP_CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
  'CDN-Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
  // Enable compression hint
  'Vary': 'Accept-Encoding',
}

// SMART: Only select columns we need (EXCLUDE large base64 images!)
const SETTINGS_COLUMNS = {
  websiteName: settings.websiteName,
  slogan: settings.slogan,
  logoUrl: settings.logoUrl,
  faviconUrl: settings.faviconUrl,
  heroImages: settings.heroImages,
  whatsappNumber: settings.whatsappNumber,
  phoneNumber: settings.phoneNumber,
  facebookUrl: settings.facebookUrl,
  messengerUsername: settings.messengerUsername,
  insideDhakaDelivery: settings.insideDhakaDelivery,
  outsideDhakaDelivery: settings.outsideDhakaDelivery,
  freeDeliveryMin: settings.freeDeliveryMin,
  universalDelivery: settings.universalDelivery,
  universalDeliveryCharge: settings.universalDeliveryCharge,
  heroAnimationSpeed: settings.heroAnimationSpeed,
  heroAnimationType: settings.heroAnimationType,
  firstSectionName: settings.firstSectionName,
  firstSectionSlogan: settings.firstSectionSlogan,
  secondSectionName: settings.secondSectionName,
  secondSectionSlogan: settings.secondSectionSlogan,
  thirdSectionName: settings.thirdSectionName,
  thirdSectionSlogan: settings.thirdSectionSlogan,
}

// SMART: Filter out base64 images (they're too large for API responses)
function filterBase64Images(images: string[]): string[] {
  return images.filter(img => !img.startsWith('data:image'))
}

// SMART: Clean logo URL - replace base64 with empty string
function cleanImageUrl(url: string | null | undefined): string {
  if (!url) return ''
  // Don't send base64 images - they're huge!
  if (url.startsWith('data:image')) return ''
  return url
}

// GET /api/shop-data - SMART: Conditional fetching + Global cache + parallel queries
export async function GET(request: Request) {
  const now = Date.now()
  const url = new URL(request.url)
  
  // ============================================
  // SMART: Conditional Request Support
  // Client sends their cached lastModified
  // If data hasn't changed, return 304 (super fast!)
  // ============================================
  const clientLastModified = parseInt(url.searchParams.get('ifModifiedSince') || '0')
  const serverLastModified = getShopDataLastModified()
  
  // SMART: If client has latest data, return 304 NOT MODIFIED (tiny response!)
  if (clientLastModified > 0 && clientLastModified >= serverLastModified) {
    return NextResponse.json({
      success: true,
      notModified: true,
      lastModified: serverLastModified,
      message: 'Data not modified - use cache'
    }, {
      status: 304,
      headers: {
        'Cache-Control': 'no-store',
        'X-Data-Status': 'not-modified'
      }
    })
  }
  
  // Check global cache
  const cached = getCachedShopData()
  const lastModified = serverLastModified
  
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return NextResponse.json({
      success: true,
      cached: true,
      lastModified,
      data: cached.data
    }, { headers: HTTP_CACHE_HEADERS })
  }

  try {
    // SMART: All queries in PARALLEL
    const [categoriesData, productsData, settingsData, variantsData] = await Promise.all([
      db.select().from(categories),
      db.select().from(products),
      db.select(SETTINGS_COLUMNS).from(settings).limit(1),
      db.select().from(variants)
    ])

    // Process settings - SMART: Remove base64 images!
    let settingsObj: any = {
      websiteName: 'EcoMart',
      slogan: '',
      logoUrl: '',
      faviconUrl: '',
      heroImages: [],
      whatsappNumber: '',
      phoneNumber: '',
      facebookUrl: '',
      messengerUsername: '',
      insideDhakaDelivery: 60,
      outsideDhakaDelivery: 120,
      freeDeliveryMin: 500,
      universalDelivery: false,
      universalDeliveryCharge: 60,
      heroAnimationSpeed: 3000,
      heroAnimationType: 'Fade',
      firstSectionName: 'Categories',
      firstSectionSlogan: '',
      secondSectionName: 'Offers',
      secondSectionSlogan: '',
      thirdSectionName: 'Featured',
      thirdSectionSlogan: '',
    }

    if (settingsData[0]) {
      const s = settingsData[0]
      let heroImagesArr: string[] = []
      
      if (s.heroImages) {
        try {
          const parsed = typeof s.heroImages === 'string' ? JSON.parse(s.heroImages) : s.heroImages
          // SMART: Filter out base64 images!
          heroImagesArr = filterBase64Images(Array.isArray(parsed) ? parsed : [])
        } catch { /* empty */ }
      }

      settingsObj = {
        websiteName: s.websiteName || 'EcoMart',
        slogan: s.slogan ?? '',
        logoUrl: cleanImageUrl(s.logoUrl), // SMART: No base64!
        faviconUrl: cleanImageUrl(s.faviconUrl), // SMART: No base64!
        heroImages: heroImagesArr,
        whatsappNumber: s.whatsappNumber ?? '',
        phoneNumber: s.phoneNumber ?? '',
        facebookUrl: s.facebookUrl ?? '',
        messengerUsername: s.messengerUsername ?? '',
        insideDhakaDelivery: Number(s.insideDhakaDelivery) || 60,
        outsideDhakaDelivery: Number(s.outsideDhakaDelivery) || 120,
        freeDeliveryMin: Number(s.freeDeliveryMin) || 500,
        universalDelivery: s.universalDelivery || false,
        universalDeliveryCharge: Number(s.universalDeliveryCharge) || 60,
        heroAnimationSpeed: s.heroAnimationSpeed || 3000,
        heroAnimationType: s.heroAnimationType || 'Fade',
        // Use ?? for slogans to allow empty strings (|| treats '' as falsy)
        firstSectionName: s.firstSectionName ?? 'Categories',
        firstSectionSlogan: s.firstSectionSlogan ?? '',
        secondSectionName: s.secondSectionName ?? 'Offers',
        secondSectionSlogan: s.secondSectionSlogan ?? '',
        thirdSectionName: s.thirdSectionName ?? 'Featured',
        thirdSectionSlogan: s.thirdSectionSlogan ?? '',
      }
    }

    // Build variant map
    const variantMap: Record<number, any[]> = {}
    for (const v of variantsData) {
      if (!variantMap[v.productId]) variantMap[v.productId] = []
      variantMap[v.productId].push({
        id: v.id,
        name: v.name,
        stock: v.stock,
        price: Number(v.price) || 0,
        discount: v.discount || '0%',
        discountType: v.discountType || 'pct',
        discountValue: Number(v.discountValue) || 0,
      })
    }

    // Process products - SMART: Clean base64 from images too
    const processedProducts = productsData.map(p => {
      const pv = variantMap[p.id] || []
      const minStock = pv.length ? Math.min(...pv.map(v => v.stock)) : 0
      
      return {
        id: p.id,
        name: p.name,
        category: p.category,
        categoryId: p.categoryId,
        image: cleanImageUrl(p.image), // SMART: No base64!
        price: Number(p.price) || 0,
        oldPrice: p.oldPrice ? Number(p.oldPrice) : null,
        discount: p.discount,
        discountType: p.discountType || 'pct',
        discountValue: p.discountValue ? parseFloat(p.discountValue.toString()) : 0,
        offer: p.offer === true,
        status: p.status,
        shortDesc: p.shortDesc,
        inStock: minStock > 0,
        stockCount: minStock,
        hasVariants: pv.length > 0,
      }
    })

    const resultData = {
      categories: categoriesData,
      products: processedProducts,
      settings: settingsObj,
      variantMap,
    }

    // Update global cache
    setCachedShopData(resultData)

    return NextResponse.json({
      success: true,
      cached: false,
      lastModified,
      data: resultData
    }, { headers: HTTP_CACHE_HEADERS })
  } catch (error) {
    console.error('Shop data fetch error:', error)
    
    // Return stale cache on error
    const cached = getCachedShopData()
    if (cached) {
      return NextResponse.json({
        success: true,
        cached: true,
        stale: true,
        lastModified,
        data: cached.data
      }, { headers: HTTP_CACHE_HEADERS })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch shop data'
    }, { status: 500 })
  }
}

// POST /api/shop-data - Clear cache (admin only)
export async function POST() {
  try {
    // Authentication required
    if (!await isApiAuthenticated()) {
      return authErrorResponse()
    }

    // Clear server-side cache
    clearShopDataCache()
    
    console.log('[SHOP-DATA] Cache cleared by admin')
    
    return NextResponse.json({
      success: true,
      message: 'Shop data cache cleared successfully'
    })
  } catch (error) {
    console.error('[SHOP-DATA] Error clearing cache:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to clear cache'
    }, { status: 500 })
  }
}
