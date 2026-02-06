import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_API_PATHS = [
  '/api/drive/auth',
  '/api/drive/callback',
  '/api/drive/status',
  '/api/jobs/run',
]

export function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  if (request.nextUrl.pathname.startsWith('/api/jobs/run')) {
    const cronSecret = process.env.CRON_SECRET
    const authHeader = request.headers.get('authorization') || ''
    const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
    const headerSecret = request.headers.get('x-cron-secret') || ''

    if (cronSecret && (bearer === cronSecret || headerSecret === cronSecret)) {
      return NextResponse.next()
    }
  } else if (PUBLIC_API_PATHS.some((path) => request.nextUrl.pathname.startsWith(path))) {
    return NextResponse.next()
  }

  const apiKey = process.env.APP_API_KEY
  if (!apiKey) {
    return NextResponse.next()
  }

  const providedKey = request.headers.get('x-api-key')
  if (!providedKey || providedKey !== apiKey) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*'],
}
