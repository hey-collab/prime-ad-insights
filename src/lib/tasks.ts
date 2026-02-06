import { prisma } from '@/lib/db'
import { scrapeAds } from '@/lib/ad-library-scraper'
import { createGeminiService } from '@/lib/gemini'
import { createDriveService } from '@/lib/google-drive'
import { getGoogleRefreshToken } from '@/lib/settings'

export async function fetchAdsForCompetitor(competitorId: string, limit = 10) {
  const competitor = await prisma.competitor.findUnique({
    where: { id: competitorId },
    include: { brand: true },
  })

  if (!competitor) {
    throw new Error('Competitor not found')
  }

  const result = await scrapeAds(competitor.adLibraryUrl, {
    accessToken: process.env.META_ACCESS_TOKEN,
    limit,
    useMock: !process.env.META_ACCESS_TOKEN,
  })

  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch ads')
  }

  const savedAds = []
  for (const scrapedAd of result.ads) {
    const ad = await prisma.ad.upsert({
      where: {
        competitorId_adLibraryId: {
          competitorId,
          adLibraryId: scrapedAd.adLibraryId,
        },
      },
      update: {
        adCopy: scrapedAd.adCopy,
        headline: scrapedAd.headline,
        cta: scrapedAd.cta,
        mediaUrl: scrapedAd.mediaUrl,
        mediaType: scrapedAd.mediaType,
        thumbnailUrl: scrapedAd.thumbnailUrl,
        landingPage: scrapedAd.landingPage,
        impressionRange: scrapedAd.impressionRange,
        startDate: scrapedAd.startDate ? new Date(scrapedAd.startDate) : null,
        status: scrapedAd.status,
      },
      create: {
        competitorId,
        adLibraryId: scrapedAd.adLibraryId,
        adCopy: scrapedAd.adCopy,
        headline: scrapedAd.headline,
        cta: scrapedAd.cta,
        mediaUrl: scrapedAd.mediaUrl,
        mediaType: scrapedAd.mediaType,
        thumbnailUrl: scrapedAd.thumbnailUrl,
        landingPage: scrapedAd.landingPage,
        impressionRange: scrapedAd.impressionRange,
        startDate: scrapedAd.startDate ? new Date(scrapedAd.startDate) : null,
        status: scrapedAd.status,
      },
    })
    savedAds.push(ad)
  }

  await prisma.competitor.update({
    where: { id: competitorId },
    data: { lastFetched: new Date() },
  })

  return {
    adsFound: result.ads.length,
    adsSaved: savedAds.length,
    ads: savedAds,
  }
}

export async function analyzeAdById(adId: string) {
  const ad = await prisma.ad.findUnique({
    where: { id: adId },
    include: {
      competitor: {
        include: { brand: true },
      },
    },
  })

  if (!ad) {
    throw new Error('Ad not found')
  }

  const brand = ad.competitor.brand
  const geminiService = createGeminiService()

  const analysisResult = await geminiService.analyzeAd(
    {
      adCopy: ad.adCopy || undefined,
      headline: ad.headline || undefined,
      cta: ad.cta || undefined,
      mediaType: ad.mediaType || undefined,
      mediaUrl: ad.mediaUrl || undefined,
    },
    {
      name: brand.name,
      description: brand.description || undefined,
      targetAudience: brand.targetAudience || undefined,
      toneOfVoice: brand.toneOfVoice || undefined,
      productInfo: brand.productInfo || undefined,
      industry: brand.industry || undefined,
    }
  )

  const analysis = await prisma.analysis.create({
    data: {
      adId,
      framework: analysisResult.framework,
      hooks: analysisResult.hooks,
      concepts: analysisResult.concepts,
      scripts: analysisResult.scripts,
      targetAudience: analysisResult.targetAudience,
      emotionalTriggers: analysisResult.emotionalTriggers,
      repurposedIdea: analysisResult.repurposedIdea,
      strengthsWeaknesses: analysisResult.strengthsWeaknesses,
      rawResponse: JSON.parse(JSON.stringify(analysisResult)),
    },
  })

  let driveFileId: string | null = null
  const refreshToken = await getGoogleRefreshToken()
  if (refreshToken) {
    const driveService = createDriveService(refreshToken)

    const rootFolderId = await driveService.getOrCreateFolder('Competitor Ads')
    const competitorFolderId = await driveService.getOrCreateFolder(
      ad.competitor.name,
      rootFolderId
    )
    const dateFolderId = await driveService.getOrCreateFolder(
      new Date().toISOString().split('T')[0],
      competitorFolderId
    )

    const analysisContent = `# Ad Analysis: ${ad.headline || 'Untitled'}

## Ad Details
- **Competitor**: ${ad.competitor.name}
- **Headline**: ${ad.headline || 'N/A'}
- **CTA**: ${ad.cta || 'N/A'}
- **Media Type**: ${ad.mediaType || 'Unknown'}
- **Impressions**: ${ad.impressionRange || 'Unknown'}

## Ad Copy
${ad.adCopy || 'N/A'}

---

## Analysis

### Framework
${analysisResult.framework}

### Hooks
${analysisResult.hooks}

### Creative Concepts
${analysisResult.concepts}

### Script Breakdown
${analysisResult.scripts}

### Target Audience
${analysisResult.targetAudience}

### Emotional Triggers
${analysisResult.emotionalTriggers}

### Strengths & Weaknesses
${analysisResult.strengthsWeaknesses}

---

## Repurposed Idea for ${brand.name}
${analysisResult.repurposedIdea}

---
*Generated on ${new Date().toISOString()}*
`

    const uploadResult = await driveService.uploadFile(
      `analysis_${ad.adLibraryId}.md`,
      analysisContent,
      'text/markdown',
      dateFolderId
    )

    driveFileId = uploadResult.id

    await prisma.analysis.update({
      where: { id: analysis.id },
      data: { driveFileId },
    })
  }

  return { analysis, driveFileId }
}

export async function analyzeBatchAds(params: { competitorId?: string; adIds?: string[] }) {
  const { competitorId, adIds } = params
  let ads

  if (adIds && Array.isArray(adIds)) {
    ads = await prisma.ad.findMany({
      where: { id: { in: adIds } },
      include: {
        competitor: { include: { brand: true } },
        analyses: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    })
  } else if (competitorId) {
    ads = await prisma.ad.findMany({
      where: { competitorId },
      include: {
        competitor: { include: { brand: true } },
        analyses: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })
  } else {
    throw new Error('competitorId or adIds required')
  }

  if (ads.length === 0) {
    throw new Error('No ads found to analyze')
  }

  const brand = ads[0].competitor.brand
  const competitor = ads[0].competitor
  const geminiService = createGeminiService()

  const results = []
  for (const ad of ads) {
    if (ad.analyses.length > 0) {
      results.push({ ad, analysis: ad.analyses[0], skipped: true })
      continue
    }

    try {
      const analysisResult = await geminiService.analyzeAd(
        {
          adCopy: ad.adCopy || undefined,
          headline: ad.headline || undefined,
          cta: ad.cta || undefined,
          mediaType: ad.mediaType || undefined,
        },
        {
          name: brand.name,
          description: brand.description || undefined,
          targetAudience: brand.targetAudience || undefined,
          toneOfVoice: brand.toneOfVoice || undefined,
          productInfo: brand.productInfo || undefined,
          industry: brand.industry || undefined,
        }
      )

      const analysis = await prisma.analysis.create({
        data: {
          adId: ad.id,
          framework: analysisResult.framework,
          hooks: analysisResult.hooks,
          concepts: analysisResult.concepts,
          scripts: analysisResult.scripts,
          targetAudience: analysisResult.targetAudience,
          emotionalTriggers: analysisResult.emotionalTriggers,
          repurposedIdea: analysisResult.repurposedIdea,
          strengthsWeaknesses: analysisResult.strengthsWeaknesses,
          rawResponse: JSON.parse(JSON.stringify(analysisResult)),
        },
      })

      results.push({ ad, analysis, skipped: false })
    } catch (analyzeError) {
      console.error(`Failed to analyze ad ${ad.id}:`, analyzeError)
      results.push({ ad, error: 'Analysis failed', skipped: false })
    }
  }

  const successfulResults = results.filter((r) => r.analysis && !r.error)
  let reportContent = ''
  let driveReportId: string | null = null

  if (successfulResults.length > 0) {
    reportContent = await geminiService.generateReport(
      competitor.name,
      successfulResults.map((r) => ({
        ad: {
          adCopy: r.ad.adCopy ?? undefined,
          headline: r.ad.headline ?? undefined,
        },
        analysis: {
          framework: r.analysis!.framework ?? undefined,
          hooks: r.analysis!.hooks ?? undefined,
          concepts: r.analysis!.concepts ?? undefined,
          scripts: r.analysis!.scripts ?? undefined,
          targetAudience: r.analysis!.targetAudience ?? undefined,
          emotionalTriggers: r.analysis!.emotionalTriggers ?? undefined,
          repurposedIdea: r.analysis!.repurposedIdea ?? undefined,
          strengthsWeaknesses: r.analysis!.strengthsWeaknesses ?? undefined,
        },
      }))
    )

    const refreshToken = await getGoogleRefreshToken()
    if (refreshToken) {
      try {
        const driveService = createDriveService(refreshToken)
        const rootFolderId = await driveService.getOrCreateFolder('Competitor Ads')
        const competitorFolderId = await driveService.getOrCreateFolder(
          competitor.name,
          rootFolderId
        )

        const uploadResult = await driveService.uploadFile(
          `report_${new Date().toISOString().split('T')[0]}.md`,
          reportContent,
          'text/markdown',
          competitorFolderId
        )

        driveReportId = uploadResult.id
      } catch (driveError) {
        console.error('Failed to save report to Drive:', driveError)
      }
    }
  }

  return {
    analyzed: results.filter((r) => !r.skipped && !r.error).length,
    skipped: results.filter((r) => r.skipped).length,
    failed: results.filter((r) => r.error).length,
    report: reportContent,
    driveReportId,
  }
}
