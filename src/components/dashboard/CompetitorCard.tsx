'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { RefreshCw, Trash2, Eye, Sparkles, ExternalLink } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import type { Competitor } from '@/types'

interface CompetitorCardProps {
  competitor: Competitor & { _count?: { ads: number } }
  onFetchAds: (competitorId: string) => Promise<void>
  onAnalyzeAds: (competitorId: string) => Promise<void>
  onDelete: (competitorId: string) => Promise<void>
  onViewAds: (competitorId: string) => void
}

export function CompetitorCard({
  competitor,
  onFetchAds,
  onAnalyzeAds,
  onDelete,
  onViewAds,
}: CompetitorCardProps) {
  const [fetchingAds, setFetchingAds] = useState(false)
  const [analyzingAds, setAnalyzingAds] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleFetchAds = async () => {
    setFetchingAds(true)
    try {
      await onFetchAds(competitor.id)
    } finally {
      setFetchingAds(false)
    }
  }

  const handleAnalyzeAds = async () => {
    setAnalyzingAds(true)
    try {
      await onAnalyzeAds(competitor.id)
    } finally {
      setAnalyzingAds(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await onDelete(competitor.id)
    } finally {
      setDeleting(false)
    }
  }

  const adCount = competitor._count?.ads || 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{competitor.name}</CardTitle>
            <CardDescription className="mt-1">
              {competitor.lastFetched
                ? `Last fetched ${formatRelativeTime(competitor.lastFetched)}`
                : 'Never fetched'}
            </CardDescription>
          </div>
          <Badge variant={competitor.isActive ? 'success' : 'secondary'}>
            {competitor.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <span>{adCount} ads collected</span>
          <Button variant="link" size="sm" className="px-0" asChild>
            <a
              href={competitor.adLibraryUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              View in Ad Library
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleFetchAds}
            disabled={fetchingAds}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${fetchingAds ? 'animate-spin' : ''}`} />
            {fetchingAds ? 'Fetching...' : 'Fetch Ads'}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleAnalyzeAds}
            disabled={analyzingAds || adCount === 0}
          >
            <Sparkles className={`h-4 w-4 mr-1 ${analyzingAds ? 'animate-pulse' : ''}`} />
            {analyzingAds ? 'Analyzing...' : 'Analyze All'}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onViewAds(competitor.id)}
            disabled={adCount === 0}
          >
            <Eye className="h-4 w-4 mr-1" />
            View Ads
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                disabled={deleting}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete competitor?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove {competitor.name} and all associated ads and analyses.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  )
}
