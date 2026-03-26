/**
 * Steadfast Courier API Integration Service
 * Documentation: https://portal.packzy.com/api/v1
 * 
 * ALL credentials stored in DATABASE ONLY - encrypted with AES-256
 * Admin can change credentials from Admin > Credentials panel
 */

import { db, getCachedCourierCredentials, setCachedCourierCredentials } from '@/db'
import { settings } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { safeDecrypt, isEncrypted } from './security'

interface CreateOrderParams {
  invoice: string
  recipient_name: string
  recipient_phone: string
  recipient_address: string
  cod_amount: number
  alternative_phone?: string
  recipient_email?: string
  note?: string
  item_description?: string
  total_lot?: number
  delivery_type?: 0 | 1 // 0 = home delivery, 1 = point delivery
}

interface BulkOrderItem {
  invoice: string
  recipient_name: string
  recipient_phone: string
  recipient_address: string
  cod_amount: number
  note?: string
}

interface ConsignmentResponse {
  status: number
  message: string
  consignment?: {
    consignment_id: number
    invoice: string
    tracking_code: string
    recipient_name: string
    recipient_phone: string
    recipient_address: string
    cod_amount: number
    status: string
    note: string | null
    created_at: string
    updated_at: string
  }
}

interface BulkOrderResponse {
  invoice: string
  recipient_name: string
  recipient_address: string
  recipient_phone: string
  cod_amount: string
  note: string | null
  consignment_id: number | null
  tracking_code: string | null
  status: 'success' | 'error'
}

interface CourierCredentials {
  apiKey: string
  secretKey: string
  webhookUrl: string
}

// Cache TTL: 30 seconds for credentials
const CREDENTIALS_CACHE_TTL = 30 * 1000

class SteadfastService {
  private baseUrl: string

  constructor() {
    this.baseUrl = 'https://portal.packzy.com/api/v1'
  }

  /**
   * Get credentials from DATABASE ONLY (with decryption)
   */
  private async getCredentials(): Promise<CourierCredentials | null> {
    const now = Date.now()
    
    // Check cache first
    const cached = getCachedCourierCredentials()
    if (cached && (now - cached.timestamp) < CREDENTIALS_CACHE_TTL) {
      return cached.data
    }
    
    // Get from database and DECRYPT
    try {
      const result = await db.select().from(settings).where(eq(settings.id, 1)).limit(1)
      
      if (result.length > 0) {
        const s = result[0]
        
        if (s.steadfastApiKey && s.steadfastSecretKey) {
          // Use safeDecrypt - returns null on failure
          const apiKey = isEncrypted(s.steadfastApiKey) ? safeDecrypt(s.steadfastApiKey) : s.steadfastApiKey
          const secretKey = isEncrypted(s.steadfastSecretKey) ? safeDecrypt(s.steadfastSecretKey) : s.steadfastSecretKey
          
          // If decryption failed, return null
          if (apiKey === null || secretKey === null) {
            console.error('[Steadfast] Failed to decrypt credentials - they may need to be re-saved in Admin > Credentials')
            return null
          }
          
          const creds: CourierCredentials = {
            apiKey: apiKey,
            secretKey: secretKey,
            webhookUrl: s.steadfastWebhookUrl || '',
          }
          setCachedCourierCredentials(creds)
          return creds
        }
      }
    } catch (error) {
      console.error('[Steadfast] Error fetching credentials from database:', error)
    }
    
    return null
  }

  /**
   * Get headers with current credentials
   */
  private async getHeaders(): Promise<HeadersInit | null> {
    const creds = await this.getCredentials()
    if (!creds) return null
    
    return {
      'Api-Key': creds.apiKey,
      'Secret-Key': creds.secretKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  }

  /**
   * Check if API credentials are configured
   */
  async isConfiguredAsync(): Promise<boolean> {
    const creds = await this.getCredentials()
    return creds !== null
  }

  /**
   * Clear credentials cache (call when credentials are updated)
   */
  clearCache(): void {
    globalThis.__courierCredentials = undefined
  }

  /**
   * Safely parse API response
   */
  private async parseResponse(response: Response): Promise<{ data: any; error: string | null }> {
    try {
      const text = await response.text()
      
      try {
        const data = JSON.parse(text)
        return { data, error: null }
      } catch {
        return { data: null, error: text }
      }
    } catch {
      return { data: null, error: 'Failed to read response' }
    }
  }

  /**
   * Verify API credentials by checking balance
   */
  async verifyCredentials(): Promise<{ valid: boolean; message: string; balance?: number }> {
    const creds = await this.getCredentials()
    
    if (!creds) {
      return {
        valid: false,
        message: 'Steadfast API credentials not configured. Please add them in Admin > Credentials.'
      }
    }

    try {
      const headers = await this.getHeaders()
      if (!headers) {
        return { valid: false, message: 'Failed to get credentials' }
      }

      const response = await fetch(`${this.baseUrl}/get_balance`, {
        method: 'GET',
        headers
      })

      const { data, error } = await this.parseResponse(response)
      
      if (error) {
        return {
          valid: false,
          message: error.includes('inactive') || error.includes('not active')
            ? 'Your Steadfast account is NOT ACTIVE. Please activate API access in Steadfast dashboard.'
            : error.includes('Invalid') || error.includes('unauthorized')
            ? 'Invalid API credentials. Please check your API Key and Secret Key.'
            : `Steadfast API Error: ${error}`
        }
      }
      
      if (data && data.status === 200) {
        return {
          valid: true,
          message: 'Credentials verified successfully!',
          balance: data.current_balance
        }
      }
      
      return {
        valid: false,
        message: data?.message || 'Unknown error from Steadfast API'
      }
    } catch {
      return {
        valid: false,
        message: 'Failed to connect to Steadfast. Please check your internet connection.'
      }
    }
  }

  /**
   * Create a single order/consignment
   */
  async createOrder(params: CreateOrderParams): Promise<ConsignmentResponse> {
    const creds = await this.getCredentials()
    
    if (!creds) {
      return {
        status: 500,
        message: 'Steadfast API credentials not configured. Please add them in Admin > Credentials.'
      }
    }

    try {
      const headers = await this.getHeaders()
      if (!headers) {
        return { status: 500, message: 'Failed to get credentials' }
      }

      const response = await fetch(`${this.baseUrl}/create_order`, {
        method: 'POST',
        headers,
        body: JSON.stringify(params)
      })

      const rawText = await response.text()
      
      try {
        const parsed = JSON.parse(rawText)
        
        if (parsed.status === 200 && parsed.consignment) {
          return parsed
        }
        
        return {
          status: parsed.status || response.status,
          message: parsed.message || 'Failed to create order'
        }
      } catch {
        return {
          status: response.status,
          message: rawText || 'Unknown error'
        }
      }
    } catch {
      return {
        status: 500,
        message: 'Failed to connect to Steadfast. Please check your internet connection.'
      }
    }
  }

  /**
   * Create bulk orders (max 500 items)
   */
  async createBulkOrders(orders: BulkOrderItem[]): Promise<BulkOrderResponse[]> {
    const creds = await this.getCredentials()
    if (!creds) return []

    try {
      const headers = await this.getHeaders()
      if (!headers) return []

      const response = await fetch(`${this.baseUrl}/create_order/bulk-order`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ data: JSON.stringify(orders) })
      })

      const { data } = await this.parseResponse(response)
      return data || []
    } catch (error) {
      console.error('[Steadfast] Bulk order error:', error)
      return []
    }
  }

  /**
   * Check delivery status by consignment ID
   */
  async getStatusByConsignmentId(consignmentId: number): Promise<any> {
    const headers = await this.getHeaders()
    if (!headers) return null

    try {
      const response = await fetch(`${this.baseUrl}/status_by_cid/${consignmentId}`, {
        method: 'GET',
        headers
      })

      const { data } = await this.parseResponse(response)
      return data
    } catch (error) {
      console.error('[Steadfast] Get status error:', error)
      return null
    }
  }

  /**
   * Check delivery status by invoice ID
   */
  async getStatusByInvoice(invoice: string): Promise<any> {
    const headers = await this.getHeaders()
    if (!headers) return null

    try {
      const response = await fetch(`${this.baseUrl}/status_by_invoice/${invoice}`, {
        method: 'GET',
        headers
      })

      const { data } = await this.parseResponse(response)
      return data
    } catch (error) {
      console.error('[Steadfast] Get status by invoice error:', error)
      return null
    }
  }

  /**
   * Check delivery status by tracking code
   */
  async getStatusByTrackingCode(trackingCode: string): Promise<any> {
    const headers = await this.getHeaders()
    if (!headers) return null

    try {
      const response = await fetch(`${this.baseUrl}/status_by_trackingcode/${trackingCode}`, {
        method: 'GET',
        headers
      })

      const { data } = await this.parseResponse(response)
      return data
    } catch (error) {
      console.error('[Steadfast] Get status by tracking code error:', error)
      return null
    }
  }

  /**
   * Get current balance
   */
  async getBalance(): Promise<{ status: number; current_balance: number } | null> {
    const headers = await this.getHeaders()
    if (!headers) return null

    try {
      const response = await fetch(`${this.baseUrl}/get_balance`, {
        method: 'GET',
        headers
      })

      const { data } = await this.parseResponse(response)
      return data
    } catch (error) {
      console.error('[Steadfast] Get balance error:', error)
      return null
    }
  }
}

// Export singleton instance
export const steadfastService = new SteadfastService()

// Export class for testing
export { SteadfastService }

// Export types
export type { CreateOrderParams, BulkOrderItem, ConsignmentResponse, BulkOrderResponse, CourierCredentials }
