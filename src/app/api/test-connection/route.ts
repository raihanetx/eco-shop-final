/**
 * Test Connection API
 * Tests Cloudinary and Courier API connections
 * Protected: Admin only - exposes credential validity
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { settings } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { safeDecrypt } from '@/lib/security'
import { steadfastService } from '@/lib/steadfast'
import { v2 as cloudinary } from 'cloudinary'
import { isApiAuthenticated, authErrorResponse } from '@/lib/api-auth'

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Authentication required - this endpoint can reveal credential validity
    if (!await isApiAuthenticated()) {
      return authErrorResponse()
    }

    const { type } = await request.json()

    // Log only in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[TEST-CONNECTION] Testing:', type)
    }

    if (type === 'cloudinary') {
      return await testCloudinary()
    } else if (type === 'courier') {
      return await testCourier()
    }

    return NextResponse.json({
      success: false,
      message: 'Invalid test type'
    })
  } catch (error) {
    console.error('Test connection error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    })
  }
}

async function testCloudinary() {
  try {
    // Get Cloudinary credentials from database
    const result = await db.select().from(settings).where(eq(settings.id, 1)).limit(1)
    
    if (result.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Settings not found. Please save your credentials first.'
      })
    }

    const setting = result[0]
    const cloudName = setting.cloudinaryCloudName
    const apiKey = setting.cloudinaryApiKey
    let apiSecret = setting.cloudinaryApiSecret

    // Development logging only
    if (process.env.NODE_ENV === 'development') {
      console.log('[TEST-CLOUDINARY] Cloud name:', cloudName || 'NOT SET')
      console.log('[TEST-CLOUDINARY] API key:', apiKey || 'NOT SET')
      console.log('[TEST-CLOUDINARY] API secret exists:', !!apiSecret)
    }

    // Decrypt API secret if encrypted
    if (apiSecret && apiSecret.startsWith('enc:')) {
      const decrypted = safeDecrypt(apiSecret)
      if (process.env.NODE_ENV === 'development') {
        console.log('[TEST-CLOUDINARY] Decryption result:', decrypted ? 'SUCCESS' : 'FAILED')
      }
      if (!decrypted) {
        return NextResponse.json({
          success: false,
          message: 'Failed to decrypt API Secret. Please re-save your Cloudinary credentials.'
        })
      }
      apiSecret = decrypted
    }

    // Check if credentials are set
    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({
        success: false,
        message: 'Please fill in all Cloudinary credentials (Cloud Name, API Key, API Secret)'
      })
    }

    // Configure Cloudinary SDK with the credentials
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    })

    // Test using Cloudinary SDK - get account usage
    const usageResult = await cloudinary.api.usage()

    if (process.env.NODE_ENV === 'development') {
      console.log('[TEST-CLOUDINARY] Success! Resources:', usageResult.resources, 'Bandwidth:', usageResult.bandwidth?.used || 0)
    }

    // Format bandwidth to human readable
    const formatBytes = (bytes: number) => {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const bandwidthUsed = usageResult.bandwidth?.used || 0
    const bandwidthLimit = usageResult.bandwidth?.limit || 0
    const resourcesCount = usageResult.resources || 0
    const storageUsed = usageResult.storage?.used || 0

    return NextResponse.json({
      success: true,
      message: `Cloudinary connected!`,
      details: {
        resources: resourcesCount,
        bandwidth: {
          used: bandwidthUsed,
          limit: bandwidthLimit,
          usedFormatted: formatBytes(bandwidthUsed),
          limitFormatted: bandwidthLimit > 0 ? formatBytes(bandwidthLimit) : 'unlimited'
        },
        storage: {
          used: storageUsed,
          usedFormatted: formatBytes(storageUsed)
        }
      }
    })
  } catch (error: any) {
    console.error('[TEST-CLOUDINARY] Error:', error?.message || error)
    
    // Handle specific Cloudinary errors
    if (error?.http_code === 401 || error?.message?.includes('Invalid')) {
      return NextResponse.json({
        success: false,
        message: 'Invalid Cloudinary credentials. Please check your API Key and Secret.'
      })
    }
    
    return NextResponse.json({
      success: false,
      message: `Connection failed: ${error?.message || 'Unknown error'}`
    })
  }
}

async function testCourier() {
  try {
    // Use the existing steadfastService which handles decryption and correct API format
    const result = await steadfastService.verifyCredentials()
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[TEST-COURIER] Verification result:', result)
    }
    
    if (result.valid) {
      return NextResponse.json({
        success: true,
        message: result.balance 
          ? `Steadfast connected! Balance: ৳${result.balance}`
          : result.message
      })
    } else {
      return NextResponse.json({
        success: false,
        message: result.message
      })
    }
  } catch (error) {
    console.error('Courier test error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to connect to Steadfast API. Please check your network connection.'
    })
  }
}
