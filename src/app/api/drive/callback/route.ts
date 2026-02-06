import { NextRequest, NextResponse } from 'next/server'
import { createDriveService } from '@/lib/google-drive'
import { prisma } from '@/lib/db'

// GET /api/drive/callback - Handle Google OAuth callback
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(new URL('/?error=drive_auth_denied', request.url))
    }

    if (!code) {
      return NextResponse.redirect(new URL('/?error=no_code', request.url))
    }

    const driveService = createDriveService()
    const refreshToken = await driveService.getTokenFromCode(code)

    if (!refreshToken) {
      return NextResponse.redirect(new URL('/?error=drive_no_refresh_token', request.url))
    }

    // Save refresh token to settings
    await prisma.settings.upsert({
      where: { id: 'default' },
      update: { googleRefreshToken: refreshToken },
      create: {
        id: 'default',
        googleRefreshToken: refreshToken,
      },
    })

    // Redirect back to app with success message
    return NextResponse.redirect(new URL('/?success=drive_connected', request.url))
  } catch (error) {
    console.error('Error handling OAuth callback:', error)
    return NextResponse.redirect(new URL('/?error=drive_auth_failed', request.url))
  }
}
