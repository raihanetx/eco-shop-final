/**
 * AUTO-INITIALIZATION MODULE
 * 
 * This module automatically initializes all database tables when the app starts.
 * No manual intervention needed - just connect the database and deploy!
 */

import { sqlClient } from '@/db'

// Global flag to ensure we only initialize once per process
declare global {
  var __dbInitialized: boolean | undefined
  var __dbInitializing: boolean | undefined
}

const ALL_TABLES = [
  `CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'icon',
    icon TEXT,
    image TEXT,
    items INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT NOW()
  )`,
  
  `CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    category_id TEXT REFERENCES categories(id),
    image TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    old_price NUMERIC(10,2),
    discount TEXT DEFAULT '0%',
    discount_type TEXT DEFAULT 'pct',
    discount_value NUMERIC(10,2) DEFAULT '0',
    offer BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'active',
    short_desc TEXT,
    long_desc TEXT,
    weight TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )`,
  
  `CREATE TABLE IF NOT EXISTS variants (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    stock INTEGER NOT NULL,
    initial_stock INTEGER NOT NULL,
    price NUMERIC(10,2) DEFAULT '0',
    discount TEXT DEFAULT '0%',
    discount_type TEXT DEFAULT 'pct',
    discount_value NUMERIC(10,2) DEFAULT '0',
    product_id INTEGER REFERENCES products(id) NOT NULL
  )`,
  
  `CREATE TABLE IF NOT EXISTS product_images (
    id SERIAL PRIMARY KEY,
    url TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    product_id INTEGER REFERENCES products(id) NOT NULL
  )`,
  
  `CREATE TABLE IF NOT EXISTS product_faqs (
    id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    product_id INTEGER REFERENCES products(id) NOT NULL
  )`,
  
  `CREATE TABLE IF NOT EXISTS related_products (
    id SERIAL PRIMARY KEY,
    related_product_id INTEGER REFERENCES products(id) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    product_id INTEGER REFERENCES products(id) NOT NULL
  )`,
  
  `CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    address TEXT,
    email TEXT,
    total_spent NUMERIC(10,2) DEFAULT '0',
    total_orders INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
  )`,
  
  `CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    initials TEXT NOT NULL,
    name TEXT NOT NULL,
    rating INTEGER NOT NULL,
    text TEXT NOT NULL,
    date TEXT NOT NULL,
    product_id INTEGER REFERENCES products(id),
    customer_id INTEGER REFERENCES customers(id)
  )`,
  
  `CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    note TEXT,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    courier_status TEXT,
    consignment_id INTEGER,
    tracking_code TEXT,
    courier_delivered_at TEXT,
    subtotal NUMERIC(10,2) NOT NULL,
    delivery NUMERIC(10,2) NOT NULL,
    discount NUMERIC(10,2) DEFAULT '0',
    coupon_codes TEXT DEFAULT '[]',
    coupon_amount NUMERIC(10,2) DEFAULT '0',
    total NUMERIC(10,2) NOT NULL,
    canceled_by TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )`,
  
  `CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    variant TEXT,
    qty INTEGER NOT NULL,
    base_price NUMERIC(10,2) NOT NULL,
    offer_text TEXT,
    offer_discount NUMERIC(10,2) DEFAULT '0',
    coupon_code TEXT,
    coupon_discount NUMERIC(10,2) DEFAULT '0',
    order_id TEXT REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    product_id INTEGER REFERENCES products(id)
  )`,
  
  `CREATE TABLE IF NOT EXISTS coupons (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    value NUMERIC(10,2) NOT NULL,
    scope TEXT NOT NULL,
    expiry TEXT,
    selected_products TEXT,
    selected_categories TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  )`,
  
  `CREATE TABLE IF NOT EXISTS abandoned_checkouts (
    id SERIAL PRIMARY KEY,
    session_id TEXT NOT NULL,
    visit_number INTEGER DEFAULT 1,
    name TEXT,
    phone TEXT,
    address TEXT,
    items TEXT NOT NULL,
    subtotal NUMERIC(10,2) DEFAULT '0',
    delivery NUMERIC(10,2) DEFAULT '0',
    total NUMERIC(10,2) DEFAULT '0',
    status TEXT DEFAULT 'abandoned',
    completed_order_id TEXT,
    visit_time TEXT NOT NULL,
    visit_date TEXT NOT NULL,
    checkout_started_at TIMESTAMP,
    checkout_ended_at TIMESTAMP,
    checkout_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
  )`,
  
  `CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    website_name TEXT DEFAULT 'Krishi Bitan',
    slogan TEXT,
    logo_url TEXT,
    favicon_url TEXT,
    hero_images TEXT,
    inside_dhaka_delivery NUMERIC(10,2) DEFAULT '60',
    outside_dhaka_delivery NUMERIC(10,2) DEFAULT '120',
    free_delivery_min NUMERIC(10,2) DEFAULT '500',
    universal_delivery BOOLEAN DEFAULT false,
    universal_delivery_charge NUMERIC(10,2) DEFAULT '60',
    whatsapp_number TEXT,
    phone_number TEXT,
    facebook_url TEXT,
    messenger_username TEXT,
    about_us TEXT,
    terms_conditions TEXT,
    refund_policy TEXT,
    privacy_policy TEXT,
    offer_title TEXT DEFAULT 'Offers',
    offer_slogan TEXT DEFAULT 'Exclusive deals just for you',
    first_section_name TEXT DEFAULT 'Categories',
    first_section_slogan TEXT DEFAULT 'Browse by category',
    second_section_name TEXT DEFAULT 'Offers',
    second_section_slogan TEXT DEFAULT 'Exclusive deals for you',
    third_section_name TEXT DEFAULT 'Featured',
    third_section_slogan TEXT DEFAULT 'Handpicked products',
    hero_animation_speed INTEGER DEFAULT 3000,
    hero_animation_type TEXT DEFAULT 'Fade',
    stock_low_percent INTEGER DEFAULT 25,
    stock_medium_percent INTEGER DEFAULT 50,
    courier_enabled BOOLEAN DEFAULT false,
    courier_api_key TEXT,
    courier_secret_key TEXT,
    admin_username TEXT DEFAULT 'admin',
    admin_password TEXT,
    steadfast_api_key TEXT,
    steadfast_secret_key TEXT,
    steadfast_webhook_url TEXT,
    cloudinary_cloud_name TEXT,
    cloudinary_api_key TEXT,
    cloudinary_api_secret TEXT,
    admin_username_updated_at TEXT,
    admin_password_updated_at TEXT,
    steadfast_api_updated_at TEXT,
    cloudinary_updated_at TEXT
  )`,
  
  `CREATE TABLE IF NOT EXISTS product_views (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) NOT NULL,
    view_count INTEGER DEFAULT 1,
    date TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  )`,
  
  `CREATE TABLE IF NOT EXISTS cart_events (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) NOT NULL,
    action TEXT NOT NULL,
    date TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  )`,
  
  `CREATE TABLE IF NOT EXISTS visitor_sessions (
    id SERIAL PRIMARY KEY,
    session_id TEXT NOT NULL,
    device_type TEXT NOT NULL,
    browser TEXT NOT NULL,
    os TEXT NOT NULL,
    date TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  )`,
  
  `CREATE TABLE IF NOT EXISTS session_analytics (
    id SERIAL PRIMARY KEY,
    session_id TEXT NOT NULL UNIQUE,
    started_at TIMESTAMP NOT NULL,
    last_activity_at TIMESTAMP NOT NULL,
    ended_at TIMESTAMP,
    duration_seconds INTEGER DEFAULT 0,
    page_views INTEGER DEFAULT 1,
    product_views INTEGER DEFAULT 0,
    is_bounced BOOLEAN DEFAULT false,
    device_type TEXT NOT NULL,
    browser TEXT NOT NULL,
    os TEXT NOT NULL,
    cart_adds INTEGER DEFAULT 0,
    cart_removes INTEGER DEFAULT 0,
    did_order BOOLEAN DEFAULT false,
    order_id TEXT,
    date TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  )`,
  
  `CREATE TABLE IF NOT EXISTS page_views (
    id SERIAL PRIMARY KEY,
    session_id TEXT NOT NULL,
    page TEXT NOT NULL,
    product_id INTEGER,
    referrer TEXT,
    date TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  )`,
  
  `CREATE TABLE IF NOT EXISTS security_audit_log (
    id SERIAL PRIMARY KEY,
    action TEXT NOT NULL,
    category TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    details TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  )`,
  
  `CREATE TABLE IF NOT EXISTS rate_limits (
    id SERIAL PRIMARY KEY,
    ip_address TEXT NOT NULL UNIQUE,
    attempt_count INTEGER DEFAULT 1,
    locked_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )`
]

// Create indexes for better performance
const INDEXES = [
  `CREATE INDEX IF NOT EXISTS idx_categories_status ON categories(status)`,
  `CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id)`,
  `CREATE INDEX IF NOT EXISTS idx_products_status ON products(status)`,
  `CREATE INDEX IF NOT EXISTS idx_products_offer ON products(offer)`,
  `CREATE INDEX IF NOT EXISTS idx_variants_product_id ON variants(product_id)`,
  `CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id)`,
  `CREATE INDEX IF NOT EXISTS idx_related_products_product_id ON related_products(product_id)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(phone)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id)`,
  `CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id)`,
  `CREATE INDEX IF NOT EXISTS idx_product_views_date ON product_views(date)`,
  `CREATE INDEX IF NOT EXISTS idx_product_views_product_id ON product_views(product_id)`,
  `CREATE INDEX IF NOT EXISTS idx_product_views_product_date ON product_views(product_id, date)`,
  `CREATE INDEX IF NOT EXISTS idx_visitor_sessions_date ON visitor_sessions(date)`,
  `CREATE INDEX IF NOT EXISTS idx_visitor_sessions_session_id ON visitor_sessions(session_id)`,
  `CREATE INDEX IF NOT EXISTS idx_session_analytics_date ON session_analytics(date)`,
  `CREATE INDEX IF NOT EXISTS idx_session_analytics_session_id ON session_analytics(session_id)`
]

/**
 * Initialize all database tables
 * Called automatically on app startup
 */
export async function initializeDatabase(): Promise<{ success: boolean; message: string }> {
  // Check if already initialized in this process
  if (globalThis.__dbInitialized) {
    return { success: true, message: 'Database already initialized' }
  }
  
  // Prevent concurrent initialization
  if (globalThis.__dbInitializing) {
    // Wait a bit and return
    await new Promise(resolve => setTimeout(resolve, 1000))
    return { success: true, message: 'Database initialization in progress' }
  }
  
  globalThis.__dbInitializing = true
  
  try {
    console.log('[AUTO-INIT] Starting database initialization...')
    
    // Create all tables
    for (let i = 0; i < ALL_TABLES.length; i++) {
      try {
        await sqlClient.unsafe(ALL_TABLES[i])
        console.log(`[AUTO-INIT] Created table ${i + 1}/${ALL_TABLES.length}`)
      } catch (error: any) {
        // Ignore "already exists" errors
        if (!error.message?.includes('already exists')) {
          console.error(`[AUTO-INIT] Error creating table ${i + 1}:`, error.message)
        }
      }
    }
    
    // Create indexes
    for (const indexSql of INDEXES) {
      try {
        await sqlClient.unsafe(indexSql)
      } catch (error: any) {
        // Ignore index errors
        if (!error.message?.includes('already exists')) {
          console.error('[AUTO-INIT] Index error:', error.message)
        }
      }
    }
    
    // Ensure default settings row exists
    try {
      const settingsCheck = await sqlClient`
        SELECT id FROM settings WHERE id = 1
      `
      
      if (settingsCheck.length === 0) {
        await sqlClient`
          INSERT INTO settings (id, website_name, slogan, inside_dhaka_delivery, outside_dhaka_delivery, free_delivery_min)
          VALUES (1, 'Krishi Bitan', 'Fresh from farm to your table', '60', '120', '500')
          ON CONFLICT (id) DO NOTHING
        `
        console.log('[AUTO-INIT] Created default settings row')
      }
    } catch (error: any) {
      console.error('[AUTO-INIT] Error creating default settings:', error.message)
    }
    
    globalThis.__dbInitialized = true
    globalThis.__dbInitializing = false
    
    console.log('[AUTO-INIT] ✅ Database initialization complete!')
    
    return { success: true, message: 'Database initialized successfully' }
    
  } catch (error: any) {
    globalThis.__dbInitializing = false
    console.error('[AUTO-INIT] ❌ Database initialization failed:', error.message)
    return { success: false, message: error.message }
  }
}

/**
 * Check if database is ready
 */
export async function isDatabaseReady(): Promise<boolean> {
  try {
    const result = await sqlClient`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('settings', 'products', 'categories', 'orders')
      LIMIT 4
    `
    return result.length >= 4
  } catch {
    return false
  }
}
