/**
 * Input Validation Utilities
 * Provides validation helpers for API routes
 * 
 * SECURITY: Prevents malformed data, injection attacks, and data corruption
 */

import { NextResponse } from 'next/server'

// Validation error response
export function validationErrorResponse(errors: string[]) {
  return NextResponse.json(
    { success: false, error: 'Validation failed', details: errors },
    { status: 400 }
  )
}

// Sanitize string input - remove dangerous characters
export function sanitizeString(input: string, maxLength: number = 500): string {
  if (typeof input !== 'string') return ''
  
  // Trim whitespace
  let sanitized = input.trim()
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '')
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength)
  }
  
  return sanitized
}

// Validate phone number (Bangladesh format: 01XXXXXXXXX)
export function validatePhone(phone: string): { valid: boolean; error?: string; sanitized?: string } {
  if (!phone) {
    return { valid: false, error: 'Phone number is required' }
  }
  
  // Remove non-digits
  const digits = phone.replace(/\D/g, '')
  
  if (digits.length !== 11) {
    return { valid: false, error: 'Phone number must be exactly 11 digits' }
  }
  
  if (!digits.startsWith('01')) {
    return { valid: false, error: 'Phone number must start with 01' }
  }
  
  return { valid: true, sanitized: digits }
}

// Validate email
export function validateEmail(email: string): { valid: boolean; error?: string; sanitized?: string } {
  if (!email) {
    return { valid: true, sanitized: '' } // Email is optional
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const sanitized = sanitizeString(email, 100)
  
  if (!emailRegex.test(sanitized)) {
    return { valid: false, error: 'Invalid email format' }
  }
  
  return { valid: true, sanitized }
}

// Validate product ID (positive integer)
export function validateProductId(id: any): { valid: boolean; error?: string; sanitized?: number } {
  if (id === undefined || id === null) {
    return { valid: false, error: 'Product ID is required' }
  }
  
  const num = parseInt(String(id))
  
  if (isNaN(num) || num <= 0) {
    return { valid: false, error: 'Product ID must be a positive number' }
  }
  
  return { valid: true, sanitized: num }
}

// Validate quantity (positive integer)
export function validateQuantity(qty: any): { valid: boolean; error?: string; sanitized?: number } {
  if (qty === undefined || qty === null) {
    return { valid: false, error: 'Quantity is required' }
  }
  
  const num = parseInt(String(qty))
  
  if (isNaN(num) || num <= 0) {
    return { valid: false, error: 'Quantity must be a positive number' }
  }
  
  if (num > 100) {
    return { valid: false, error: 'Quantity cannot exceed 100' }
  }
  
  return { valid: true, sanitized: num }
}

// Validate price (non-negative number)
export function validatePrice(price: any): { valid: boolean; error?: string; sanitized?: number } {
  if (price === undefined || price === null) {
    return { valid: false, error: 'Price is required' }
  }
  
  const num = parseFloat(String(price))
  
  if (isNaN(num) || num < 0) {
    return { valid: false, error: 'Price must be a non-negative number' }
  }
  
  if (num > 999999.99) {
    return { valid: false, error: 'Price exceeds maximum allowed value' }
  }
  
  return { valid: true, sanitized: Math.round(num * 100) / 100 } // Round to 2 decimal places
}

// Validate order ID format
export function validateOrderId(orderId: string): { valid: boolean; error?: string; sanitized?: string } {
  if (!orderId) {
    return { valid: false, error: 'Order ID is required' }
  }
  
  // Order ID should be alphanumeric with hyphens
  const sanitized = sanitizeString(orderId, 50)
  
  if (!/^[A-Za-z0-9-]+$/.test(sanitized)) {
    return { valid: false, error: 'Invalid order ID format' }
  }
  
  return { valid: true, sanitized }
}

// Validate category name
export function validateCategoryName(name: string): { valid: boolean; error?: string; sanitized?: string } {
  if (!name) {
    return { valid: false, error: 'Category name is required' }
  }
  
  const sanitized = sanitizeString(name, 100)
  
  if (sanitized.length < 2) {
    return { valid: false, error: 'Category name must be at least 2 characters' }
  }
  
  return { valid: true, sanitized }
}

// Validate product name
export function validateProductName(name: string): { valid: boolean; error?: string; sanitized?: string } {
  if (!name) {
    return { valid: false, error: 'Product name is required' }
  }
  
  const sanitized = sanitizeString(name, 200)
  
  if (sanitized.length < 2) {
    return { valid: false, error: 'Product name must be at least 2 characters' }
  }
  
  return { valid: true, sanitized }
}

// Validate URL
export function validateUrl(url: string, allowedDomains?: string[]): { valid: boolean; error?: string; sanitized?: string } {
  if (!url) {
    return { valid: true, sanitized: '' } // URL is optional
  }
  
  try {
    const parsed = new URL(url)
    
    // Only allow http and https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'Only HTTP and HTTPS URLs are allowed' }
    }
    
    // Check domain allowlist if provided
    if (allowedDomains && allowedDomains.length > 0) {
      const hostname = parsed.hostname
      if (!allowedDomains.some(domain => hostname === domain || hostname.endsWith('.' + domain))) {
        return { valid: false, error: 'URL domain not allowed' }
      }
    }
    
    return { valid: true, sanitized: url }
  } catch {
    return { valid: false, error: 'Invalid URL format' }
  }
}

// Validate coupon code
export function validateCouponCode(code: string): { valid: boolean; error?: string; sanitized?: string } {
  if (!code) {
    return { valid: false, error: 'Coupon code is required' }
  }
  
  // Uppercase and remove spaces
  const sanitized = sanitizeString(code.toUpperCase().replace(/\s/g, ''), 20)
  
  // Only alphanumeric
  if (!/^[A-Z0-9]+$/.test(sanitized)) {
    return { valid: false, error: 'Coupon code must contain only letters and numbers' }
  }
  
  if (sanitized.length < 3) {
    return { valid: false, error: 'Coupon code must be at least 3 characters' }
  }
  
  return { valid: true, sanitized }
}

// Validate address
export function validateAddress(address: string): { valid: boolean; error?: string; sanitized?: string } {
  if (!address) {
    return { valid: false, error: 'Address is required' }
  }
  
  const sanitized = sanitizeString(address, 500)
  
  if (sanitized.length < 10) {
    return { valid: false, error: 'Address must be at least 10 characters' }
  }
  
  return { valid: true, sanitized }
}

// Validate customer name
export function validateCustomerName(name: string): { valid: boolean; error?: string; sanitized?: string } {
  if (!name) {
    return { valid: false, error: 'Name is required' }
  }
  
  const sanitized = sanitizeString(name, 100)
  
  if (sanitized.length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters' }
  }
  
  return { valid: true, sanitized }
}

// Validate status values
export function validateOrderStatus(status: string): { valid: boolean; error?: string; sanitized?: string } {
  const validStatuses = ['pending', 'approved', 'canceled', 'processing', 'delivered']
  
  if (!status) {
    return { valid: false, error: 'Status is required' }
  }
  
  const sanitized = status.toLowerCase().trim()
  
  if (!validStatuses.includes(sanitized)) {
    return { valid: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }
  }
  
  return { valid: true, sanitized }
}

// Higher-order function to validate request body
export function validateBody<T>(
  validators: Record<string, (value: any) => { valid: boolean; error?: string; sanitized?: any }>
): (body: Record<string, any>) => { valid: boolean; errors: string[]; sanitized: Partial<T> } {
  return (body: Record<string, any>) => {
    const errors: string[] = []
    const sanitized: Partial<T> = {}
    
    for (const [field, validator] of Object.entries(validators)) {
      const result = validator(body[field])
      if (!result.valid) {
        errors.push(`${field}: ${result.error}`)
      } else if (result.sanitized !== undefined) {
        (sanitized as any)[field] = result.sanitized
      }
    }
    
    return { valid: errors.length === 0, errors, sanitized }
  }
}

// Rate limiting helper (simple in-memory, for production use Redis)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(
  key: string,
  maxRequests: number = 100,
  windowMs: number = 60000 // 1 minute
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const record = rateLimitStore.get(key)
  
  // Clean expired entries every 1000 requests
  if (rateLimitStore.size > 1000) {
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetAt < now) {
        rateLimitStore.delete(k)
      }
    }
  }
  
  if (!record || record.resetAt < now) {
    // New window
    const resetAt = now + windowMs
    rateLimitStore.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: maxRequests - 1, resetAt }
  }
  
  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt }
  }
  
  record.count++
  return { allowed: true, remaining: maxRequests - record.count, resetAt: record.resetAt }
}

// Rate limit error response
export function rateLimitErrorResponse(resetAt: number) {
  const resetInSeconds = Math.ceil((resetAt - Date.now()) / 1000)
  return NextResponse.json(
    { success: false, error: `Too many requests. Try again in ${resetInSeconds} seconds.` },
    { 
      status: 429,
      headers: {
        'Retry-After': String(resetInSeconds),
        'X-RateLimit-Reset': String(resetAt)
      }
    }
  )
}
