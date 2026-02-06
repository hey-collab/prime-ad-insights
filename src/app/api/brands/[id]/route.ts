import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { brandUpdateSchema, parseJson } from '@/lib/validation'

// GET /api/brands/[id] - Get a single brand
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const brand = await prisma.brand.findUnique({
      where: { id },
      include: {
        competitors: {
          include: {
            ads: {
              include: {
                analyses: true,
              },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    })

    if (!brand) {
      return NextResponse.json(
        { success: false, error: 'Brand not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: brand })
  } catch (error) {
    console.error('Error fetching brand:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch brand' },
      { status: 500 }
    )
  }
}

// PUT /api/brands/[id] - Update a brand
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, targetAudience, toneOfVoice, productInfo, industry } =
      parseJson(brandUpdateSchema, body)

    const brand = await prisma.brand.update({
      where: { id },
      data: {
        name,
        description,
        targetAudience,
        toneOfVoice,
        productInfo,
        industry,
      },
    })

    return NextResponse.json({ success: true, data: brand })
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
    console.error('Error updating brand:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update brand' },
      { status: 500 }
    )
  }
}

// DELETE /api/brands/[id] - Delete a brand
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.brand.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting brand:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete brand' },
      { status: 500 }
    )
  }
}
