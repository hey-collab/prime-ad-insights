'use client'

import { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/dashboard/Header'
import { BrandForm, type BrandFormData } from '@/components/forms/BrandForm'
import { CompetitorForm, type CompetitorFormData } from '@/components/forms/CompetitorForm'
import { CompetitorCard } from '@/components/dashboard/CompetitorCard'
import { AdCard } from '@/components/dashboard/AdCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Building2, Users, BarChart3, Loader2 } from 'lucide-react'
import type { Brand, Competitor, Ad, Analysis } from '@/types'
import { apiFetch } from '@/lib/api-client'
import { useToast } from '@/components/ui/use-toast'

type CompetitorWithCount = Competitor & { _count?: { ads: number } }
type AdWithAnalyses = Ad & { analyses?: Analysis[] }

export default function Dashboard() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)
  const [competitors, setCompetitors] = useState<CompetitorWithCount[]>([])
  const [selectedCompetitor, setSelectedCompetitor] = useState<Competitor | null>(null)
  const [ads, setAds] = useState<AdWithAnalyses[]>([])
  const [loading, setLoading] = useState(true)
  const [driveConnected, setDriveConnected] = useState(false)
  const [view, setView] = useState<'brands' | 'competitors' | 'ads'>('brands')
  const { toast } = useToast()

  // Fetch brands on load
  useEffect(() => {
    fetchBrands()
    checkDriveConnection()
    const params = new URLSearchParams(window.location.search)
    const error = params.get('error')
    const success = params.get('success')
    if (error) {
      toast({
        title: 'Drive connection error',
        description: error,
        variant: 'destructive',
      })
    } else if (success) {
      toast({
        title: 'Drive connected',
        description: 'Google Drive is now connected.',
      })
    }
  }, [])

  const fetchBrands = async () => {
    try {
      const res = await apiFetch('/api/brands')
      const data = await res.json()
      if (data.success) {
        setBrands(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch brands:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCompetitors = useCallback(async (brandId: string) => {
    try {
      const res = await apiFetch(`/api/competitors?brandId=${brandId}`)
      const data = await res.json()
      if (data.success) {
        setCompetitors(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch competitors:', error)
    }
  }, [])

  const fetchAds = useCallback(async (competitorId: string) => {
    try {
      const res = await apiFetch(`/api/ads?competitorId=${competitorId}`)
      const data = await res.json()
      if (data.success) {
        setAds(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch ads:', error)
    }
  }, [])

  const checkDriveConnection = async () => {
    try {
      const res = await apiFetch('/api/drive/status')
      const data = await res.json()
      if (data.success) {
        setDriveConnected(!!data.data.connected)
      }
    } catch (error) {
      console.error('Failed to check Drive status:', error)
    }
  }

  const handleConnectDrive = async () => {
    try {
      const res = await apiFetch('/api/drive/auth')
      const data = await res.json()
      if (data.success && data.data.authUrl) {
        window.location.href = data.data.authUrl
      }
    } catch (error) {
      console.error('Failed to get auth URL:', error)
    }
  }

  const handleCreateBrand = async (brandData: BrandFormData) => {
    const res = await apiFetch('/api/brands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(brandData),
    })
    const data = await res.json()
    if (data.success) {
      setBrands([data.data, ...brands])
    }
  }

  const handleSelectBrand = (brand: Brand) => {
    setSelectedBrand(brand)
    setView('competitors')
    fetchCompetitors(brand.id)
  }

  const handleCreateCompetitor = async (competitorData: CompetitorFormData) => {
    if (!selectedBrand) return
    const res = await apiFetch('/api/competitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...competitorData, brandId: selectedBrand.id }),
    })
    const data = await res.json()
    if (data.success) {
      setCompetitors([data.data, ...competitors])
    } else {
      throw new Error(data.error)
    }
  }

  const handleFetchAds = async (competitorId: string) => {
    const res = await apiFetch(`/api/competitors/${competitorId}/fetch`, {
      method: 'POST',
    })
    const data = await res.json()
    if (data.success) {
      // Refresh competitor list to update ad count
      if (selectedBrand) {
        fetchCompetitors(selectedBrand.id)
      }
      toast({
        title: 'Ads fetched',
        description: `Fetched ${data.data.adsSaved} ads.`,
      })
    } else {
      toast({
        title: 'Fetch failed',
        description: data.error,
        variant: 'destructive',
      })
    }
  }

  const handleAnalyzeAds = async (competitorId: string) => {
    const res = await apiFetch('/api/analyze/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ competitorId }),
    })
    const data = await res.json()
    if (data.success) {
      toast({
        title: 'Analysis complete',
        description: `Analyzed ${data.data.analyzed} ads. ${data.data.skipped} already had analyses.`,
      })
    } else {
      toast({
        title: 'Analysis failed',
        description: data.error,
        variant: 'destructive',
      })
    }
  }

  const handleDeleteCompetitor = async (competitorId: string) => {
    const res = await apiFetch(`/api/competitors/${competitorId}`, {
      method: 'DELETE',
    })
    const data = await res.json()
    if (data.success) {
      setCompetitors(competitors.filter((c) => c.id !== competitorId))
    }
  }

  const handleViewAds = (competitorId: string) => {
    const competitor = competitors.find((c) => c.id === competitorId)
    if (competitor) {
      setSelectedCompetitor(competitor)
      setView('ads')
      fetchAds(competitorId)
    }
  }

  const handleAnalyzeAd = async (adId: string) => {
    const res = await apiFetch(`/api/ads/${adId}/analyze`, {
      method: 'POST',
    })
    const data = await res.json()
    if (data.success) {
      // Refresh ads to show new analysis
      if (selectedCompetitor) {
        fetchAds(selectedCompetitor.id)
      }
    } else {
      toast({
        title: 'Analysis failed',
        description: data.error,
        variant: 'destructive',
      })
    }
  }

  const handleBack = () => {
    if (view === 'ads') {
      setView('competitors')
      setSelectedCompetitor(null)
      setAds([])
    } else if (view === 'competitors') {
      setView('brands')
      setSelectedBrand(null)
      setCompetitors([])
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header driveConnected={driveConnected} onConnectDrive={handleConnectDrive} />

      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb / Back Button */}
        {view !== 'brands' && (
          <Button
            variant="ghost"
            className="mb-4"
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {view === 'ads' ? 'Competitors' : 'Brands'}
          </Button>
        )}

        {/* Brands View */}
        {view === 'brands' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">Your Brands</h2>
                <p className="text-muted-foreground">
                  Add your brand to start tracking competitor ads
                </p>
              </div>
              <BrandForm onSubmit={handleCreateBrand} />
            </div>

            {brands.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No brands yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Add your brand to get started with competitor tracking
                  </p>
                  <BrandForm onSubmit={handleCreateBrand} />
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {brands.map((brand) => (
                  <Card
                    key={brand.id}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => handleSelectBrand(brand)}
                  >
                    <CardHeader>
                      <CardTitle>{brand.name}</CardTitle>
                      <CardDescription>
                        {brand.industry || 'No industry specified'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {brand.competitors?.length || 0} competitors
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Competitors View */}
        {view === 'competitors' && selectedBrand && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl font-bold">{selectedBrand.name}</h2>
                  <Badge variant="outline">{selectedBrand.industry}</Badge>
                </div>
                <p className="text-muted-foreground">
                  Track and analyze competitor ads
                </p>
              </div>
              <CompetitorForm
                brandId={selectedBrand.id}
                onSubmit={handleCreateCompetitor}
              />
            </div>

            <Tabs defaultValue="competitors" className="space-y-4">
              <TabsList>
                <TabsTrigger value="competitors">
                  <Users className="h-4 w-4 mr-2" />
                  Competitors ({competitors.length})
                </TabsTrigger>
                <TabsTrigger value="insights">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Brand Context
                </TabsTrigger>
              </TabsList>

              <TabsContent value="competitors">
                {competitors.length === 0 ? (
                  <Card className="text-center py-12">
                    <CardContent>
                      <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No competitors yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Add a competitor to start tracking their ads
                      </p>
                      <CompetitorForm
                        brandId={selectedBrand.id}
                        onSubmit={handleCreateCompetitor}
                      />
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {competitors.map((competitor) => (
                      <CompetitorCard
                        key={competitor.id}
                        competitor={competitor}
                        onFetchAds={handleFetchAds}
                        onAnalyzeAds={handleAnalyzeAds}
                        onDelete={handleDeleteCompetitor}
                        onViewAds={handleViewAds}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="insights">
                <Card>
                  <CardHeader>
                    <CardTitle>Brand Context</CardTitle>
                    <CardDescription>
                      This information helps AI generate better repurposed ad ideas
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedBrand.description && (
                      <div>
                        <h4 className="font-medium mb-1">Description</h4>
                        <p className="text-muted-foreground">{selectedBrand.description}</p>
                      </div>
                    )}
                    {selectedBrand.targetAudience && (
                      <div>
                        <h4 className="font-medium mb-1">Target Audience</h4>
                        <p className="text-muted-foreground">{selectedBrand.targetAudience}</p>
                      </div>
                    )}
                    {selectedBrand.toneOfVoice && (
                      <div>
                        <h4 className="font-medium mb-1">Tone of Voice</h4>
                        <p className="text-muted-foreground">{selectedBrand.toneOfVoice}</p>
                      </div>
                    )}
                    {selectedBrand.productInfo && (
                      <div>
                        <h4 className="font-medium mb-1">Product Info</h4>
                        <p className="text-muted-foreground">{selectedBrand.productInfo}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Ads View */}
        {view === 'ads' && selectedCompetitor && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold">{selectedCompetitor.name} Ads</h2>
              <p className="text-muted-foreground">
                {ads.length} ads collected
              </p>
            </div>

            {ads.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No ads yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Fetch ads from the Ad Library first
                  </p>
                  <Button onClick={() => handleFetchAds(selectedCompetitor.id)}>
                    Fetch Ads
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {ads.map((ad) => (
                  <AdCard
                    key={ad.id}
                    ad={ad}
                    onAnalyze={handleAnalyzeAd}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
