import { NextRequest, NextResponse } from 'next/server'
import { analyzeBatchAds } from '@/lib/tasks'
import { enqueueJob } from '@/lib/jobs'
import { analyzeBatchSchema, parseJson } from '@/lib/validation'

// POST /api/analyze/batch - Analyze multiple ads and generate report
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { competitorId, adIds, async = false } = parseJson(analyzeBatchSchema, body)

    if (async) {
      const job = await enqueueJob('ANALYZE_COMPETITOR_ADS', { competitorId, adIds })
      return NextResponse.json({ success: true, data: { jobId: job.id } }, { status: 202 })
    }

    const result = await analyzeBatchAds({ competitorId, adIds })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
    console.error('Error in batch analysis:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to perform batch analysis' },
      { status: 500 }
    )
  }
}
