# Specification: PingShield Hackathon MVP

Status: FINALIZED

## 1. Project Goal
Build a working hackathon MVP called **PingShield** using Next.js App Router, TypeScript, Tailwind CSS, and Supabase.
Designed for rapid recovery of lost items / vehicle tag scanning with zero finder login, privacy preservation (no owner phone exposed), GPS / manual location sharing, emergency hotlines, and an owner dashboard.

## 2. Scope & Strict Boundaries (Build ONLY):
1. **Scanner Route (`/s/[tagCode]` or `/s/DEMO001`)**:
   - Mobile-first responsive UI with pink, white, and dark premium aesthetic.
   - Shows item details (e.g., "Matte Black MacBook Pro 16\"" or "Royal Enfield Meteor 350") and Owner Alias ("Alex M." / "CyberShield").
   - Explicit Geolocation permission prompt ("Share GPS Location") with fallback to manual location/pickup address.
   - Recovery message textarea with anti-spam rate limiting & character counters.
   - Finder contact (optional email / phone for owner to reply).
   - Emergency panel with direct clickable links:
     - Police / SOS: `tel:112`
     - Highway Emergency / NHAI: `tel:1033`
   - Form submission sends `POST /api/reports` with real-time feedback (loading state, verified success card).
   - No finder login required.

2. **POST /api/reports**:
   - Validates submission payload (tagCode, message, finderContact, latitude, longitude, manualLocation).
   - Protection against spam (rate-limiting by IP/session, honeypot field, length validation).
   - Persists the report in Supabase (`reports` table).
   - Updates tag status / scan count in `tags` table.
   - Returns sanitized confirmation with report ID. Never exposes owner's phone or private details.

3. **Owner Dashboard (`/owner`)**:
   - Demo-owner authenticated or passcode/session-protected dashboard.
   - Lists all received recovery reports with:
     - Timestamp (formatted with relative & absolute time)
     - Tag code & Item name
     - Message from finder
     - Coordinates (with one-click "Open in Google Maps / Directions" link: `https://www.google.com/maps/dir/?api=1&destination={lat},{lng}`)
     - Manual location note (if provided)
     - Status badges ("New", "Acknowledged", "Resolved")
   - Action to toggle status or filter reports.

4. **Demo QR Page (`/demo`)**:
   - Generates and displays scannable QR code directly pointing to `${APP_URL}/s/DEMO001`.
   - Download QR button + direct "Open Scanner" link.
   - Switchable demo tags (e.g. DEMO001 - Laptop, DEMO002 - Vehicle, DEMO003 - Keys).

5. **Emergency Panel**:
   - Simple clickable links:
     - `112` (National Emergency Helpline / Police / Ambulance)
     - `1033` (National Highway Emergency Helpline)

6. **Database & Architecture**:
   - Supabase schema migrations SQL (`supabase/migrations/20260214_pingshield_init.sql`).
   - Tables: `owners`, `tags`, `reports`.
   - Row-Level Security (RLS) policies:
     - Public can SELECT active tag metadata (alias, item_name, tag_code, no phone/email).
     - Public can INSERT to `reports` (with validation).
     - Only authenticated owners can SELECT/UPDATE their own reports.
   - Seed data with `DEMO001` (and `DEMO002`).
   - Flexible Supabase client:
     - Uses `@supabase/supabase-js` with environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
     - Includes a local persistent storage fallback (or mock/sqlite/json store when Supabase env vars are empty in offline/local test mode) so the app ALWAYS runs out-of-the-box in local dev and hackathon demos with persistent real data!

7. **Design & Styling**:
   - Premium palette: Dark slate background (`#0B0F17` / `#111827`), vibrant neon/rose pink accents (`#F43F5E` / `#EC4899` / `#FB7185`), crisp white cards with glassmorphism touches (`rgba(255,255,255,0.05)` to `#FFFFFF`), high contrast text.
   - Mobile-first, responsive.
   - No fake landing page, no e-commerce checkout, no fake success confirmations.

8. **Deliverables**:
   - `.env.example`
   - `README.md` with Vercel deployment instructions
   - Supabase SQL migrations & seeds
   - Verified end-to-end scan-to-owner report flow
