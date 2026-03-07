# LetsHelp - Product Requirements Document

## Overview

**One-liner:** LetsHelp is an AI-powered tech support platform that provides seniors with on-demand, patient, and personalized assistance through real-time screen sharing and voice guidance.

**Target Users:**
- **Primary:** Senior living facilities (assisted living, independent living, continuing care) - B2B
- **Secondary:** Seniors living at home and their adult children - B2C (post-launch)

**Business Model:**
- B2B: $15 per resident per month to senior living facilities
- B2C: $20 per month for individual seniors (future expansion)
- Revenue: At 1% penetration (300 facilities × 100 residents × $15/month) = $5.4M ARR
- At 10% penetration = $54M ARR

**Launch Date:** Q2 2025 (Summer Launch Incubator pilot)

---

## User Stories (Prioritized)

### P0 - MVP (Must Have for Pilot)

1. **As a senior**, I want to speak naturally to an AI assistant that can see my screen, so I can get help with my specific tech problem without leaving my home.
2. **As a senior**, I want the AI to be infinitely patient and never make me feel foolish, so I feel comfortable asking questions repeatedly.
3. **As a senior**, I want to hear the AI speak my preferred language, so I can understand the instructions clearly.
4. **As a facility administrator**, I want to see which residents are using LetsHelp and how often, so I can justify the subscription cost.
5. **As a facility administrator**, I want a simple way to add/remove residents from the service, so I can manage our subscription.
6. **As a product owner**, I want to collect analytics on common tech issues, so I can improve the service and demonstrate value.

### P1 - Post-Launch (Important but Not Blocking)

7. **As a senior**, I want to request a live human volunteer when the AI can't help, so I know there's always a solution.
8. **As a facility administrator**, I want to review support session transcripts, so I can understand what residents are struggling with.
9. **As a senior**, I want to access a history of my past sessions, so I can review how I solved similar problems.
10. **As a facility staff member**, I want to receive alerts when a resident has an unresolved issue, so I can follow up personally.
11. **As a product owner**, I want automated billing and subscription management, so I don't manually chase payments.

### P2 - Future Enhancements

12. **As a senior**, I want to schedule a session in advance, so I know when help will be available.
13. **As a facility administrator**, I want to customize the AI personality to match our community's culture.
14. **As a volunteer**, I want to see a queue of residents needing human assistance, so I can help when available.
15. **As a senior**, I want to practice common tech tasks in a safe environment, so I can build confidence.

---

## Core Features P0 (MVP)

### 1. AI Tech Support Session
**Acceptance Criteria:**
- Senior can initiate a voice + screen sharing session with one click
- AI sees the user's screen in real-time via browser-based screen capture
- AI hears user's voice via microphone
- AI responds with voice (70+ language support)
- Session supports interruption (VAD - Voice Activity Detection)
- Sessions have configurable time limits with auto-reconnect options
- Session transcripts are stored for analytics

### 2. Authentication
**Acceptance Criteria:**
- Google OAuth integration for seniors (one-click login)
- Facility staff login via email/password or SSO (future)
- Session management with secure tokens
- Protected routes for admin dashboard

### 3. Facility Administration Dashboard
**Acceptance Criteria:**
- Facility admins can view all residents in their facility
- Add/remove residents from service
- View session analytics (total sessions, avg duration, common issues)
- See facility subscription status and billing info
- Export session reports (CSV/PDF)

### 4. Resident Experience
**Acceptance Criteria:**
- Large, readable fonts (minimum 18px base, scalable to 24px)
- High contrast mode option
- Simple one-tap "Get Help Now" button
- Clear visual indicator when AI is speaking vs listening
- Session history for each resident
- Language preference saved per user

### 5. Analytics & Tracking
**Acceptance Criteria:**
- Track session count, duration, and outcome per resident
- Aggregate analytics per facility
- Track common tech issues (categorized)
- Anonymous usage metrics for product improvement
- Session storage for quality assurance

### 6. Billing & Subscription Management
**Acceptance Criteria:**
- Stripe integration for B2B subscription billing
- Monthly invoices generated automatically
- Facility can view billing history
- Prorate charges when residents are added/removed
- Payment failure handling with retry logic

### 7. Volunteer Handoff (Basic)
**Acceptance Criteria:**
- AI can detect when it cannot resolve an issue
- "Connect to Human" button available to seniors
- Basic queue system for volunteer requests
- Notification system for available volunteers (email/SMS)
- Handoff protocol preserves session context

---

## Secondary Features P1 (Post-Launch)

1. **Multilingual AI Responses**: Pre-select language, auto-detect from speech
2. **Session Recording**: Opt-in recording for training and QA
3. **Smart Categorization**: Auto-categorize issues (passwords, apps, hardware, etc.)
4. **Family Notifications**: Optional alerts to family members after sessions
5. **Mobile Apps**: iOS and Android native apps
6. **Offline Guides**: Downloadable step-by-step guides for common issues
7. **Facility Analytics Comparison**: Benchmark against similar facilities

---

## Tech Stack Details

### Frontend
- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **State Management**: React Server Components + Server Actions
- **Forms**: React Hook Form + Zod validation

### Backend
- **Runtime**: Node.js (Next.js server)
- **API**: Server Actions (preferred) and API Routes
- **Authentication**: Better Auth
  - Google OAuth for seniors
  - Email/password for facility staff
- **Database**: Drizzle ORM
  - Local: PostgreSQL via Docker
  - Production: Neon via Vercel

### AI Integration
- **Provider**: Google Gemini Live API
- **Model**: `gemini-2.5-flash-native-audio-preview-12-2025`
- **Features**:
  - Real-time bidirectional audio streaming
  - Screen capture via WebRTC
  - Function calling for tool integration
  - Session resumption for long conversations
  - Voice Activity Detection (VAD)
  - 70+ language support

### File Storage
- **Local**: Public filesystem during development
- **Production**: Vercel Blob Storage
- **Content**: Session recordings (if enabled), profile images

### Payments
- **Provider**: Stripe
- **Products**:
  - Monthly facility subscription ($15/resident)
  - Annual facility subscription (discounted)
- **Features**: Checkout session, customer portal, webhooks

### Hosting & Infrastructure
- **Hosting**: Vercel
- **Database**: Neon (via Vercel integration)
- **DNS**: Custom domain (to be configured)
- **Monitoring**: Vercel Analytics + error tracking

### Development Tools
- **Package Manager**: pnpm
- **Code Quality**: ESLint, Prettier, TypeScript strict mode
- **Testing**: Playwright (E2E), Vitest (unit tests)
- **Git**: GitHub with conventional commits

---

## Database Schema

```typescript
// Users table (Better Auth integration)
users {
  id: uuid PRIMARY KEY
  email: varchar UNIQUE
  emailVerified: timestamp
  name: varchar
  image: varchar | null
  role: enum('senior', 'facility_admin', 'super_admin')
  createdAt: timestamp DEFAULT NOW()
  updatedAt: timestamp DEFAULT NOW()
}

// Facilities (senior living communities)
facilities {
  id: uuid PRIMARY KEY
  name: varchar NOT NULL
  address: varchar
  contactEmail: varchar
  contactPhone: varchar
  stripeCustomerId: varchar | null
  subscriptionStatus: enum('active', 'trialing', 'past_due', 'canceled', 'unpaid')
  subscriptionPlan: enum('monthly', 'annual')
  pricePerResident: integer DEFAULT 1500 // in cents ($15)
  maxResidents: integer | null
  createdAt: timestamp DEFAULT NOW()
  updatedAt: timestamp DEFAULT NOW()
}

// Facility-Staff relationship
facility_staff {
  id: uuid PRIMARY KEY
  facilityId: uuid REFERENCES facilities(id)
  userId: uuid REFERENCES users(id)
  role: enum('admin', 'staff')
  createdAt: timestamp DEFAULT NOW()
}

// Residents (seniors using the service)
residents {
  id: uuid PRIMARY KEY
  facilityId: uuid REFERENCES facilities(id) | null // null for B2C
  userId: uuid REFERENCES users(id)
  preferredLanguage: varchar DEFAULT 'en'
  accessibilitySettings: json // { fontSize, highContrast, etc. }
  dateOfBirth: date | null
  emergencyContact: json // { name, phone, email }
  createdAt: timestamp DEFAULT NOW()
  updatedAt: timestamp DEFAULT NOW()
}

// Support sessions
sessions {
  id: uuid PRIMARY KEY
  residentId: uuid REFERENCES residents(id)
  facilityId: uuid REFERENCES facilities(id)
  startTime: timestamp DEFAULT NOW()
  endTime: timestamp | null
  duration: integer | null // in seconds
  status: enum('active', 'completed', 'abandoned', 'handed_off')
  issueCategory: varchar | null // 'password', 'app', 'hardware', 'communication', etc.
  issueDescription: text | null
  resolution: text | null // AI summary of resolution
  transcript: text | null // Full session transcript
  recordingUrl: varchar | null // Link to stored recording
  aiModel: varchar DEFAULT 'gemini-2.5-flash-native-audio-preview-12-2025'
  handedOffTo: uuid REFERENCES users(id) | null // Volunteer who took over
  createdAt: timestamp DEFAULT NOW()
}

// Session messages (for detailed analytics)
session_messages {
  id: uuid PRIMARY KEY
  sessionId: uuid REFERENCES sessions(id)
  role: enum('user', 'assistant', 'system')
  content: text
  timestamp: timestamp DEFAULT NOW()
  audioTranscript: text | null
}

// Volunteer handoff requests
handoff_requests {
  id: uuid PRIMARY KEY
  sessionId: uuid REFERENCES sessions(id)
  residentId: uuid REFERENCES residents(id)
  status: enum('pending', 'accepted', 'declined', 'canceled')
  requestedAt: timestamp DEFAULT NOW()
  acceptedAt: timestamp | null
  acceptedBy: uuid REFERENCES users(id) | null
  reason: text | null
}

// Usage analytics (aggregated)
usage_analytics {
  id: uuid PRIMARY KEY
  facilityId: uuid REFERENCES facilities(id)
  residentId: uuid REFERENCES residents(id) | null // null for facility-wide
  date: date NOT NULL
  totalSessions: integer DEFAULT 0
  totalDuration: integer DEFAULT 0 // in seconds
  completedSessions: integer DEFAULT 0
  abandonedSessions: integer DEFAULT 0
  handedOffSessions: integer DEFAULT 0
  commonIssues: json | null // { category: count }
  createdAt: timestamp DEFAULT NOW()
  updatedAt: timestamp DEFAULT NOW()
  UNIQUE(facilityId, residentId, date)
}

// Invoices
invoices {
  id: uuid PRIMARY KEY
  facilityId: uuid REFERENCES facilities(id)
  stripeInvoiceId: varchar UNIQUE
  amount: integer // in cents
  currency: varchar DEFAULT 'usd'
  status: enum('draft', 'open', 'paid', 'void', 'uncollectible')
  periodStart: date
  periodEnd: date
  residentCount: integer
  pdfUrl: varchar | null
  createdAt: timestamp DEFAULT NOW()
  updatedAt: timestamp DEFAULT NOW()
}
```

---

## API Routes / Server Actions

### Authentication (`/api/auth/*`)
- `GET /api/auth/signin` - Initiate OAuth flow
- `GET /api/auth/callback` - OAuth callback handler
- `POST /api/auth/signout` - Sign out user

### Sessions (`/api/sessions`)
- `GET /api/sessions` - List sessions (filtered by user/facility)
- `GET /api/sessions/[id]` - Get session details
- `POST /api/sessions` - Create new session
- `PATCH /api/sessions/[id]` - Update session (end, handoff)
- `DELETE /api/sessions/[id]` - Delete session

### AI Support (`/api/support`)
- `POST /api/support/connect` - Initialize AI session
- `GET /api/support/token` - Get ephemeral token for secure client connection
- `POST /api/support/handoff` - Request volunteer handoff
- `GET /api/support/transcript/[id]` - Get session transcript

### Facility Management (`/api/facilities`)
- `GET /api/facilities` - List facilities (admin only)
- `GET /api/facilities/[id]` - Get facility details
- `PATCH /api/facilities/[id]` - Update facility
- `GET /api/facilities/[id]/residents` - List facility residents
- `POST /api/facilities/[id]/residents` - Add resident
- `DELETE /api/facilities/[id]/residents/[residentId]` - Remove resident
- `GET /api/facilities/[id]/analytics` - Get facility analytics

### Residents (`/api/residents`)
- `GET /api/residents` - List current user's resident profile
- `PATCH /api/residents` - Update resident profile
- `GET /api/residents/sessions` - Get resident's session history
- `PATCH /api/residents/settings` - Update accessibility settings

### Billing (`/api/billing`)
- `GET /api/billing/portal` - Redirect to Stripe Customer Portal
- `POST /api/billing/checkout` - Create checkout session
- `GET /api/billing/invoices` - List invoices
- `GET /api/billing/upcoming` - Get upcoming invoice

### Webhooks (`/api/webhooks`)
- `POST /api/webhooks/stripe` - Handle Stripe webhooks

### Admin (`/api/admin`)
- `GET /api/admin/analytics` - Platform-wide analytics
- `GET /api/admin/facilities` - Manage all facilities
- `POST /api/admin/facilities` - Create facility
- `GET /api/admin/users` - Manage users

---

## Pages & Routes

### Public Pages
| Route | Purpose |
|-------|---------|
| `/` | Landing page with hero, features, pricing, testimonials |
| `/about` | About LetsHelp and the mission |
| `/contact` | Contact form for sales inquiries |
| `/privacy` | Privacy Policy |
| `/terms` | Terms of Service |
| `/auth/signin` | Sign in page |
| `/auth/callback` | OAuth callback handler |

### Authenticated Pages (All Users)
| Route | Purpose |
|-------|---------|
| `/dashboard` | Main dashboard (redirects based on role) |
| `/profile` | User profile settings |
| `/sessions` | Session history |
| `/sessions/[id]` | Session details and transcript |

### Senior Pages
| Route | Purpose |
|-------|---------|
| `/senior` | Senior home with "Get Help Now" CTA |
| `/senior/session` | Active AI support session |
| `/senior/history` | Personal session history |
| `/senior/settings` | Accessibility and language settings |

### Facility Admin Pages
| Route | Purpose |
|-------|---------|
| `/facility` | Facility dashboard with analytics overview |
| `/facility/residents` | Manage residents (add, remove, view) |
| `/facility/analytics` | Detailed analytics and reports |
| `/facility/billing` | Billing information and invoices |
| `/facility/settings` | Facility settings |

### Admin Pages
| Route | Purpose |
|-------|---------|
| `/admin` | Admin dashboard |
| `/admin/facilities` | Manage all facilities |
| `/admin/analytics` | Platform analytics |
| `/admin/users` | User management |

---

## Third-Party Integrations

### Google Cloud / Gemini AI
**Purpose**: Core AI tech support functionality

**Setup Steps**:
1. Create Google Cloud project
2. Enable Gemini API
3. Create API key (server-side only, never exposed to client)
4. For client-side connections, implement ephemeral token generation
5. Configure OAuth consent screen for Google Sign-In

**Environment Variables**:
- `GOOGLE_GENAI_API_KEY` - Gemini API key
- `GOOGLE_OAUTH_CLIENT_ID` - OAuth client ID
- `GOOGLE_OAUTH_CLIENT_SECRET` - OAuth client secret
- `GOOGLE_OAUTH_REDIRECT_URI` - OAuth callback URL

**Security Notes**:
- API key must never be exposed to client
- Use ephemeral tokens for client-to-server Live API connections
- Store OAuth secrets securely with Vercel env vars

### Stripe
**Purpose**: Subscription billing and invoicing

**Setup Steps**:
1. Create Stripe account
2. Create products:
   - "Monthly Facility Subscription" - $15/resident/month
   - "Annual Facility Subscription" - $150/resident/year (2 months free)
3. Set up webhook endpoints for:
   - `invoice.paid`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Configure Customer Portal for self-service management

**Environment Variables**:
- `STRIPE_SECRET_KEY` - Secret key (test or live)
- `STRIPE_PUBLISHABLE_KEY` - Publishable key
- `STRIPE_WEBHOOK_SECRET` - Webhook signing secret
- `STRIPE_MONTHLY_PRICE_ID` - Monthly price ID
- `STRIPE_ANNUAL_PRICE_ID` - Annual price ID

### Vercel Blob
**Purpose**: File storage for session recordings

**Setup Steps**:
1. Install Blob storage in Vercel project
2. Configure blob upload/delete in application
3. Set up lifecycle policies for automatic cleanup

**Environment Variables**:
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob access token

---

## Security Considerations

### Authentication & Authorization
- **Middleware**: Protected routes use Better Auth middleware
- **Role-Based Access**: Admin, facility_admin, senior roles with appropriate permissions
- **Session Management**: Secure HTTP-only cookies for session tokens
- **CSRF Protection**: Built into Better Auth

### Input Validation
- All API routes validate with Zod schemas
- Server Actions use `createSafeActionClient` pattern
- Rate limiting on auth endpoints (5 requests/minute)
- Rate limiting on session creation (10/minute per user)

### Data Protection
- **PII**: Resident names, emails, contact info encrypted at rest
- **Session Transcripts**: Encrypted storage, auto-delete after 90 days (configurable)
- **Recordings**: Stored in private blob storage, signed URLs with expiration
- **HIPAA Considerations**: Not healthcare data, but follow best practices for senior information

### API Security
- Server-side API keys never exposed to client
- Ephemeral tokens for Live API client connections
- CORS configured for allowed origins only
- Webhook signature verification for Stripe

### Privacy Controls
- Seniors can opt out of session recording
- Opt-in for family notifications
- Data retention policies clearly stated
- Right to data deletion (GDPR compliance)

---

## Launch Checklist

### Pre-Pilot
- [ ] Complete MVP development (P0 features)
- [ ] Security audit (OWASP Top 10)
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Senior usability testing (5-10 users from volunteer facility)
- [ ] Performance testing (target: <3s initial load, <500ms API responses)
- [ ] Error handling and retry logic
- [ ] Session recording and analytics functioning
- [ ] Stripe test mode checkout flow
- [ ] OAuth flow testing
- [ ] Mobile responsiveness testing

### Pilot Readiness
- [ ] Production database provisioned (Neon)
- [ ] Environment variables configured in Vercel
- [ ] Custom domain configured and SSL verified
- [ ] Error monitoring set up (Vercel + Sentry optional)
- [ ] Analytics set up (Vercel Analytics)
- [ ] Terms of Service and Privacy Policy published
- [ ] Facility onboarding documentation created
- [ ] Senior user guide (large print, simple language)
- [ ] Emergency support process documented

### Facilities
- [ ] First pilot facility identified and onboarded
- [ ] Staff training completed
- [ ] Resident introduction materials prepared
- [ ] Feedback collection mechanism in place

### Post-Pilot
- [ ] Collect feedback from first 50 sessions
- [ ] Iterate on top 3 pain points
- [ ] Expand to 2-3 additional facilities
- [ ] Launch B2C waitlist
- [ ] Begin volunteer recruitment for handoff feature

---

## Success Metrics

### Pilot Phase (3 months)
- **Engagement**: 70% of residents use at least once
- **Retention**: 40% of users return for second session within 30 days
- **Satisfaction**: 4.5/5 average satisfaction rating
- **Resolution**: 80% of issues resolved by AI without human handoff
- **Facility Value**: Staff report 50% reduction in tech support requests

### Growth Phase (6-12 months)
- **Facilities**: 10 facilities signed up
- **Residents**: 1,000 active seniors
- **Sessions**: 5,000 sessions per month
- **Revenue**: $15,000 MRR
- **NPS**: 50+ among facility administrators

### Scale Phase (12+ months)
- **Facilities**: 50 facilities
- **Residents**: 5,000 active seniors
- **Sessions**: 30,000 sessions per month
- **Revenue**: $75,000 MRR
- **Expansion**: Launch B2C offering

---

## Dependencies & Risks

### Technical Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Gemini Live API downtime | High | Graceful degradation to text-only support |
| Screen sharing compatibility | Medium | Progressive enhancement, fallback to verbal description |
| Senior device limitations | High | Support older browsers, optimize for low bandwidth |
| WebSocket connection issues | Medium | Auto-reconnect with session resumption |

### Business Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Low adoption by seniors | High | In-person training, staff encouragement |
| Facility budget cuts | Medium | Demonstrate clear ROI (staff time savings) |
| Competition from tech companies | Medium | Focus on senior-specific UX and relationships |
| Volunteer availability | Low | AI handles majority of cases |

### Legal/Compliance
| Risk | Impact | Mitigation |
|------|--------|------------|
| Data privacy concerns | High | Clear privacy policy, opt-in consent, data encryption |
| Accessibility compliance | Medium | WCAG 2.1 AA audit, high contrast mode, screen reader support |
| Liability for tech advice | Low | Disclaimer, focus on guidance not guarantees |

---

## Open Questions

1. **Session Time Limits**: What's the maximum session duration? (Suggestion: 60 minutes with auto-extend)
2. **Recording Retention**: How long to store session recordings? (Suggestion: 30 days default, configurable)
3. **Volunteer Vetting**: What background checks for volunteers? (Suggestion: Basic background check for pilot)
4. **Facility Onboarding**: Who pays for onboarding costs? (Suggestion: Waived for first 3 pilot facilities)
5. **Brand Name**: "LetsHelp" is working title - confirm final branding

---

## Appendix: Existing MVP Capabilities

Based on your Gemini Hackathon winning project, the following has been validated:
- Real-time audio streaming with Gemini Live API
- Voice Activity Detection (VAD) for natural interruptions
- Screen capture and sharing functionality
- Senior-friendly UI prototypes
- Basic session analytics

These capabilities form the foundation for the LetsHelp platform.
