# Competitor Ad Analyzer

A full-stack web application for tracking and analyzing competitor ads from Meta's Ad Library. Built for marketing teams to monitor competitor advertising, analyze ad copy and creatives with AI, and save insights to Google Drive.

## Features

- **Brand Management**: Set up your brand context (target audience, tone, product info) for better AI repurposing
- **Competitor Tracking**: Add competitors via their Facebook Ad Library URLs
- **Ad Fetching**: Pull top ads from competitors (sorted by impressions)
- **AI Analysis (Gemini)**: Analyze ads for:
  - Copywriting frameworks (AIDA, PAS, etc.)
  - Opening hooks
  - Creative concepts
  - Target audience insights
  - Emotional triggers
  - Repurposed ideas for YOUR brand
- **Google Drive Integration**: Automatically save analyses and reports to organized folders
- **Batch Analysis**: Analyze all competitor ads at once and generate summary reports

## Tech Stack

- **Frontend**: Next.js 16 + React 19 + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **AI**: Google Gemini API
- **Storage**: Google Drive API
- **UI Components**: Radix UI + shadcn/ui

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Google Cloud Project (for Gemini API and Drive)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your credentials
```

3. Generate Prisma client:
```bash
npm run db:generate
```

4. Push database schema:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/competitor_ads"

# App API Key (optional - protects API routes)
APP_API_KEY=""
NEXT_PUBLIC_APP_API_KEY=""

# Google OAuth (for Drive integration)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GOOGLE_REDIRECT_URI="http://localhost:3000/api/drive/callback"
GOOGLE_REFRESH_TOKEN=""

# Gemini AI
GEMINI_API_KEY=""

# Meta Ad Library API (optional - uses demo data if not set)
META_ACCESS_TOKEN=""
```

## Setting Up APIs

### Google Gemini API
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create an API key
3. Add to `.env` as `GEMINI_API_KEY`

### Google Drive API
1. Create a project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Google Drive API
3. Create OAuth 2.0 credentials
4. Add authorized redirect URI: `http://localhost:3000/api/drive/callback`
5. Add client ID and secret to `.env`

### Meta Ad Library API (Optional)
1. Create a Meta Developer account
2. Create an app and get an access token
3. Add to `.env` as `META_ACCESS_TOKEN`

Note: The app includes mock data for development without Meta API access.

## Project Structure

```
/src
  /app
    /api
      /brands         # Brand CRUD
      /competitors    # Competitor CRUD + fetch ads
      /ads            # Ad management + analysis
      /analyze        # Batch analysis endpoints
      /drive          # Google Drive OAuth
    page.tsx          # Main dashboard
  /components
    /dashboard        # Dashboard components
    /forms            # Form components
    /ui               # shadcn/ui components
  /lib
    db.ts             # Prisma client
    gemini.ts         # Gemini AI integration
    google-drive.ts   # Google Drive integration
    ad-library-scraper.ts  # Meta Ad Library scraper
  /types              # TypeScript types
/prisma
  schema.prisma       # Database schema
```

## Usage

1. **Add Your Brand**: Enter your brand details including target audience, tone of voice, and product info
2. **Add Competitors**: Paste their Facebook Ad Library URLs
3. **Fetch Ads**: Pull their latest top-performing ads
4. **Analyze**: Use Gemini AI to analyze ad frameworks, hooks, and get repurposed ideas
5. **Save to Drive**: Analyses are automatically saved to Google Drive in organized folders

## Google Drive Folder Structure

When connected, files are organized as:
```
/Competitor Ads
  /[Competitor Name]
    /[Date]
      - analysis_[ad_id].md
      - report_[date].md
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/brands` | GET, POST | List/create brands |
| `/api/brands/[id]` | GET, PUT, DELETE | Brand CRUD |
| `/api/competitors` | GET, POST | List/create competitors |
| `/api/competitors/[id]` | GET, PUT, DELETE | Competitor CRUD |
| `/api/competitors/[id]/fetch` | POST | Fetch ads from Ad Library |
| `/api/ads` | GET | List ads |
| `/api/ads/[id]` | GET, DELETE | Ad management |
| `/api/ads/[id]/analyze` | POST | Analyze single ad |
| `/api/analyze/batch` | POST | Batch analyze competitor ads |
| `/api/drive/auth` | GET | Get Drive OAuth URL |
| `/api/drive/callback` | GET | OAuth callback |
| `/api/drive/status` | GET | Drive connection status |
| `/api/jobs/run` | POST | Process queued jobs |

## Deployment

Deploy to Vercel or Railway:

```bash
npm run build
```

Make sure to:
1. Set all environment variables
2. Update `GOOGLE_REDIRECT_URI` to your production URL
3. Add production URL to Google OAuth authorized redirects

## License

MIT
