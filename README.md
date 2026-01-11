# 平安签到 (Safety Check-in)

A minimalist web application for solo-living individuals to check in daily and alert emergency contacts if inactive for 2+ days. Inspired by the viral Chinese iOS app "死了么".

## Features

- **Daily Check-in System**: Simple one-button check-in interface
- **No-Login Authentication**: Device fingerprint-based authentication (no passwords)
- **Automatic Alerts**: Email notifications to emergency contacts after 2 days of inactivity
- **Bilingual Support**: Full Chinese (中文) and English interface
- **Privacy-Focused**: Client-side encryption, minimal data collection
- **Check-in History**: View your last 30 days of check-ins
- **Streak Tracking**: Track consecutive days of check-ins

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **i18n**: next-intl
- **Email**: Resend
- **Deployment**: Vercel
- **Authentication**: FingerprintJS (device fingerprinting)
- **Encryption**: crypto-js (AES-256)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Resend account (for email notifications)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/safety-checkin.git
cd safety-checkin
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_ENCRYPTION_KEY=your_encryption_key
RESEND_API_KEY=your_resend_api_key
CRON_SECRET=your_cron_secret
```

4. Set up the database:
   - Go to your Supabase project
   - Open the SQL Editor
   - Run the SQL script from `database.sql`

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Database Schema

The application uses three main tables:

- **users**: Stores user information (encrypted name, emergency email, device fingerprint)
- **checkins**: Records every check-in event with timestamps
- **alerts**: Tracks all alerts sent to emergency contacts

See `database.sql` for the complete schema.

## API Routes

- `POST /api/setup` - Initial user setup
- `GET /api/user` - Fetch user by device fingerprint
- `PUT /api/user` - Update user information
- `DELETE /api/user` - Delete user account
- `POST /api/checkin` - Record a check-in
- `GET /api/checkin` - Get check-in history
- `GET /api/cron/check-inactive` - Daily cron job to check inactive users

## Deployment

### Deploy to Vercel

1. Push your code to GitHub

2. Import the project in Vercel

3. Add environment variables in Vercel dashboard

4. Deploy!

The cron job is automatically configured via `vercel.json` to run daily at 9:00 AM UTC.

## How It Works

### User Flow

1. **First Visit**: User fills in their name and emergency contact email
2. **Daily Use**: User clicks the large check-in button once per day
3. **Monitoring**: System tracks last check-in timestamp
4. **Alert Trigger**: If no check-in for 2+ days, email is sent to emergency contact
5. **Settings**: User can update contact info or view check-in history

### Security & Privacy

- **No Registration**: No email/password required
- **Device Fingerprinting**: Unique device ID for authentication
- **Client-Side Encryption**: Sensitive data encrypted before sending to server
- **Minimal Data**: Only collects name, emergency email, and check-in timestamps
- **No Tracking**: No analytics, no third-party tracking

### Cron Job

A Vercel Cron job runs daily at 9:00 AM UTC:
1. Queries all users who haven't checked in for 2+ days
2. Filters out users who were alerted in the last 24 hours (prevents spam)
3. Sends email alerts to emergency contacts
4. Logs all alerts in the database

## Customization

### Change Grace Period

Edit the default grace period in `database.sql`:
```sql
grace_period_days INTEGER DEFAULT 2
```

### Customize Email Template

Edit the email content in `app/api/cron/check-inactive/route.ts`:
```typescript
const emailContent = {
  subject: 'Your custom subject',
  html: 'Your custom HTML content',
};
```

### Add More Languages

1. Create a new message file: `messages/[locale].json`
2. Add the locale to `i18n.ts`:
```typescript
export const locales = ['zh', 'en', 'your-locale'] as const;
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for any purpose.

## Acknowledgments

- Inspired by the viral Chinese app "死了么" (Are You Dead Yet?)
- Built for the 125+ million solo-living individuals in China and worldwide
- Addresses the growing concern of "孤独死" (dying alone) in modern society

## Support

If you find this project helpful, please give it a ⭐️ on GitHub!

---

**Note**: This is a safety tool, not a replacement for regular communication with family and friends. Always maintain basic contact with your loved ones.
