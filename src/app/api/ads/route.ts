import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/ads - List all ads with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const competitorId = searchParams.get('competitorId')
    const brandId = searchParams.get('brandId')
    const limitParam = parseInt(searchParams.get('limit') || '50', 10)
    const limit = Number.isFinite(limitParam)
      ? Math.min(Math.max(limitParam, 1), 100)
      : 50

    const where: Record<string, unknown> = {}

    if (competitorId) {
      where.competitorId = competitorId
    }

    if (brandId) {
      where.competitor = { brandId }
    }

    const ads = await prisma.ad.findMany({
      where,
      include: {
        competitor: {
          include: {
            brand: true,
          },
        },
        analyses: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({ success: true, data: ads })
  } catch (error) {
    console.error('Error fetching ads:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ads' },
      { status: 500 }
    )
  }
}
