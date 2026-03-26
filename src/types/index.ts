// Cart Types
export interface CartItem {
  id: number
  name: string
  price: number
  oldPrice: number
  img: string
  weight: string
  quantity: number
  category?: string
  categoryId?: string
  offer?: boolean
  discountType?: 'pct' | 'fixed'
  discountValue?: number
}

// Review Types
export interface Review {
  id: number
  initials: string
  name: string
  rating: number
  text: string
  date: string
}

// Category Types
export interface Category {
  id: string
  name: string
  type: string
  icon: string
  image: string
  items: number
  created: string
  status: string
}

// Product Types
export interface Product {
  id: number
  name: string
  category: string
  image: string
  variants: string
  price: string
  discount: string
  offer: boolean
  status: string
  shortDesc?: string
  longDesc?: string
  offerSwitch?: boolean
  stockCount?: number
  variantCount?: number
  priceRange?: { min: number; max: number }
}

// Inventory Types
export interface InventoryItem {
  id: number
  name: string
  category: string
  image: string
  variants: { id?: number; name: string; stock: number; initialStock: number }[]
  lastEdited: string
}

// Alert Types
export interface Alert {
  title: string
  desc: string
  type: string
}

// Admin Review Types
export interface AdminReview {
  id: number
  product: string
  productCategory: string
  productImg: string
  customerName: string
  rating: number
  text: string
  date: string
  time: string
}

// Order Types
export interface OrderItem {
  name: string
  variant: string | null
  qty: number
  basePrice: number
  offerText: string | null
  offerDiscount: number
  couponCode: string | null
  couponDiscount: number
  productId?: number
}

export interface Order {
  id: string
  customer: string
  phone: string
  address: string
  note?: string
  date: string
  time: string
  paymentMethod: string
  status: 'pending' | 'approved' | 'canceled'
  courierStatus: string
  // Courier tracking fields
  consignmentId?: number
  trackingCode?: string
  courierDeliveredAt?: string
  // Order totals
  subtotal: number
  delivery: number
  discount: number
  couponCodes: string[]
  couponAmount: number
  total: number
  canceledBy: string | null
  items: OrderItem[]
  // Timestamp for accurate time calculations
  createdAt?: Date | string | null
}

// Coupon Types
export interface Coupon {
  id: string
  code: string
  type: 'pct' | 'fixed'
  value: number
  scope: 'all' | 'products' | 'categories'
  expiry: string
  selectedProducts?: number[]
  selectedCategories?: string[]
}

export interface CouponProduct {
  id: number
  name: string
  price: string
  img: string
}

export interface CouponCategory {
  name: string
  color: string
}

// Abandoned Checkout Types
export interface AbandonedVariant {
  label: string | null
  qty: number
}

export interface AbandonedProduct {
  name: string
  variants: AbandonedVariant[]
}

export interface AbandonedHistory {
  visitNumber?: number
  date: string
  time: string
  timeAgo: string
  relativeTime?: string
  status: 'abandoned' | 'completed'
  products: AbandonedProduct[]
  total: number
  checkoutSeconds?: number
}

export interface AbandonedCheckout {
  id: number
  name: string
  phone: string
  address: string
  visitTime: string
  visitDate: string
  totalVisits: number
  completedOrders: number
  history: AbandonedHistory[]
}

// Customer Types
export interface CustomerOrder {
  date: string
  time: string
  createdAt?: string | null
  visitCount: number
  products: AbandonedProduct[]
  total: number
  paymentMethod?: string
  relativeTime?: string
}

export interface CustomerProfile {
  id: number
  name: string
  phone: string
  address: string
  totalSpent: number
  totalOrders: number
  lastOrderAgo?: string
  lastVisit?: string
  orders: CustomerOrder[]
}

// Settings Types
export interface Settings {
  storeName: string
  storeEmail: string
  storePhone: string
  storeAddress: string
  currency: string
  deliveryCharge: number
  freeDeliveryMin: number
  universalDelivery: boolean
  universalDeliveryCharge: number
  // Branding fields
  websiteName?: string
  slogan?: string
  logoUrl?: string
  faviconUrl?: string
  heroImages?: string | string[]  // Can be JSON string from DB or parsed array
  // Delivery fields
  insideDhakaDelivery?: number
  outsideDhakaDelivery?: number
  // Contact fields
  whatsappNumber?: string
  phoneNumber?: string
  facebookUrl?: string
  messengerUsername?: string
  // Page content
  aboutUs?: string
  termsConditions?: string
  refundPolicy?: string
  privacyPolicy?: string
  // Offer section
  offerTitle?: string
  offerSlogan?: string
  // Section naming
  firstSectionName?: string
  firstSectionSlogan?: string
  secondSectionName?: string
  secondSectionSlogan?: string
  thirdSectionName?: string
  thirdSectionSlogan?: string
  // Hero animation
  heroAnimationSpeed?: number
  heroAnimationType?: string
  // Inventory settings
  stockLowPercent?: number
  stockMediumPercent?: number
  // Courier settings (for UI display - actual credentials in .env)
  courierEnabled?: boolean
  // Admin credentials (stored in database)
  adminUsername?: string
  adminPassword?: string
  adminUsernameUpdatedAt?: string | null
  adminPasswordUpdatedAt?: string | null
  // Steadfast Courier API credentials
  steadfastApiKey?: string
  steadfastSecretKey?: string
  steadfastWebhookUrl?: string
  steadfastApiUpdatedAt?: string | null
  // Cloudinary credentials
  cloudinaryCloudName?: string
  cloudinaryApiKey?: string
  cloudinaryApiSecret?: string
  cloudinaryUpdatedAt?: string | null
  // Has-value flags for sensitive fields (from API)
  hasAdminPassword?: boolean
  hasSteadfastApiKey?: boolean
  hasSteadfastSecretKey?: boolean
  hasCloudinaryApiSecret?: boolean
}

// View Types
export type ViewType = 'shop' | 'product' | 'cart' | 'checkout' | 'orders' | 'profile' | 'offers' | 'admin' | 'about' | 'terms' | 'refund' | 'privacy' | 'thankyou' | 'category'
