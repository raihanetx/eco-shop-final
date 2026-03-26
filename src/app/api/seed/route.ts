import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { 
  categories, products, variants, productImages, productFaqs,
  coupons, settings
} from '@/db/schema'
import { isApiAuthenticated, authErrorResponse } from '@/lib/api-auth'
import { eq, ne } from 'drizzle-orm'

// ============================================
// SEED API - Load Sample Data
// ============================================
// POST /api/seed - Insert demo products and categories

// Sample categories
const sampleCategories = [
  { id: 'cat-vegetables', name: 'Vegetables', type: 'image', icon: '', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400', items: 0, status: 'Active' },
  { id: 'cat-fruits', name: 'Fruits', type: 'image', icon: '', image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400', items: 0, status: 'Active' },
  { id: 'cat-dairy', name: 'Dairy', type: 'image', icon: '', image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400', items: 0, status: 'Active' },
  { id: 'cat-grocery', name: 'Grocery', type: 'image', icon: '', image: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400', items: 0, status: 'Active' },
]

// Sample products
const sampleProducts = [
  // Vegetables
  {
    id: 1,
    name: 'Fresh Tomatoes',
    category: 'Vegetables',
    categoryId: 'cat-vegetables',
    image: 'https://images.unsplash.com/photo-1546470427-e26264be0b0a?w=400',
    price: '40',
    oldPrice: '50',
    discountType: 'pct',
    discountValue: '20',
    offer: true,
    status: 'active',
    shortDesc: 'Fresh organic tomatoes from local farms',
    longDesc: 'Our tomatoes are sourced from certified organic farms. Perfect for salads, cooking, or eating fresh.',
    variants: [
      { name: '500g', stock: 100, initialStock: 100, price: '40' },
      { name: '1kg', stock: 50, initialStock: 50, price: '75' },
    ],
  },
  {
    id: 2,
    name: 'Green Spinach',
    category: 'Vegetables',
    categoryId: 'cat-vegetables',
    image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400',
    price: '30',
    oldPrice: null,
    discountType: 'pct',
    discountValue: '0',
    offer: false,
    status: 'active',
    shortDesc: 'Fresh leafy green spinach',
    longDesc: 'Nutritious spinach leaves, rich in iron and vitamins. Best for healthy smoothies and cooking.',
    variants: [
      { name: '250g', stock: 80, initialStock: 80, price: '30' },
      { name: '500g', stock: 60, initialStock: 60, price: '55' },
    ],
  },
  {
    id: 3,
    name: 'Organic Carrots',
    category: 'Vegetables',
    categoryId: 'cat-vegetables',
    image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400',
    price: '35',
    oldPrice: '45',
    discountType: 'fixed',
    discountValue: '10',
    offer: true,
    status: 'active',
    shortDesc: 'Crunchy organic carrots',
    longDesc: 'Sweet and crunchy carrots perfect for salads, soups, and healthy snacks.',
    variants: [
      { name: '500g', stock: 70, initialStock: 70, price: '35' },
      { name: '1kg', stock: 40, initialStock: 40, price: '65' },
    ],
  },
  // Fruits
  {
    id: 4,
    name: 'Fresh Mangoes',
    category: 'Fruits',
    categoryId: 'cat-fruits',
    image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400',
    price: '120',
    oldPrice: '150',
    discountType: 'pct',
    discountValue: '20',
    offer: true,
    status: 'active',
    shortDesc: 'Sweet premium mangoes',
    longDesc: 'Delicious premium mangoes from the best orchards. Sweet, juicy, and perfect for desserts.',
    variants: [
      { name: '1kg (3-4 pcs)', stock: 30, initialStock: 30, price: '120' },
      { name: '2kg (6-8 pcs)', stock: 20, initialStock: 20, price: '220' },
    ],
  },
  {
    id: 5,
    name: 'Red Apples',
    category: 'Fruits',
    categoryId: 'cat-fruits',
    image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400',
    price: '180',
    oldPrice: null,
    discountType: 'pct',
    discountValue: '0',
    offer: false,
    status: 'active',
    shortDesc: 'Crispy red apples',
    longDesc: 'Imported crispy red apples. Perfect for snacks, pies, and healthy breakfast.',
    variants: [
      { name: '500g (4-5 pcs)', stock: 45, initialStock: 45, price: '180' },
      { name: '1kg (8-10 pcs)', stock: 30, initialStock: 30, price: '340' },
    ],
  },
  // Dairy
  {
    id: 6,
    name: 'Fresh Milk',
    category: 'Dairy',
    categoryId: 'cat-dairy',
    image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400',
    price: '90',
    oldPrice: '100',
    discountType: 'fixed',
    discountValue: '10',
    offer: true,
    status: 'active',
    shortDesc: 'Pure fresh milk',
    longDesc: 'Farm fresh milk delivered daily. Rich in calcium and perfect for the whole family.',
    variants: [
      { name: '500ml', stock: 100, initialStock: 100, price: '90' },
      { name: '1L', stock: 80, initialStock: 80, price: '170' },
    ],
  },
  {
    id: 7,
    name: 'Greek Yogurt',
    category: 'Dairy',
    categoryId: 'cat-dairy',
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400',
    price: '120',
    oldPrice: null,
    discountType: 'pct',
    discountValue: '0',
    offer: false,
    status: 'active',
    shortDesc: 'Creamy Greek yogurt',
    longDesc: 'Rich and creamy Greek yogurt. High in protein and perfect for breakfast or snacks.',
    variants: [
      { name: '400g', stock: 50, initialStock: 50, price: '120' },
      { name: '800g', stock: 30, initialStock: 30, price: '220' },
    ],
  },
  // Grocery
  {
    id: 8,
    name: 'Basmati Rice',
    category: 'Grocery',
    categoryId: 'cat-grocery',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
    price: '180',
    oldPrice: '200',
    discountType: 'pct',
    discountValue: '10',
    offer: true,
    status: 'active',
    shortDesc: 'Premium basmati rice',
    longDesc: 'Premium quality basmati rice. Long grain and aromatic, perfect for biryani and pilaf.',
    variants: [
      { name: '1kg', stock: 60, initialStock: 60, price: '180' },
      { name: '5kg', stock: 20, initialStock: 20, price: '850' },
    ],
  },
]

// Sample coupons
const sampleCoupons = [
  { id: 'coup-welcome', code: 'WELCOME10', type: 'pct', value: '10', scope: 'all', expiry: '2025-12-31' },
  { id: 'coup-fresh', code: 'FRESH20', type: 'pct', value: '20', scope: 'categories', selectedCategories: '["cat-vegetables", "cat-fruits"]', expiry: '2025-06-30' },
]

/**
 * POST /api/seed
 * Load sample data into the database
 * Admin authentication required
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    if (!await isApiAuthenticated()) {
      return authErrorResponse()
    }

    const body = await request.json().catch(() => ({}))
    const { clearFirst = true } = body

    console.log('[SEED] Starting seed process...')
    console.log(`[SEED] Clear existing data: ${clearFirst}`)

    // Step 1: Clear existing data if requested
    if (clearFirst) {
      console.log('[SEED] Clearing existing data...')
      
      // Delete in reverse dependency order
      await db.delete(productFaqs)
      await db.delete(variants)
      await db.delete(products)
      await db.delete(categories)
      await db.delete(coupons)
      
      console.log('[SEED] Existing data cleared')
    }

    // Step 2: Insert categories
    console.log('[SEED] Inserting categories...')
    const insertedCategories: any[] = []
    for (const cat of sampleCategories) {
      const result = await db.insert(categories).values({
        id: cat.id,
        name: cat.name,
        type: cat.type,
        icon: cat.icon,
        image: cat.image,
        items: cat.items,
        status: cat.status,
      }).onConflictDoUpdate({
        target: categories.id,
        set: { name: cat.name, image: cat.image, status: cat.status }
      }).returning()
      insertedCategories.push(result[0])
    }
    console.log(`[SEED] Inserted ${insertedCategories.length} categories`)

    // Step 3: Insert products with variants
    console.log('[SEED] Inserting products...')
    const insertedProducts: any[] = []
    const insertedVariants: any[] = []
    
    for (const prod of sampleProducts) {
      // Insert product
      const productResult = await db.insert(products).values({
        name: prod.name,
        category: prod.category,
        categoryId: prod.categoryId,
        image: prod.image,
        price: prod.price,
        oldPrice: prod.oldPrice,
        discountType: prod.discountType,
        discountValue: prod.discountValue,
        offer: prod.offer,
        status: prod.status,
        shortDesc: prod.shortDesc,
        longDesc: prod.longDesc,
      }).returning()
      
      const insertedProduct = productResult[0]
      insertedProducts.push(insertedProduct)
      
      // Insert variants for this product
      for (const v of prod.variants) {
        const variantResult = await db.insert(variants).values({
          name: v.name,
          stock: v.stock,
          initialStock: v.initialStock,
          price: v.price,
          discountType: 'pct',
          discountValue: '0',
          productId: insertedProduct.id,
        }).returning()
        insertedVariants.push(variantResult[0])
      }
      
      // Update category item count
      await db.update(categories)
        .set({ items: (insertedProducts.filter(p => p.categoryId === prod.categoryId).length) })
        .where(eq(categories.id, prod.categoryId))
    }
    console.log(`[SEED] Inserted ${insertedProducts.length} products with ${insertedVariants.length} variants`)

    // Step 4: Insert coupons
    console.log('[SEED] Inserting coupons...')
    const insertedCoupons: any[] = []
    for (const coup of sampleCoupons) {
      const result = await db.insert(coupons).values({
        id: coup.id,
        code: coup.code,
        type: coup.type,
        value: coup.value,
        scope: coup.scope,
        expiry: coup.expiry,
        selectedCategories: coup.selectedCategories || null,
      }).onConflictDoUpdate({
        target: coupons.id,
        set: { code: coup.code, value: coup.value, expiry: coup.expiry }
      }).returning()
      insertedCoupons.push(result[0])
    }
    console.log(`[SEED] Inserted ${insertedCoupons.length} coupons`)

    console.log('[SEED] Seed completed successfully!')

    return NextResponse.json({
      success: true,
      message: 'Sample data loaded successfully!',
      data: {
        categories: insertedCategories.length,
        products: insertedProducts.length,
        variants: insertedVariants.length,
        coupons: insertedCoupons.length,
      }
    })

  } catch (error) {
    console.error('[SEED] Seed failed:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to load sample data. Please try again.' 
    }, { status: 500 })
  }
}

/**
 * DELETE /api/seed
 * Clear all data (for reset)
 * Admin authentication required
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authentication check
    if (!await isApiAuthenticated()) {
      return authErrorResponse()
    }

    console.log('[SEED] Starting data clear...')

    // Delete in reverse dependency order
    await db.delete(productFaqs)
    await db.delete(variants)
    await db.delete(products)
    await db.delete(categories)
    await db.delete(coupons)

    console.log('[SEED] Data cleared successfully!')

    return NextResponse.json({
      success: true,
      message: 'All data cleared successfully!',
      data: {
        productFaqs: 0,
        variants: 0,
        products: 0,
        categories: 0,
        coupons: 0,
      }
    })

  } catch (error) {
    console.error('[SEED] Clear failed:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to clear data. Please try again.' 
    }, { status: 500 })
  }
}
