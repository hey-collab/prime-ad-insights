import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/ads/[id] - Get a single ad with all analyses
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const ad = await prisma.ad.findUnique({
      where: { id },
      include: {
        competitor: {
          include: {
            brand: true,
          },
        },
        analyses: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!ad) {
      return NextResponse.json(
        { success: false, error: 'Ad not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: ad })
  } catch (error) {
    console.error('Error fetching ad:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ad' },
      { status: 500 }
    )
  }
}

// DELETE /api/ads/[id] - Delete an ad
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.ad.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting ad:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete ad' },
      { status: 500 }
    )
  }
}
