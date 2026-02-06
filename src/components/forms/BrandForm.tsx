'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus } from 'lucide-react'

interface BrandFormProps {
  onSubmit: (brand: BrandFormData) => Promise<void>
  initialData?: BrandFormData
  trigger?: React.ReactNode
}

export interface BrandFormData {
  name: string
  description?: string
  targetAudience?: string
  toneOfVoice?: string
  productInfo?: string
  industry?: string
}

export function BrandForm({ onSubmit, initialData, trigger }: BrandFormProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<BrandFormData>(
    initialData || {
      name: '',
      description: '',
      targetAudience: '',
      toneOfVoice: '',
      productInfo: '',
      industry: '',
    }
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit(formData)
      setOpen(false)
      if (!initialData) {
        setFormData({
          name: '',
          description: '',
          targetAudience: '',
          toneOfVoice: '',
          productInfo: '',
          industry: '',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Brand
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Brand' : 'Add Your Brand'}</DialogTitle>
          <DialogDescription>
            Enter your brand details. This context helps AI generate better repurposed ad ideas.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Brand Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Your Company Name"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                value={formData.industry || ''}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                placeholder="e.g., E-commerce, SaaS, Health & Fitness"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Brand Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What does your brand do? What problem do you solve?"
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="targetAudience">Target Audience</Label>
              <Textarea
                id="targetAudience"
                value={formData.targetAudience || ''}
                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                placeholder="Who are your ideal customers? Demographics, interests, pain points..."
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="toneOfVoice">Tone of Voice</Label>
              <Input
                id="toneOfVoice"
                value={formData.toneOfVoice || ''}
                onChange={(e) => setFormData({ ...formData, toneOfVoice: e.target.value })}
                placeholder="e.g., Professional, Friendly, Bold, Playful"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="productInfo">Product/Service Info</Label>
              <Textarea
                id="productInfo"
                value={formData.productInfo || ''}
                onChange={(e) => setFormData({ ...formData, productInfo: e.target.value })}
                placeholder="Key features, benefits, pricing, unique selling points..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.name}>
              {loading ? 'Saving...' : initialData ? 'Update Brand' : 'Create Brand'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
