import { prisma } from '@/lib/db'
import { analyzeAdById, analyzeBatchAds, fetchAdsForCompetitor } from '@/lib/tasks'

export type JobType = 'FETCH_COMPETITOR_ADS' | 'ANALYZE_COMPETITOR_ADS' | 'ANALYZE_AD'

export interface JobPayloads {
  FETCH_COMPETITOR_ADS: { competitorId: string; limit?: number }
  ANALYZE_COMPETITOR_ADS: { competitorId?: string; adIds?: string[] }
  ANALYZE_AD: { adId: string }
}

export async function enqueueJob<T extends JobType>(
  type: T,
  payload: JobPayloads[T],
  runAt: Date = new Date()
) {
  return prisma.job.create({
    data: {
      type,
      payload: payload as object,
      runAt,
    },
  })
}

export async function processJobs(limit = 5) {
  const now = new Date()
  const jobs = await prisma.job.findMany({
    where: {
      status: 'pending',
      runAt: { lte: now },
    },
    orderBy: { createdAt: 'asc' },
    take: limit,
  })

  const results = []
  for (const job of jobs) {
    const updated = await prisma.job.updateMany({
      where: { id: job.id, status: 'pending' },
      data: { status: 'running', attempts: { increment: 1 } },
    })

    if (updated.count === 0) {
      continue
    }

    try {
      switch (job.type as JobType) {
        case 'FETCH_COMPETITOR_ADS': {
          const payload = job.payload as JobPayloads['FETCH_COMPETITOR_ADS']
          await fetchAdsForCompetitor(payload.competitorId, payload.limit || 10)
          break
        }
        case 'ANALYZE_COMPETITOR_ADS': {
          const payload = job.payload as JobPayloads['ANALYZE_COMPETITOR_ADS']
          await analyzeBatchAds(payload)
          break
        }
        case 'ANALYZE_AD': {
          const payload = job.payload as JobPayloads['ANALYZE_AD']
          await analyzeAdById(payload.adId)
          break
        }
        default:
          throw new Error(`Unknown job type: ${job.type}`)
      }

      await prisma.job.update({
        where: { id: job.id },
        data: { status: 'completed', completedAt: new Date(), lastError: null },
      })
      results.push({ id: job.id, status: 'completed' })
    } catch (error) {
      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: 'failed',
          lastError: error instanceof Error ? error.message : 'Unknown error',
        },
      })
      results.push({ id: job.id, status: 'failed' })
    }
  }

  return results
}
