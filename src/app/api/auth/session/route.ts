import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  
  if (session) {
    return NextResponse.json({
      authenticated: true,
      user: {
        id: '1',
        name: 'Admin',
        username: session.username,
        role: session.role,
      }
    })
  }
  
  return NextResponse.json({ authenticated: false })
}
