import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { db } from '@/db'
import { settings } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { safeDecrypt } from '@/lib/security'
import { isApiAuthenticated, authErrorResponse } from '@/lib/api-auth'

// Get Cloudinary config - tries database first, then environment variables
async function getCloudinaryConfig(): Promise<{
  cloud_name: string
  api_key: string
  api_secret: string
} | null> {
  // First, try environment variables (for development/fallback)
  const envCloudName = process.env.CLOUDINARY_CLOUD_NAME
  const envApiKey = process.env.CLOUDINARY_API_KEY
  const envApiSecret = process.env.CLOUDINARY_API_SECRET
  
  if (envCloudName && envApiKey && envApiSecret) {
    return {
      cloud_name: envCloudName,
      api_key: envApiKey,
      api_secret: envApiSecret,
    }
  }
  
  // Then try database
  try {
    const result = await db.select().from(settings).where(eq(settings.id, 1)).limit(1)
    
    if (result.length > 0) {
      const s = result[0]
      
      // Use safeDecrypt which returns null on failure
      const apiSecret = safeDecrypt(s.cloudinaryApiSecret || '')
      
      // If decryption failed, return null so user knows to re-save credentials
      if (apiSecret === null) {
        console.error('Cloudinary API Secret decryption failed - credentials need to be re-saved')
        return null
      }
      
      if (s.cloudinaryCloudName && s.cloudinaryApiKey && apiSecret) {
        return {
          cloud_name: s.cloudinaryCloudName,
          api_key: s.cloudinaryApiKey,
          api_secret: apiSecret,
        }
      }
    }
  } catch (error) {
    console.error('Failed to fetch Cloudinary config from database:', error)
  }
  
  return null
}

// POST - Upload image to Cloudinary (Admin only)
export async function POST(request: NextRequest) {
  try {
    // Authentication required for uploads (prevent abuse)
    if (!await isApiAuthenticated()) {
      return authErrorResponse()
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'logo', 'favicon', 'hero', 'product', 'category'

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only images are allowed.' }, { status: 400 })
    }

    // Validate file size (max 10MB for Cloudinary)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 })
    }

    // Get Cloudinary config
    const config = await getCloudinaryConfig()
    
    if (!config) {
      return NextResponse.json({ 
        error: 'Cloudinary is not configured. Please go to Admin > Credentials > Cloudinary and save your credentials.',
        needsConfig: true
      }, { status: 400 })
    }
    
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: config.cloud_name,
      api_key: config.api_key,
      api_secret: config.api_secret,
    })

    // Convert file to base64 for upload
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const dataUri = `data:${file.type};base64,${base64}`

    // Determine folder based on type
    const folder = `ecomart/${type || 'images'}`

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder,
      resource_type: 'image',
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
      ],
    })

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      fileName: uploadResult.public_id.split('/').pop(),
      width: uploadResult.width,
      height: uploadResult.height,
    })
  } catch (error: any) {
    console.error('Error uploading image to Cloudinary:', error)
    
    // Provide more specific error message
    let errorMessage = 'Failed to upload image'
    if (error?.message?.includes('Invalid API Key')) {
      errorMessage = 'Invalid Cloudinary API Key. Please check your credentials.'
    } else if (error?.message?.includes('Invalid API Secret')) {
      errorMessage = 'Invalid Cloudinary API Secret. Please check your credentials.'
    } else if (error?.http_code === 401) {
      errorMessage = 'Cloudinary authentication failed. Please verify your credentials.'
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      details: error?.message 
    }, { status: 500 })
  }
}

// DELETE - Delete image from Cloudinary (Admin only)
export async function DELETE(request: NextRequest) {
  try {
    // Authentication required for deletes
    if (!await isApiAuthenticated()) {
      return authErrorResponse()
    }

    const { searchParams } = new URL(request.url)
    const publicId = searchParams.get('publicId')

    if (!publicId) {
      return NextResponse.json({ error: 'Public ID required' }, { status: 400 })
    }

    // Get Cloudinary config
    const config = await getCloudinaryConfig()
    
    if (!config) {
      return NextResponse.json({ error: 'Cloudinary not configured' }, { status: 400 })
    }
    
    cloudinary.config({
      cloud_name: config.cloud_name,
      api_key: config.api_key,
      api_secret: config.api_secret,
    })

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId)

    if (result.result === 'ok') {
      return NextResponse.json({ success: true, message: 'Image deleted' })
    } else {
      return NextResponse.json({ error: 'Failed to delete image', result }, { status: 400 })
    }
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error)
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 })
  }
}
