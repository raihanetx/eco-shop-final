import { NextResponse } from 'next/server'
import { getAuditLogs } from '@/lib/security'
import { isApiAuthenticated, authErrorResponse } from '@/lib/api-auth'

// GET /api/audit-logs - Get recent audit logs (Protected - Admin only)
export async function GET(request: Request) {
  try {
    // SECURITY: Authentication required - audit logs contain sensitive security info
    if (!await isApiAuthenticated()) {
      return authErrorResponse()
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    
    const logs = await getAuditLogs(limit)
    
    return NextResponse.json({
      success: true,
      data: logs
    })
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch audit logs'
    }, { status: 500 })
  }
}
