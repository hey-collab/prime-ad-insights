import { GoogleGenerativeAI } from '@google/generative-ai'

export interface AdAnalysis {
  framework: string
  hooks: string
  concepts: string
  scripts: string
  targetAudience: string
  emotionalTriggers: string
  repurposedIdea: string
  strengthsWeaknesses: string
}

export interface BrandContext {
  name: string
  description?: string
  targetAudience?: string
  toneOfVoice?: string
  productInfo?: string
  industry?: string
}

const ANALYSIS_PROMPT = `You are an expert advertising analyst and copywriter. Analyze the following ad and provide detailed insights.

AD DETAILS:
- Ad Copy: {adCopy}
- Headline: {headline}
- Call to Action: {cta}
- Media Type: {mediaType}

BRAND CONTEXT (for repurposing):
{brandContext}

Provide your analysis in the following JSON format (respond ONLY with valid JSON):
{
  "framework": "Identify the copywriting framework used (e.g., AIDA, PAS, BAB, 4Ps, etc.) and explain how each element is applied",
  "hooks": "Identify the opening hook(s) - what grabs attention in the first 3 seconds or first line. List multiple if present",
  "concepts": "Describe the creative concept/angle being used. What's the big idea? What makes it unique?",
  "scripts": "If this appears to be a video ad, break down the likely script structure. If static, describe the visual storytelling flow",
  "targetAudience": "Who is this ad targeting? Be specific about demographics, psychographics, pain points, and desires",
  "emotionalTriggers": "What emotional triggers are being used? (fear, FOMO, aspiration, belonging, etc.)",
  "repurposedIdea": "Based on the brand context provided, suggest how this ad concept could be repurposed. Include a specific headline, hook, and angle that would work for the brand",
  "strengthsWeaknesses": "List 2-3 strengths and 2-3 potential weaknesses of this ad"
}`

export class GeminiService {
  private genAI: GoogleGenerativeAI
  private model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey)
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  }

  async analyzeAd(
    ad: {
      adCopy?: string
      headline?: string
      cta?: string
      mediaType?: string
      mediaUrl?: string
    },
    brandContext: BrandContext
  ): Promise<AdAnalysis> {
    const brandContextStr = brandContext
      ? `
Brand Name: ${brandContext.name}
Description: ${brandContext.description || 'Not provided'}
Target Audience: ${brandContext.targetAudience || 'Not provided'}
Tone of Voice: ${brandContext.toneOfVoice || 'Not provided'}
Product Info: ${brandContext.productInfo || 'Not provided'}
Industry: ${brandContext.industry || 'Not provided'}`
      : 'No brand context provided - provide general repurposing suggestions'

    const prompt = ANALYSIS_PROMPT
      .replace('{adCopy}', ad.adCopy || 'Not available')
      .replace('{headline}', ad.headline || 'Not available')
      .replace('{cta}', ad.cta || 'Not available')
      .replace('{mediaType}', ad.mediaType || 'Unknown')
      .replace('{brandContext}', brandContextStr)

    try {
      const result = await this.model.generateContent(prompt)
      const response = result.response.text()

      // Extract JSON from response (handle markdown code blocks)
      let jsonStr = response
      const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (jsonMatch) {
        jsonStr = jsonMatch[1]
      }

      const analysis = JSON.parse(jsonStr.trim()) as AdAnalysis
      return analysis
    } catch (error) {
      console.error('Error analyzing ad with Gemini:', error)
      throw new Error('Failed to analyze ad')
    }
  }

  async analyzeWithImage(
    imageUrl: string,
    ad: {
      adCopy?: string
      headline?: string
      cta?: string
      mediaType?: string
    },
    brandContext: BrandContext
  ): Promise<AdAnalysis> {
    // For image analysis, we'd need to fetch the image and include it
    // For now, fall back to text-only analysis
    return this.analyzeAd(ad, brandContext)
  }

  async generateReport(
    competitorName: string,
    ads: Array<{ ad: { adCopy?: string | null; headline?: string | null }; analysis: Partial<AdAnalysis> }>
  ): Promise<string> {
    const prompt = `Create a comprehensive competitor analysis report for ${competitorName} based on these ${ads.length} ads.

ADS AND ANALYSES:
${ads.map((item, i) => `
Ad ${i + 1}:
- Copy: ${item.ad.adCopy || 'N/A'}
- Headline: ${item.ad.headline || 'N/A'}
- Framework: ${item.analysis.framework}
- Hooks: ${item.analysis.hooks}
- Target Audience: ${item.analysis.targetAudience}
`).join('\n')}

Create a markdown report with:
1. Executive Summary
2. Common Patterns & Themes
3. Most Effective Hooks
4. Target Audience Insights
5. Recommended Strategies to Compete
6. Key Takeaways`

    const result = await this.model.generateContent(prompt)
    return result.response.text()
  }
}

export function createGeminiService(): GeminiService {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set')
  }
  return new GeminiService(apiKey)
}
