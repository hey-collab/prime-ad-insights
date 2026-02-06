import { NextResponse } from 'next/server'
import { createDriveService } from '@/lib/google-drive'

// GET /api/drive/auth - Get Google Drive auth URL
export async function GET() {
  try {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Google OAuth credentials not configured' },
        { status: 500 }
      )
    }

    const driveService = createDriveService()
    const authUrl = driveService.getAuthUrl()

    return NextResponse.json({ success: true, data: { authUrl } })
  } catch (error) {
    console.error('Error generating auth URL:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate auth URL' },
      { status: 500 }
    )
  }
}
