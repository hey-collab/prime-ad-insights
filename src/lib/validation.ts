import { z } from 'zod'

export const brandCreateSchema = z.object({
  name: z.string().trim().min(1, 'Brand name is required'),
  description: z.string().trim().optional().nullable(),
  targetAudience: z.string().trim().optional().nullable(),
  toneOfVoice: z.string().trim().optional().nullable(),
  productInfo: z.string().trim().optional().nullable(),
  industry: z.string().trim().optional().nullable(),
})

export const brandUpdateSchema = brandCreateSchema.partial().extend({
  name: z.string().trim().min(1, 'Brand name is required').optional(),
})

export const competitorCreateSchema = z.object({
  brandId: z.string().uuid(),
  name: z.string().trim().min(1, 'Competitor name is required'),
  adLibraryUrl: z.string().url(),
})

export const competitorUpdateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  adLibraryUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
})

export const fetchAdsSchema = z.object({
  limit: z.number().int().min(1).max(50).optional(),
  async: z.boolean().optional(),
})

export const analyzeBatchSchema = z.object({
  competitorId: z.string().uuid().optional(),
  adIds: z.array(z.string().uuid()).optional(),
  async: z.boolean().optional(),
}).refine((data) => data.competitorId || data.adIds, {
  message: 'competitorId or adIds required',
})

export const analyzeAdSchema = z.object({
  async: z.boolean().optional(),
})

export function parseJson<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    const error = new Error(result.error.issues.map((issue) => issue.message).join(', '))
    error.name = 'ValidationError'
    throw error
  }
  return result.data
}
