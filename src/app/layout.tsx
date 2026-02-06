import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

export const metadata: Metadata = {
  title: 'Competitor Ad Analyzer',
  description: 'Track competitor ads, analyze with AI, save to Google Drive',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-gray-50 min-h-screen">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
