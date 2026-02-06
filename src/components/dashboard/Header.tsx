'use client'

import { Button } from '@/components/ui/button'
import { HardDrive, Settings } from 'lucide-react'

interface HeaderProps {
  driveConnected: boolean
  onConnectDrive: () => void
}

export function Header({ driveConnected, onConnectDrive }: HeaderProps) {
  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Competitor Ad Analyzer
            </h1>
            <p className="text-sm text-muted-foreground">
              Track competitor ads, analyze with AI, save to Google Drive
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant={driveConnected ? 'outline' : 'default'}
              size="sm"
              onClick={onConnectDrive}
            >
              <HardDrive className="h-4 w-4 mr-2" />
              {driveConnected ? 'Drive Connected' : 'Connect Google Drive'}
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
