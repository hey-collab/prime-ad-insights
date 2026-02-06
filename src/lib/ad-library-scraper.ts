export interface ScrapedAd {
  adLibraryId: string
  adCopy?: string
  headline?: string
  cta?: string
  mediaUrl?: string
  mediaType?: string
  thumbnailUrl?: string
  landingPage?: string
  impressionRange?: string
  startDate?: string
  status: string
}

export interface ScrapeResult {
  success: boolean
  ads: ScrapedAd[]
  error?: string
  pageId?: string
}

// Parse the Ad Library URL to extract page ID
export function parseAdLibraryUrl(url: string): { pageId?: string; valid: boolean } {
  try {
    const urlObj = new URL(url)
    const host = urlObj.hostname.toLowerCase()
    const isFacebookHost = host === 'facebook.com' || host.endsWith('.facebook.com')
    const isAdsPath = urlObj.pathname.includes('/ads/library')

    // Handle different URL formats
    // Format 1: https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&view_all_page_id=123456789
    // Format 2: https://www.facebook.com/ads/library/?id=123456789
    // Format 3: https://facebook.com/ads/library?view_all_page_id=123456789

    const viewAllPageId = urlObj.searchParams.get('view_all_page_id')
    const id = urlObj.searchParams.get('id')

    const pageId = viewAllPageId || id

    return {
      pageId: pageId || undefined,
      valid: isFacebookHost && isAdsPath,
    }
  } catch {
    return { valid: false }
  }
}

// Build the Ad Library URL for API access
export function buildAdLibraryApiUrl(pageId: string, accessToken: string, limit = 10): string {
  const baseUrl = 'https://graph.facebook.com/v18.0/ads_archive'
  const params = new URLSearchParams({
    access_token: accessToken,
    ad_reached_countries: "['US']",
    ad_active_status: 'ALL',
    search_page_ids: pageId,
    ad_type: 'ALL',
    fields: 'id,ad_creative_bodies,ad_creative_link_captions,ad_creative_link_titles,ad_snapshot_url,page_name,publisher_platforms,estimated_audience_size,impressions,spend,currency,ad_delivery_start_time,ad_delivery_stop_time',
    limit: limit.toString(),
  })

  return `${baseUrl}?${params.toString()}`
}

// Scrape ads using the Meta Ad Library API (requires access token)
export async function scrapeAdsWithApi(
  pageId: string,
  accessToken: string,
  limit = 10
): Promise<ScrapeResult> {
  try {
    const url = buildAdLibraryApiUrl(pageId, accessToken, limit)
    const response = await fetch(url)

    if (!response.ok) {
      let errorBody: any = null
      try {
        errorBody = await response.json()
      } catch {
        try {
          errorBody = await response.text()
        } catch {
          errorBody = null
        }
      }
      let detailedMessage = `API request failed (status ${response.status})`
      if (typeof errorBody === 'object' && errorBody?.error) {
        const { message, type, code, error_subcode } = errorBody.error
        const extras = [
          message ? String(message) : null,
          type ? `type=${type}` : null,
          code ? `code=${code}` : null,
          error_subcode ? `subcode=${error_subcode}` : null,
        ].filter(Boolean)
        if (extras.length > 0) {
          detailedMessage = extras.join(' | ')
        }
      } else if (errorBody) {
        detailedMessage = `${detailedMessage}: ${JSON.stringify(errorBody)}`
      }

      return {
        success: false,
        ads: [],
        error: detailedMessage,
        pageId,
      }
    }

    const data = await response.json()

    const ads: ScrapedAd[] = (data.data || []).map((ad: Record<string, unknown>) => ({
      adLibraryId: ad.id as string,
      adCopy: Array.isArray(ad.ad_creative_bodies) ? ad.ad_creative_bodies[0] : undefined,
      headline: Array.isArray(ad.ad_creative_link_titles) ? ad.ad_creative_link_titles[0] : undefined,
      cta: Array.isArray(ad.ad_creative_link_captions) ? ad.ad_creative_link_captions[0] : undefined,
      thumbnailUrl: ad.ad_snapshot_url as string | undefined,
      impressionRange: ad.impressions ? JSON.stringify(ad.impressions) : undefined,
      startDate: ad.ad_delivery_start_time as string | undefined,
      status: ad.ad_delivery_stop_time ? 'inactive' : 'active',
      mediaType: 'unknown',
    }))

    return {
      success: true,
      ads,
      pageId,
    }
  } catch (error) {
    return {
      success: false,
      ads: [],
      error: error instanceof Error ? error.message : 'Unknown error',
      pageId,
    }
  }
}

// Mock scraper for demo/development (when no API access)
export async function scrapeAdsMock(url: string, limit = 10): Promise<ScrapeResult> {
  const { pageId, valid } = parseAdLibraryUrl(url)

  if (!valid) {
    return {
      success: false,
      ads: [],
      error: 'Invalid Ad Library URL. Please provide a valid Facebook Ad Library URL.',
    }
  }

  // Generate mock ads for demo purposes
  const mockAds: ScrapedAd[] = Array.from({ length: Math.min(limit, 10) }, (_, i) => ({
    adLibraryId: `mock_${pageId}_${i + 1}_${Date.now()}`,
    adCopy: [
      "Transform your mornings with our revolutionary coffee blend. Wake up to the rich, smooth taste that 50,000+ customers can't stop talking about.",
      "Tired of feeling tired? Our all-natural energy supplement gives you 8 hours of clean energy without the crash. Try it risk-free today!",
      "The secret to glowing skin isn't expensive treatments—it's our 3-step routine. Join 100,000 women who've transformed their skin in just 2 weeks.",
      "Stop wasting money on gym memberships you don't use. Get fit at home with our 15-minute workout program. Results guaranteed or your money back!",
      "Your dog deserves the best. Our premium, vet-approved food is made with real ingredients your furry friend will love.",
    ][i % 5],
    headline: [
      "Wake Up Better",
      "Natural Energy, All Day",
      "Your Best Skin Ever",
      "Fit in 15 Minutes",
      "Happy Dogs, Happy Life",
    ][i % 5],
    cta: ["Shop Now", "Learn More", "Get Started", "Try Free", "Order Now"][i % 5],
    mediaType: i % 3 === 0 ? 'video' : 'image',
    thumbnailUrl: `https://placehold.co/400x400/png?text=Ad+${i + 1}`,
    impressionRange: ["1M-5M", "500K-1M", "100K-500K", "50K-100K", "10K-50K"][i % 5],
    startDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    landingPage: 'https://example.com/landing',
  }))

  return {
    success: true,
    ads: mockAds,
    pageId,
  }
}

// Main scrape function - uses API if token available, otherwise mock
export async function scrapeAds(
  url: string,
  options: {
    accessToken?: string
    limit?: number
    useMock?: boolean
  } = {}
): Promise<ScrapeResult> {
  const { accessToken, limit = 10, useMock = false } = options
  const { pageId, valid } = parseAdLibraryUrl(url)

  if (!valid) {
    return {
      success: false,
      ads: [],
      error: 'Invalid Ad Library URL',
    }
  }

  // Use mock data if no API token or explicitly requested
  if (useMock || !accessToken) {
    console.log('Using mock ad data (no API token provided)')
    return scrapeAdsMock(url, limit)
  }

  if (!pageId) {
    return {
      success: false,
      ads: [],
      error: 'Could not extract page ID from URL',
    }
  }

  return scrapeAdsWithApi(pageId, accessToken, limit)
}
