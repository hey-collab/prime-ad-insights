'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, AlertCircle } from 'lucide-react'

interface CompetitorFormProps {
  brandId: string
  onSubmit: (competitor: CompetitorFormData) => Promise<void>
  trigger?: React.ReactNode
}

export interface CompetitorFormData {
  name: string
  adLibraryUrl: string
}

export function CompetitorForm({ brandId, onSubmit, trigger }: CompetitorFormProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<CompetitorFormData>({
    name: '',
    adLibraryUrl: '',
  })

  const validateUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname.includes('facebook.com') && urlObj.pathname.includes('/ads/library')
    } catch {
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validateUrl(formData.adLibraryUrl)) {
      setError('Please enter a valid Facebook Ad Library URL')
      return
    }

    setLoading(true)
    try {
      await onSubmit(formData)
      setOpen(false)
      setFormData({ name: '', adLibraryUrl: '' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add competitor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Competitor
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Competitor</DialogTitle>
          <DialogDescription>
            Enter the competitor&apos;s name and their Facebook Ad Library URL.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Could not add competitor</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-2">
              <Label htmlFor="competitor-name">Competitor Name *</Label>
              <Input
                id="competitor-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Nike, Adidas, Competitor Inc."
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ad-library-url">Facebook Ad Library URL *</Label>
              <Input
                id="ad-library-url"
                value={formData.adLibraryUrl}
                onChange={(e) => setFormData({ ...formData, adLibraryUrl: e.target.value })}
                placeholder="https://www.facebook.com/ads/library/?view_all_page_id=..."
                required
              />
              <p className="text-xs text-muted-foreground">
                Go to facebook.com/ads/library, search for the competitor, and copy the URL from your browser.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.name || !formData.adLibraryUrl}>
              {loading ? 'Adding...' : 'Add Competitor'}
            </Button>
          </DialogFooter>
        </form>
        <input type="hidden" value={brandId} />
      </DialogContent>
    </Dialog>
  )
}
