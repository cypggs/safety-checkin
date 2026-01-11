# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**平安签到 (Safety Check-in)** - A minimalist web application for solo-living individuals to check in daily and alert emergency contacts if inactive for 2+ days. Inspired by the viral Chinese iOS app "死了么".

## Commands

```bash
# Development
npm run dev          # Start development server on http://localhost:3000
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database setup (run in Supabase SQL Editor)
# See database.sql for schema
```

## Architecture

### Tech Stack
- **Next.js 16** with App Router and Turbopack
- **TypeScript** throughout
- **Tailwind CSS** for styling
- **Supabase** PostgreSQL for persistence
- **next-intl** for bilingual support (zh/en)
- **Resend** for email notifications
- **FingerprintJS** for device fingerprinting
- **crypto-js** for client-side encryption

### Project Structure
```
app/
├── [locale]/           # Internationalized routes (zh, en)
│   ├── page.tsx        # Main check-in page
│   ├── setup/page.tsx  # Initial user setup
│   └── settings/page.tsx # User settings
├── api/                # Serverless API routes
│   ├── setup/route.ts  # User registration
│   ├── user/route.ts   # User CRUD operations
│   ├── checkin/route.ts # Check-in recording
│   └── cron/check-inactive/route.ts # Daily alert check
lib/
├── supabase.ts         # Database client and TypeScript interfaces
└── utils.ts            # Device fingerprinting, encryption helpers
messages/
├── zh.json             # Chinese translations
└── en.json             # English translations
```

### Database Schema
Three tables prefixed with `safety_` to avoid conflicts with Supabase template tables:
- `safety_users` - User profiles with encrypted name/email
- `safety_checkins` - Check-in history records
- `safety_alerts` - Sent alert logs

### Internationalization
- Routes use `[locale]` dynamic segment
- Middleware handles locale detection and routing
- Messages loaded from `messages/{locale}.json`
- Locale prefix is always used (`/zh`, `/en`)

### Environment Variables
Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - For cron job operations
- `NEXT_PUBLIC_ENCRYPTION_KEY` - Client-side encryption key
- `RESEND_API_KEY` - Email sending (optional, for production)
- `CRON_SECRET` - Secret for cron endpoint authentication

### Cron Job
Configured in `vercel.json` to run daily at 9:00 AM UTC. Endpoint: `/api/cron/check-inactive`

## Key Design Decisions

1. **No-Login Auth**: Uses FingerprintJS for device fingerprinting instead of traditional authentication
2. **Client-Side Encryption**: Sensitive data (name, email) is encrypted in the browser before transmission
3. **No Location Tracking**: Privacy-first approach with minimal data collection
4. **Prefix Table Names**: Uses `safety_` prefix to avoid Supabase template conflicts
