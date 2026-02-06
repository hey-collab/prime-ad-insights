import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { competitorUpdateSchema, parseJson } from '@/lib/validation'

// GET /api/competitors/[id] - Get a single competitor with ads
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const competitor = await prisma.competitor.findUnique({
      where: { id },
      include: {
        brand: true,
        ads: {
          include: {
            analyses: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!competitor) {
      return NextResponse.json(
        { success: false, error: 'Competitor not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: competitor })
  } catch (error) {
    console.error('Error fetching competitor:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch competitor' },
      { status: 500 }
    )
  }
}

// PUT /api/competitors/[id] - Update a competitor
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, adLibraryUrl, isActive } = parseJson(competitorUpdateSchema, body)

    const competitor = await prisma.competitor.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(adLibraryUrl && { adLibraryUrl }),
        ...(typeof isActive === 'boolean' && { isActive }),
      },
    })

    return NextResponse.json({ success: true, data: competitor })
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
    console.error('Error updating competitor:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update competitor' },
      { status: 500 }
    )
  }
}

// DELETE /api/competitors/[id] - Delete a competitor
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.competitor.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting competitor:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete competitor' },
      { status: 500 }
    )
  }
}
