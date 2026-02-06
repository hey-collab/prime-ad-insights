import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { parseAdLibraryUrl } from '@/lib/ad-library-scraper'
import { competitorCreateSchema, parseJson } from '@/lib/validation'

// GET /api/competitors - List all competitors
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get('brandId')

    const where = brandId ? { brandId } : {}

    const competitors = await prisma.competitor.findMany({
      where,
      include: {
        brand: true,
        _count: {
          select: { ads: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: competitors })
  } catch (error) {
    console.error('Error fetching competitors:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch competitors' },
      { status: 500 }
    )
  }
}

// POST /api/competitors - Create a new competitor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { brandId, name, adLibraryUrl } = parseJson(competitorCreateSchema, body)

    // Validate and parse the Ad Library URL
    const { pageId, valid } = parseAdLibraryUrl(adLibraryUrl)
    if (!valid || !pageId) {
      return NextResponse.json(
        { success: false, error: 'Invalid Facebook Ad Library URL (missing page id)' },
        { status: 400 }
      )
    }

    // Check if brand exists
    const brand = await prisma.brand.findUnique({ where: { id: brandId } })
    if (!brand) {
      return NextResponse.json(
        { success: false, error: 'Brand not found' },
        { status: 404 }
      )
    }

    const competitor = await prisma.competitor.create({
      data: {
        brandId,
        name,
        adLibraryUrl,
        pageId,
      },
      include: {
        brand: true,
      },
    })

    return NextResponse.json({ success: true, data: competitor }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
    console.error('Error creating competitor:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create competitor' },
      { status: 500 }
    )
  }
}
