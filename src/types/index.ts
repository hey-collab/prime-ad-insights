export interface Brand {
  id: string
  name: string
  description?: string | null
  targetAudience?: string | null
  toneOfVoice?: string | null
  productInfo?: string | null
  industry?: string | null
  createdAt: Date
  updatedAt: Date
  competitors?: Competitor[]
}

export interface Competitor {
  id: string
  brandId: string
  name: string
  adLibraryUrl: string
  pageId?: string | null
  isActive: boolean
  lastFetched?: Date | null
  createdAt: Date
  updatedAt: Date
  brand?: Brand
  ads?: Ad[]
}

export interface Ad {
  id: string
  competitorId: string
  adLibraryId: string
  impressionRange?: string | null
  startDate?: Date | null
  mediaUrl?: string | null
  mediaType?: string | null
  thumbnailUrl?: string | null
  adCopy?: string | null
  headline?: string | null
  cta?: string | null
  landingPage?: string | null
  status: string
  driveFileId?: string | null
  driveFolderId?: string | null
  createdAt: Date
  updatedAt: Date
  competitor?: Competitor
  analyses?: Analysis[]
}

export interface Analysis {
  id: string
  adId: string
  framework?: string | null
  hooks?: string | null
  concepts?: string | null
  scripts?: string | null
  targetAudience?: string | null
  emotionalTriggers?: string | null
  repurposedIdea?: string | null
  strengthsWeaknesses?: string | null
  rawResponse?: Record<string, unknown> | null
  driveFileId?: string | null
  createdAt: Date
  ad?: Ad
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface FetchAdsRequest {
  competitorId: string
  limit?: number
}

export interface AnalyzeAdRequest {
  adId: string
  brandId: string
}

export interface CreateCompetitorRequest {
  brandId: string
  name: string
  adLibraryUrl: string
}

export interface CreateBrandRequest {
  name: string
  description?: string
  targetAudience?: string
  toneOfVoice?: string
  productInfo?: string
  industry?: string
}
