# LetsHelp Development TODO

## Legend
- [ ] Pending
- [~] In Progress
- [x] Complete

---

## Phase 3: Core Infrastructure

### Database Setup
- [x] Create LetsHelp schema (`src/lib/schema-letshelp.ts`)
- [x] Generate database migrations
- [x] Run initial migrations
- [x] Test database connection

### Authentication
- [x] Add Google OAuth to Better Auth
- [x] Test OAuth flow

### Stripe Payments
- [x] Set up Stripe client (`src/lib/stripe.ts`)
- [x] Define subscription plans (B2B $15/mo, B2C $20/mo)
- [ ] Create checkout session endpoint
- [ ] Create customer portal endpoint
- [ ] Set up webhook handler

### AI Integration
- [x] Create Gemini Live API client (`src/lib/gemini.ts`)
- [x] Set up system instructions for senior-friendly AI
- [ ] Create session initialization endpoint
- [ ] Test audio streaming
- [ ] Test screen capture integration

---

## Phase 4: Feature Implementation

### 1. AI Tech Support Session
- [x] Create "Get Help Now" button component (`src/components/senior/get-help-button.tsx`)
- [x] Build session UI layout (`src/components/senior/session-ui.tsx`)
- [x] Create support server actions (`src/lib/actions/support.ts`)
- [ ] Implement screen capture (WebRTC)
- [ ] Implement bidirectional audio streaming
- [ ] Add session recording (optional)

### 2. Facility Administration Dashboard
- [x] Create dashboard layout (`src/app/(facility)/facility/page.tsx`)
- [x] Build analytics overview card
- [x] Create facility server actions (`src/lib/actions/facility.ts`)
- [ ] Create resident management list page
- [ ] Build session history view
- [ ] Create facility settings page

### 3. Senior Experience
- [x] Create senior-friendly home page (`src/app/(senior)/senior/page.tsx`)
- [x] Build "Get Help Now" CTA (large button)
- [x] Design active session UI (`src/app/(senior)/senior/session/[id]/page.tsx`)
- [ ] Create session history page
- [ ] Build accessibility settings
- [ ] Add language preference selector

### 4. Analytics & Tracking
- [x] Track session start/end (in schema)
- [x] Record session duration
- [x] Categorize issue types
- [x] Generate facility analytics
- [ ] Create analytics export (CSV)

### 5. Billing & Subscription
- [ ] Create billing overview page
- [ ] Show invoice history
- [ ] Display upcoming invoice
- [ ] Handle subscription changes
- [ ] Email invoice notifications

### 6. Volunteer Handoff (Basic)
- [x] Add "Connect to Human" button (in session-ui)
- [x] Create handoff request endpoint
- [ ] Build volunteer queue view
- [ ] Implement handoff notification
- [ ] Preserve session context on handoff

---

## Phase 5: UI/UX Polish

### Responsive Design
- [ ] Test all breakpoints (mobile, tablet, desktop)
- [ ] Optimize touch targets for mobile
- [ ] Ensure all components are responsive

### Loading States
- [ ] Add skeleton screens
- [ ] Create loading spinners
- [ ] Implement optimistic updates

### Error States
- [x] Update error.tsx for LetsHelp branding
- [x] Update not-found.tsx for LetsHelp branding
- [ ] Add retry functionality where appropriate

### Empty States
- [ ] Design empty session history
- [ ] Create no-residents state
- [ ] Add helpful CTAs to empty states

### Accessibility
- [ ] WCAG 2.1 AA audit
- [ ] Keyboard navigation
- [ ] Screen reader testing
- [ ] Focus management

### Dark Mode
- [x] Dark mode styles included (using Tailwind dark:)
- [ ] Test color contrast in production

---

## Phase 6: Marketing & Landing Page

- [x] Create hero section with CTAs
- [x] Add problem/solution section
- [x] Add "How It Works" section
- [x] Build feature showcase
- [x] Create testimonial section
- [x] Build pricing cards (B2B/B2C)
- [x] Write FAQ content
- [x] Add footer with links
- [x] SEO optimization (meta tags, JSON-LD)
- [x] Create Terms of Service page
- [x] Create Privacy Policy page
- [x] Update 404 and error pages with LetsHelp branding

---

## Phase 7: Pre-Launch Checklist

### Security
- [ ] Add Zod validation on all API routes
- [ ] Add rate limiting on auth endpoints
- [ ] Verify CSRF protection
- [ ] Configure CSP headers
- [x] No secrets in code (using env vars)

### Performance
- [ ] Verify image optimization (next/image)
- [ ] Bundle size analysis
- [ ] Check for N+1 queries
- [ ] Define caching strategy

### Quality
- [x] Build passes with zero errors
- [x] Lint passes with zero errors
- [x] TypeScript passes with zero errors
- [ ] All forms validated
- [x] 404 page exists and is branded
- [x] Error boundary installed

### Legal
- [x] Terms of Service published (/terms)
- [x] Privacy Policy published (/privacy)

---

## Phase 8: Deployment

- [ ] Set up Vercel project
- [ ] Provision Neon database
- [ ] Configure environment variables (BETTER_AUTH_URL, etc.)
- [ ] Run database migrations on production
- [ ] Deploy to production
- [ ] Configure custom domain
- [ ] Set up monitoring (error tracking)

---

## Phase 9: Post-Launch Marketing

- [ ] Create launch tweet thread
- [ ] Write Product Hunt copy
- [ ] Design email announcement
- [ ] Create 30-day content calendar
- [ ] Write 5 SEO blog posts

---

## Current Sprint

### Recently Completed
- Phase 6: Marketing & Landing Page
  - Created comprehensive landing page with hero, features, pricing, FAQ
  - Added SEO meta tags and JSON-LD structured data
  - Created Terms of Service and Privacy Policy pages
  - Updated 404 and error pages with LetsHelp branding

- Phase 7 (Partial): Pre-Launch Checklist
  - Build, lint, and TypeScript all passing
  - Error pages updated and branded

### Next Steps
- Complete Phase 5: Add loading states and empty states to components
- Complete Phase 7: Security hardening (Zod validation, rate limiting)
- Phase 8: Deploy to Vercel/Neon production
