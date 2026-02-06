import { NextRequest, NextResponse } from 'next/server'
import { processJobs } from '@/lib/jobs'

function isAuthorizedForCron(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return true
  const authHeader = request.headers.get('authorization') || ''
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  const headerSecret = request.headers.get('x-cron-secret') || ''
  return bearer === cronSecret || headerSecret === cronSecret
}

async function handleRun(limit: number) {
  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 20) : 5
  const results = await processJobs(safeLimit)
  return NextResponse.json({ success: true, data: { processed: results.length, results } })
}

// GET /api/jobs/run - Process queued jobs (for cron)
export async function GET(request: NextRequest) {
  try {
    if (!isAuthorizedForCron(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const limitParam = request.nextUrl.searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : 5
    return await handleRun(limit)
  } catch (error) {
    console.error('Error processing jobs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process jobs' },
      { status: 500 }
    )
  }
}

// POST /api/jobs/run - Process queued jobs (manual)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const limit = typeof body.limit === 'number' ? body.limit : parseInt(body.limit, 10)
    return await handleRun(limit)
  } catch (error) {
    console.error('Error processing jobs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process jobs' },
      { status: 500 }
    )
  }
}
