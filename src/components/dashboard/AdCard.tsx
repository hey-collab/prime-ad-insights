'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, ChevronDown, ChevronUp, Image as ImageIcon, Video } from 'lucide-react'
import { formatDate, truncateText } from '@/lib/utils'
import type { Ad, Analysis } from '@/types'

interface AdCardProps {
  ad: Ad & { analyses?: Analysis[] }
  onAnalyze: (adId: string) => Promise<void>
}

export function AdCard({ ad, onAnalyze }: AdCardProps) {
  const [analyzing, setAnalyzing] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const latestAnalysis = ad.analyses?.[0]

  const handleAnalyze = async () => {
    setAnalyzing(true)
    try {
      await onAnalyze(ad.id)
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {ad.mediaType === 'video' ? (
                <Video className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
              )}
              <CardTitle className="text-base">
                {ad.headline || 'Untitled Ad'}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {ad.impressionRange && (
                <Badge variant="outline" className="text-xs">
                  {ad.impressionRange} impressions
                </Badge>
              )}
              {ad.startDate && (
                <span>Started {formatDate(ad.startDate)}</span>
              )}
            </div>
          </div>
          {ad.thumbnailUrl && (
            <img
              src={ad.thumbnailUrl}
              alt="Ad thumbnail"
              className="w-16 h-16 object-cover rounded-md"
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        {ad.adCopy && (
          <p className="text-sm text-muted-foreground mb-3">
            {truncateText(ad.adCopy, 200)}
          </p>
        )}

        {ad.cta && (
          <Badge variant="secondary" className="mb-3">
            CTA: {ad.cta}
          </Badge>
        )}

        <div className="flex items-center gap-2 mb-3">
          <Button
            size="sm"
            onClick={handleAnalyze}
            disabled={analyzing}
          >
            <Sparkles className={`h-4 w-4 mr-1 ${analyzing ? 'animate-pulse' : ''}`} />
            {analyzing ? 'Analyzing...' : latestAnalysis ? 'Re-analyze' : 'Analyze'}
          </Button>
        </div>

        {latestAnalysis && (
          <div className="border-t pt-3">
            <Button
              variant="link"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="px-0"
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Hide Analysis
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  View Analysis
                </>
              )}
            </Button>

            {expanded && (
              <div className="mt-3 space-y-3 text-sm">
                {latestAnalysis.framework && (
                  <div>
                    <h4 className="font-medium">Framework</h4>
                    <p className="text-muted-foreground">{latestAnalysis.framework}</p>
                  </div>
                )}

                {latestAnalysis.hooks && (
                  <div>
                    <h4 className="font-medium">Hooks</h4>
                    <p className="text-muted-foreground">{latestAnalysis.hooks}</p>
                  </div>
                )}

                {latestAnalysis.concepts && (
                  <div>
                    <h4 className="font-medium">Creative Concepts</h4>
                    <p className="text-muted-foreground">{latestAnalysis.concepts}</p>
                  </div>
                )}

                {latestAnalysis.targetAudience && (
                  <div>
                    <h4 className="font-medium">Target Audience</h4>
                    <p className="text-muted-foreground">{latestAnalysis.targetAudience}</p>
                  </div>
                )}

                {latestAnalysis.emotionalTriggers && (
                  <div>
                    <h4 className="font-medium">Emotional Triggers</h4>
                    <p className="text-muted-foreground">{latestAnalysis.emotionalTriggers}</p>
                  </div>
                )}

                {latestAnalysis.repurposedIdea && (
                  <div className="bg-blue-50 p-3 rounded-md">
                    <h4 className="font-medium text-blue-900">Repurposed Idea for Your Brand</h4>
                    <p className="text-blue-800">{latestAnalysis.repurposedIdea}</p>
                  </div>
                )}

                {latestAnalysis.strengthsWeaknesses && (
                  <div>
                    <h4 className="font-medium">Strengths & Weaknesses</h4>
                    <p className="text-muted-foreground">{latestAnalysis.strengthsWeaknesses}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
