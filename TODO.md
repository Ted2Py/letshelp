# LetsHelp Development TODO

## Legend
- [ ] Pending
- [~] In Progress
- [x] Complete

---

## Phase 3: Core Infrastructure

### Database Setup
- [x] Create LetsHelp schema (`src/lib/schema-letshelp.ts`)
- [ ] Generate database migrations
- [ ] Run initial migrations
- [ ] Create seed data for testing
- [ ] Test database connection

### Authentication
- [ ] Add Google OAuth to Better Auth
- [ ] Create user role system (senior, admin, volunteer)
- [ ] Add role-based middleware
- [ ] Test OAuth flow

### Stripe Payments
- [ ] Set up Stripe products (monthly/annual)
- [ ] Create checkout session endpoint
- [ ] Create customer portal endpoint
- [ ] Set up webhook handler
- [ ] Test payment flow

### AI Integration
- [ ] Create Gemini Live API client (`src/lib/gemini.ts`)
- [ ] Set up ephemeral token generation
- [ ] Create session initialization endpoint
- [ ] Test audio streaming
- [ ] Test screen capture integration

---

## Phase 4: Feature Implementation

### 1. AI Tech Support Session
- [ ] Create "Get Help Now" button component
- [ ] Build session UI (audio/visual indicators)
- [ ] Implement screen capture (WebRTC)
- [ ] Implement bidirectional audio streaming
- [ ] Add session recording (optional)
- [ ] Handle session interruptions (VAD)
- [ ] Create session summary/transcript

### 2. Facility Administration Dashboard
- [ ] Create dashboard layout
- [ ] Build analytics overview card
- [ ] Create resident management list
- [ ] Add resident CRUD operations
- [ ] Build session history view
- [ ] Create facility settings page

### 3. Senior Experience
- [ ] Create senior-friendly home page
- [ ] Build "Get Help Now" CTA (large button)
- [ ] Design active session UI
- [ ] Create session history page
- [ ] Build accessibility settings
- [ ] Add language preference selector

### 4. Analytics & Tracking
- [ ] Track session start/end
- [ ] Record session duration
- [ ] Categorize issue types
- [ ] Generate facility analytics
- [ ] Create analytics export (CSV)

### 5. Billing & Subscription
- [ ] Create billing overview page
- [ ] Show invoice history
- [ ] Display upcoming invoice
- [ ] Handle subscription changes
- [ ] Email invoice notifications

### 6. Volunteer Handoff (Basic)
- [ ] Add "Connect to Human" button
- [ ] Create handoff request endpoint
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
- [ ] Create error boundary component
- [ ] Design friendly error messages
- [ ] Add retry functionality

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
- [ ] Ensure all components work in dark mode
- [ ] Test color contrast

---

## Phase 6: Marketing & Landing Page

- [ ] Create hero section
- [ ] Add feature showcase
- [ ] Build pricing cards
- [ ] Create testimonial section
- [ ] Write FAQ content
- [ ] Build contact form
- [ ] Add footer with links
- [ ] SEO optimization (meta tags, sitemap)

---

## Phase 7: Pre-Launch Checklist

### Security
- [ ] Zod validation on all API routes
- [ ] Rate limiting on auth endpoints
- [ ] CSRF protection
- [ ] CSP headers
- [ ] No secrets in code

### Performance
- [ ] Image optimization (next/image)
- [ ] Bundle size analysis
- [ ] No N+1 queries
- [ ] Caching strategy

### Quality
- [ ] Build/lint/tsc pass with zero errors
- [ ] All forms validated
- [ ] 404 page exists
- [ ] Error boundaries installed

### Legal
- [ ] Terms of Service
- [ ] Privacy Policy
- [ ] Cookie consent (if needed)

---

## Phase 8: Deployment

- [ ] Set up Vercel project
- [ ] Provision Neon database
- [ ] Configure environment variables
- [ ] Run database migrations
- [ ] Deploy to production
- [ ] Configure custom domain
- [ ] Set up monitoring

---

## Phase 9: Post-Launch Marketing

- [ ] Create launch tweet thread
- [ ] Write Product Hunt copy
- [ ] Design email announcement
- [ ] Create 30-day content calendar
- [ ] Write 5 SEO blog posts

---

## Current Sprint

### In Progress
- Setting up project scaffolding

### Next Up
- Database migrations and Gemini client setup
