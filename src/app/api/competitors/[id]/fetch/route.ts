import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { fetchAdsForCompetitor } from '@/lib/tasks'
import { enqueueJob } from '@/lib/jobs'
import { fetchAdsSchema, parseJson } from '@/lib/validation'

// POST /api/competitors/[id]/fetch - Fetch ads from Ad Library
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const { limit = 10, async = false } = parseJson(fetchAdsSchema, body)

    // Get competitor
    const competitor = await prisma.competitor.findUnique({
      where: { id },
      include: { brand: true },
    })

    if (!competitor) {
      return NextResponse.json(
        { success: false, error: 'Competitor not found' },
        { status: 404 }
      )
    }

    if (async) {
      const job = await enqueueJob('FETCH_COMPETITOR_ADS', { competitorId: id, limit })
      return NextResponse.json({ success: true, data: { jobId: job.id } }, { status: 202 })
    }

    const result = await fetchAdsForCompetitor(id, limit)

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
    if (error instanceof Error) {
      console.error('Error fetching ads:', error.message)
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
    console.error('Error fetching ads:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ads' },
      { status: 500 }
    )
  }
}
