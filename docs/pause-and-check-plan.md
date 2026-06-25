# LetsHelp — "Pause & Check" Scam-Safety Feature Plan

> Status: Phase 1 in build. Phases 2–3 planned.
> Decisions locked with product owner (2026-06-25):
> - **Feature shape:** Dedicated "Is this safe?" check flow (separate from the live session).
> - **Positioning:** Co-equal pillar — keep "Patient Tech Support," add scam-safety alongside it.
> - **Inputs:** All four input types, phased by effort.
> - **Escalation:** Trusted-contact notify is a later phase.
> - **Hard constraint:** The existing "Get Help Now" live-session workflow must keep working unchanged.

## Why this exists

Our competitor [Jortty](https://jortty.com/) leads with **"AI Scam Detection & 24/7 Tech Support."**
Scam-safety for seniors is now table stakes, and LetsHelp currently has none. This feature adds a
first-class scam-safety capability without abandoning our patient-tech-support identity.

## Guiding safety principle (the accuracy bar)

**The AI must never give a confident "this is safe."** A false all-clear to a senior is the worst
outcome. Every verdict biases toward *pause and verify through an official channel*. We use a
**two-layer engine**:

1. **Rule layer (deterministic):** hard red flags — gift cards, crypto, wire transfer,
   verification/2FA codes, remote-access tools (AnyDesk/TeamViewer), SSN/Medicare number,
   "act now / urgent," "keep it secret," links/phone numbers embedded in the message. Any hit
   means the verdict can never be "looks okay."
2. **LLM layer (explanatory):** Gemini explains *why* in plain, senior-readable language and gives
   one clear next step. It can raise the risk level but never lower it below what the rules set.

Output is a 3-state, **colorblind-safe** signal (blue / amber / grey — never red-green, per our
senior design guidelines):
- `high` → "This looks like a scam"
- `caution` → "Be careful — check first"
- `likely_safe` → "No clear danger — but still verify"

## Architecture (mirrors existing patterns)

| Concern | Existing pattern we reuse | New file |
|---|---|---|
| Server-side Gemini text/JSON call | `generateSessionSummary()` in `src/lib/gemini.ts` | `src/lib/scam-safety.ts` |
| Authed API route, key stays server-side | `src/app/api/support/token/route.ts` | `src/app/api/support/check/route.ts` |
| Senior-friendly client UI | `src/components/senior/session-ui-live.tsx` | `src/components/senior/scam-check.tsx` |
| Auth-gated senior page | `src/app/(senior)/senior/session/[id]/page.tsx` | `src/app/(senior)/senior/check/page.tsx` |
| Large entry button → action | `src/components/senior/get-help-button.tsx` | `src/components/senior/pause-check-button.tsx` |

## Phase 1 — The Pause & Check flow (this phase)

- **Engine** `src/lib/scam-safety.ts`: `RED_FLAG_RULES` + `analyzeScamRisk({ text?, imageBase64?, callAnswers? })`
  returning `{ riskLevel, headline, redFlags[], whatToDo[], verifyVia }`. Uses `gemini-2.0-flash`
  (already used elsewhere; supports vision). Rule layer clamps the LLM result upward only.
- **API** `src/app/api/support/check/route.ts` (POST, authed).
- **UI** `src/components/senior/scam-check.tsx` with four inputs:
  - Paste a message (text) — v1
  - About a phone call (guided checkboxes) — v1
  - Upload a picture (Gemini vision) — v1
  - Just tell a helper → reuses `createSupportSession()` to open a live session — v1 (shortcut)
- **Page** `src/app/(senior)/senior/check/page.tsx` (auth gate, same as session page).
- **Entry** second large button on `src/app/(senior)/senior/page.tsx`, beside "Get Help Now."
- **Stateless** for v1 — no schema migration. Verdicts are not persisted yet.

## Phase 2 — Positioning (co-equal pillar)

- Landing `src/app/page.tsx`: hero sub-line + second CTA; add "Scam-Safety Check" to the feature
  grids; add an FAQ entry; add a short "Stay safe from scams" section.
- Footer product links.

## Phase 3 — Escalation + live-session awareness (later)

- Schema `src/lib/schema-letshelp.ts`: `scam_checks` table (facility incident log) + trusted-contact
  / consent fields (build on existing `residents.familyEmail` / `emergencyContact`).
- One-tap "Tell my family" → summary via `src/lib/email.ts`.
- Teach the live voice AI to recognize red flags and shift to pause mode — system prompt in
  `src/lib/live-client.ts`.
- Facility dashboard "scams flagged this month" widget.

## Cleanup / truth-table notes (separate from this feature)

- `src/components/senior/session-ui.tsx` is **dead mock code**; the live UI is `session-ui-live.tsx`.
- Marketing claims "Human Backup — a real volunteer 24/7," but the handoff only writes a DB row and
  notifies managers (`src/lib/actions/support.ts`). There is no real volunteer pool. Soften the copy
  or build the reality before adding more claims.
