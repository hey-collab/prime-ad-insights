import { NextResponse } from 'next/server'
import { getGoogleRefreshToken } from '@/lib/settings'

// GET /api/drive/status - Check if Drive is connected
export async function GET() {
  try {
    const refreshToken = await getGoogleRefreshToken()
    return NextResponse.json({ success: true, data: { connected: !!refreshToken } })
  } catch (error) {
    console.error('Error checking Drive status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to check Drive status' },
      { status: 500 }
    )
  }
}
