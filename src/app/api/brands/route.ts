import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { brandCreateSchema, parseJson } from '@/lib/validation'

// GET /api/brands - List all brands
export async function GET() {
  try {
    const brands = await prisma.brand.findMany({
      include: {
        competitors: {
          include: {
            _count: {
              select: { ads: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: brands })
  } catch (error) {
    console.error('Error fetching brands:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch brands' },
      { status: 500 }
    )
  }
}

// POST /api/brands - Create a new brand
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, targetAudience, toneOfVoice, productInfo, industry } =
      parseJson(brandCreateSchema, body)

    const brand = await prisma.brand.create({
      data: {
        name,
        description,
        targetAudience,
        toneOfVoice,
        productInfo,
        industry,
      },
    })

    return NextResponse.json({ success: true, data: brand }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
    console.error('Error creating brand:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create brand' },
      { status: 500 }
    )
  }
}
