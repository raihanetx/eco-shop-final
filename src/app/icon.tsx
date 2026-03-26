import { ImageResponse } from 'next/og'
import { db } from '@/db'
import { settings } from '@/db/schema'
import { eq } from 'drizzle-orm'

// Image metadata
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

// Image generation
export default async function Icon() {
  try {
    // Fetch settings from database
    const result = await db.select().from(settings).where(eq(settings.id, 1)).limit(1)
    const faviconUrl = result[0]?.faviconUrl

    // If favicon URL exists, fetch and return the image
    if (faviconUrl) {
      try {
        const response = await fetch(faviconUrl)
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer()
          return new Response(arrayBuffer, {
            headers: {
              'Content-Type': 'image/png',
              'Cache-Control': 'public, max-age=3600',
            },
          })
        }
      } catch (e) {
        console.error('Failed to fetch favicon:', e)
      }
    }
  } catch (e) {
    console.error('Failed to get settings:', e)
  }

  // Fallback: Generate default icon
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: '#16a34a',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: '8px',
          fontWeight: 'bold',
        }}
      >
        E
      </div>
    ),
    { ...size }
  )
}
