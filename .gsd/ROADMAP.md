# Roadmap: PingShield Hackathon MVP

## Wave 1: Database & Data Access Layer (Priority 1)
- [x] Create Supabase SQL migration (`supabase/migrations/20260214_pingshield_init.sql`) with RLS policies, tables (`owners`, `tags`, `reports`), and seed script.
- [x] Create robust Supabase client and resilient data access layer in `src/lib/supabase.ts` with local persistent fallback for zero-friction local testing and Supabase cloud connectivity.
- [x] Seed fictional demo data for `DEMO001` (MacBook Pro) and `DEMO002` (Vehicle).

## Wave 2: Submission API & Anti-Spam Protection (Priority 2)
- [x] Create `POST /api/reports` route handler in `src/app/api/reports/route.ts`:
  - Validate payload with Zod (tagCode, message, latitude, longitude, manualLocation, finderContact, honeypot).
  - Anti-spam rate limiting & length checks.
  - Insert report into Supabase/persistent store.
  - Return sanitized response without exposing owner phone or PII.

## Wave 3: Mobile Scanner Page `/s/[tagCode]` (Priority 3)
- [x] Build `/s/[tagCode]/page.tsx` (supports `/s/DEMO001`):
  - Dark + Pink + White premium aesthetic.
  - Display item name, category badge, and owner alias.
  - Recovery message form with character counter.
  - GPS location permission toggle + explicit button + geolocation error handling.
  - Alternative manual pickup location / landmark input field.
  - Emergency panel with clickable `112` (Police/SOS) and `1033` (NHAI Highway Helpline) links.
  - Real-time submission state (loading, error toast, verified success card).

## Wave 4: Owner Dashboard `/owner` (Priority 4)
- [x] Build `/owner/page.tsx` (and auth/passcode entry):
  - Secure demo owner authentication / session gate (`pingshield-demo-2026`).
  - View all reports chronologically with live status badges.
  - Render message, timestamp, contact info, and coordinates.
  - One-click "Open Directions in Google Maps" (`https://www.google.com/maps/dir/?api=1&destination=lat,lng`).
  - Mark report as Acknowledged / Resolved.

## Wave 5: Demo QR Page `/demo` (Priority 5)
- [x] Build `/demo/page.tsx`:
  - Live scannable QR code linking to `${APP_URL}/s/DEMO001`.
  - Downloadable QR PNG and quick test link.
  - Demo switcher between `DEMO001` and `DEMO002`.

## Wave 6: Premium Styling, Polish & Verification (Priority 6)
- [x] Verify Tailwind configuration with pink (`#F43F5E` / `#FB7185`), white, and dark theme (`#0B0F17`).
- [x] Update `.env.example`, `README.md` with Vercel deployment instructions.
- [x] End-to-end verification via API tests and browser subagent on `http://localhost:3000`.
