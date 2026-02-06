import { NextRequest, NextResponse } from 'next/server'
import { analyzeAdById } from '@/lib/tasks'
import { enqueueJob } from '@/lib/jobs'
import { analyzeAdSchema, parseJson } from '@/lib/validation'

// POST /api/ads/[id]/analyze - Analyze an ad with Gemini
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const { async = false } = parseJson(analyzeAdSchema, body)

    if (async) {
      const job = await enqueueJob('ANALYZE_AD', { adId: id })
      return NextResponse.json({ success: true, data: { jobId: job.id } }, { status: 202 })
    }

    const { analysis, driveFileId } = await analyzeAdById(id)

    return NextResponse.json({ success: true, data: { ...analysis, driveFileId } })
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
    console.error('Error analyzing ad:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to analyze ad' },
      { status: 500 }
    )
  }
}
