# LetsHelp - AI Assistant Guidelines

## Project Overview

LetsHelp is an AI-powered tech support platform for seniors. Seniors connect to an AI assistant that can see their screen in real-time, hear their voice, and guide them step-by-step through their specific tech problems.

### Mission

Sixty million Americans over 65 lack accessible, patient tech support. LetsHelp provides on-demand, personalized AI assistance through real-time screen sharing and voice guidance.

### Target Users

- **Primary**: Senior living facilities (B2B) - $15/resident/month
- **Secondary**: Seniors living at home (B2C) - $20/month (future)

### Tech Stack

- **Framework**: Next.js 16 with App Router, React 19, TypeScript
- **AI Integration**: Google Gemini Live API (real-time audio + video)
- **Authentication**: BetterAuth with Google OAuth for seniors, Email/Password for staff
- **Database**: PostgreSQL (Neon in production) with Drizzle ORM
- **UI**: shadcn/ui components with Tailwind CSS 4
- **Styling**: Tailwind CSS with dark mode support (next-themes)
- **Payments**: Stripe for facility subscriptions
- **File Storage**: Vercel Blob (production) / local (development)

---

## AI Integration with Google Gemini Live API

### Key Points

- This project uses **Google Gemini Live API** (NOT OpenRouter)
- Model: `gemini-2.5-flash-native-audio-preview-12-2025`
- Supports: Real-time bidirectional audio, video/screen sharing, 70+ languages
- Documentation available in `google_live_api_docs/`

### Live API Implementation

The Live API requires a WebSocket connection for real-time streaming:

**Server-side (recommended):**
- Import from `@google/genai`
- Use ephemeral tokens for secure client connections
- Never expose API key to client

**Client-side:**
- WebSocket connection to Live API
- Screen capture via `getDisplayMedia()` WebRTC API
- Audio streaming via Web Audio API

### AI Implementation Files

- `src/lib/gemini.ts` - Gemini client configuration and utilities
- `src/app/api/support/` - Support session API endpoints
- `src/components/senior/` - Senior-friendly UI components

---

## Database Schema

### Core Tables

**Better Auth Tables** (in `src/lib/schema.ts`):
- `user` - User accounts
- `session` - Auth sessions
- `account` - OAuth accounts
- `verification` - Email verification codes

**LetsHelp Tables** (in `src/lib/schema-letshelp.ts`):
- `facilities` - Senior living communities
- `facility_staff` - Facility admin/staff relationships
- `residents` - Seniors using the service
- `support_sessions` - AI support sessions
- `session_messages` - Detailed session analytics
- `handoff_requests` - Volunteer handoff queue
- `usage_analytics` - Aggregated usage metrics
- `invoices` - Stripe invoice records
- `user_roles` - User role assignments (senior, admin, volunteer)
- `ai_session_tokens` - Ephemeral token management

### Relationships

```
facilities (1) ----< (*) residents
facilities (1) ----< (*) facility_staff
residents (1) ----< (*) support_sessions
support_sessions (1) ----< (*) session_messages
support_sessions (1) ----< (*) handoff_requests
```

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/                  # Auth route group
│   ├── (facility)/              # Facility admin dashboard
│   │   ├── dashboard/           # Analytics overview
│   │   ├── residents/           # Resident management
│   │   ├── billing/             # Subscription management
│   │   └── settings/            # Facility settings
│   ├── (senior)/                # Senior experience
│   │   ├── senior/              # Senior home with "Get Help Now"
│   │   ├── session/             # Active AI support session
│   │   └── history/             # Session history
│   ├── (marketing)/             # Public marketing pages
│   │   ├── page.tsx             # Landing page
│   │   ├── about/               # About LetsHelp
│   │   ├── pricing/             # Pricing page
│   │   └── contact/             # Contact form
│   ├── api/
│   │   ├── auth/[...all]/       # Better Auth catch-all
│   │   ├── support/             # AI support endpoints
│   │   │   ├── connect/         # Initialize session
│   │   │   ├── token/           # Ephemeral token
│   │   │   └── handoff/         # Volunteer request
│   │   ├── facilities/          # Facility management
│   │   ├── residents/           # Resident management
│   │   ├── billing/             # Stripe integration
│   │   └── webhooks/
│   │       └── stripe/          # Stripe webhooks
│   └── layout.tsx
├── components/
│   ├── auth/                    # Authentication components
│   ├── senior/                  # Senior-specific components
│   │   ├── get-help-button.tsx  # Large "Get Help Now" CTA
│   │   ├── session-ui.tsx       # Active session UI
│   │   └── history-card.tsx     # Session history item
│   ├── facility/                # Facility dashboard components
│   │   ├── analytics-card.tsx   # Usage statistics
│   │   ├── resident-list.tsx    # Resident management
│   │   └── billing-summary.tsx  # Billing info
│   └── ui/                      # shadcn/ui components
├── lib/
│   ├── auth.ts                  # Better Auth server config
│   ├── auth-client.ts           # Better Auth client hooks
│   ├── gemini.ts                # Gemini Live API client
│   ├── stripe.ts                # Stripe integration
│   ├── db.ts                    # Database connection
│   ├── schema.ts                # Drizzle schema (base)
│   ├── schema-letshelp.ts       # LetsHelp tables
│   ├── storage.ts               # File storage abstraction
│   └── utils.ts                 # Utility functions
└── styles/
    └── globals.css              # Tailwind + custom styles
```

---

## Environment Variables

Required environment variables (see `.env.example`):

```env
# Database
POSTGRES_URL=postgresql://user:password@localhost:5432/db_name

# Better Auth
BETTER_AUTH_SECRET=32-char-random-string

# Google OAuth (for seniors)
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/api/auth/callback/google

# Google Gemini Live API
GOOGLE_GENAI_API_KEY=
GOOGLE_CLOUD_PROJECT_ID=

# Stripe Payments
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_MONTHLY_PRICE_ID=
STRIPE_ANNUAL_PRICE_ID=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# File Storage
BLOB_READ_WRITE_TOKEN=  # Vercel Blob (production only)
```

---

## Available Scripts

```bash
pnpm run dev          # Start dev server
pnpm run build        # Build for production
pnpm run start        # Start production server
pnpm run lint         # Run ESLint
pnpm run typecheck    # TypeScript type checking
pnpm run db:generate  # Generate database migrations
pnpm run db:migrate   # Run database migrations
pnpm run db:push      # Push schema changes
pnpm run db:studio    # Open Drizzle Studio
```

---

## Senior-Friendly Design Guidelines

### Critical for LetsHelp

**Typography:**
- Base font size: 18px minimum
- Large text mode: 24px
- Extra-large mode: 28px
- High contrast mode available

**Buttons:**
- Minimum touch target: 44px × 44px
- Clear, descriptive labels
- No jargon or technical terms

**Colors:**
- Avoid red/green (color blindness common in seniors)
- Use blue for primary actions
- High contrast ratios (WCAG AAA)

**Navigation:**
- Single-page flows when possible
- Clear progress indicators
- Back button always visible

**Audio:**
- Voice responses from AI
- Adjustable speech rate
- 70+ language support

---

## Guidelines for AI Assistants

### CRITICAL RULES

1. **ALWAYS run lint and typecheck** after completing changes:

   ```bash
   pnpm run lint && pnpm run typecheck
   ```

2. **NEVER start the dev server yourself**
   - Ask user to provide dev server output if needed

3. **Use Google Gemini Live API, NOT OpenRouter/OpenAI**
   - Import from `@google/genai`
   - Model: `gemini-2.5-flash-native-audio-preview-12-2025`
   - Use ephemeral tokens for client connections

4. **Senior-First Design**
   - Always consider senior accessibility
   - Large fonts, high contrast, simple language
   - Test with senior persona in mind

5. **Authentication**
   - Server-side: Import from `@/lib/auth`
   - Client-side: Import from `@/lib/auth-client`
   - Google OAuth for seniors, email/password for staff

6. **Database Operations**
   - Use Drizzle ORM from `@/lib/db`
   - Schema: `@/lib/schema` (base) and `@/lib/schema-letshelp`
   - Always run migrations after schema changes

7. **File Storage**
   - Use `@/lib/storage` abstraction
   - Local in dev, Vercel Blob in production
   - Store session recordings securely

---

## Common Tasks

**Adding a senior page:**
1. Create in `src/app/(senior)/[route]/page.tsx`
2. Use large fonts, simple language
3. Add accessibility attributes

**Adding facility admin page:**
1. Create in `src/app/(facility)/[route]/page.tsx`
2. Check for admin role in middleware
3. Show facility-specific data

**Adding AI support endpoint:**
1. Create in `src/app/api/support/[route]/route.ts`
2. Use Gemini client from `@/lib/gemini`
3. Handle ephemeral tokens securely

**Working with sessions:**
1. Session record in `support_sessions` table
2. Messages in `session_messages` table
3. Analytics updated via `usage_analytics` table

**Modifying database:**
1. Update schema in `src/lib/schema-letshelp.ts`
2. Generate migration: `pnpm run db:generate`
3. Apply migration: `pnpm run db:migrate`

---

## PRD Reference

Full Product Requirements Document available at `docs/PRD.md`

Key features for MVP:
1. AI Tech Support Session (screen + voice)
2. Authentication (Google OAuth)
3. Facility Admin Dashboard
4. Senior-Friendly UI
5. Analytics & Tracking
6. Stripe Billing
7. Volunteer Handoff (basic)
