# PingShield location backend

The scanner at `/s/DEMO001` follows the uploaded pink-and-blue design. It now uses a real backend for recovery messages, GPS pins, manual pickup landmarks, and optional live location. `/owner` is a passcode-protected inbox with an embedded Leaflet/OpenStreetMap map, a GPS accuracy circle, last-received time, and automatic refresh every five seconds while visible.

## Run locally

From this directory:

```powershell
npm install
npm run setup:location
npm run dev -- --port 3100
```

Open `http://localhost:3100/demo` for the QR code, `http://localhost:3100/s/DEMO001` for the scanner, or `http://localhost:3100/owner` for the inbox. Use `DEMO_OWNER_PASSCODE` from `.env.local` to sign in. The setup script generates random owner/session secrets without printing them and preserves existing values. Do not share or commit `.env.local`.

SQLite is already configured for this checkout. Reports are durable in `data/recovery.db` (plus SQLite WAL/SHM files). This is separate from the older app's `data/pingshield.db`. To move data, stop the server first and back up the database together with its sidecar files. Build output uses `.next-location` so previous build directories remain available.

## Location flow

1. Tap **Yes, Share Location** and allow browser location permission. A real GPS pin and accuracy estimate appear in the preview; no report is saved yet.
2. Choose whether the item is with you or left at a safe spot. Add a pickup landmark, message, or contact information if helpful. If GPS is denied, unsupported, or times out, enter a manual landmark instead.
3. Optionally select **Share live location for up to 30 minutes** when the item is with you. Press **Confirm** to save the report.
4. Open the owner inbox to see the received coordinates. Live sharing sends fresh GPS fixes approximately every five seconds while the scanner remains open. The map follows received coordinates. **Stop live sharing** stops the GPS watcher and revokes future updates for that session.

Live location means the consenting finder's browser location, not hardware tracking of the tagged item. It requires HTTPS on deployed sites (localhost works), browser permission, and an active page. Mobile browsers may suspend background pages; the owner sees a waiting status after 20 seconds without an update. Fixes older than 30 seconds are not re-sent as fresh positions. Sessions expire on the server after 30 minutes even if the page crashes. Closing/navigating away makes a best-effort stop request. Stopping retains the last saved pickup location in the inbox.

The map uses the installed open-source Leaflet library and OpenStreetMap standard tiles, without a Google API key. Internet access is needed for tiles. Attribution is shown; if tiles fail, coordinates and the Google Maps directions link remain usable. Standard OSM tiles are a shared, best-effort service: follow <https://operations.osmfoundation.org/policies/tiles/> and use a suitable tile hosting service or self-hosting for significant production traffic. Google Maps embedding can be added with a restricted API key and billing-enabled Google Cloud project; the existing external directions links need no app key.

The call card explains that a telephone bridge is not configured for this demo tag. It does not claim a call was dispatched. Recovery messages are saved to the owner inbox; SMS/push delivery is not configured.

## Backend and access

- `POST /api/reports`: validates the DEMO001 tag, message, coordinate ranges/pairs, and GPS or manual location. Saving a live report returns a random update capability once. Only its SHA-256 hash is stored.
- `PATCH /api/reports/:id/location`: requires the capability as `Authorization: Bearer ...`; validates each GPS fix and rejects stopped, expired, invalid, or too-frequent updates (minimum three seconds).
- `DELETE /api/reports/:id/location`: requires that capability; stopping is idempotent.
- `GET /api/reports`: requires a signed HTTP-only owner cookie. It returns only DEMO001 reports, excludes capability hashes and requester identifiers, and disables caching.
- Public report creation is limited atomically to six reports per hashed source IP per ten minutes. A honeypot and same-origin checks reject common unwanted submissions. Configure your hosting proxy to supply a trustworthy client-IP header.

This remains a single-owner, single-tag demo. Do not issue DEMO001 as a private tag to multiple real owners; a multi-owner release needs per-account authentication and ownership-scoped tags. Public scanner access itself cannot prove that a finder has the item or that coordinates are genuine.

## Deploy

For a Node host with persistent disk: set `REPORT_STORAGE=sqlite`, `REPORTS_DATABASE_PATH` to a persistent file path, and distinct strong secrets from `.env.example`. Run `npm run build` and `npm run start`. Use one server instance for this SQLite configuration, retain the disk across deployments, and serve over HTTPS.

For Vercel/serverless hosting: use Supabase, not ephemeral SQLite. Run these migrations in order in your Supabase SQL Editor:

1. `supabase/migrations/20260214_pingshield_init.sql`
2. `supabase/migrations/20261114_live_locations.sql`

Set `REPORT_STORAGE=supabase`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DEMO_OWNER_PASSCODE`, `OWNER_SESSION_SECRET`, and `REPORT_HASH_SECRET` on the host. Keep the service-role key server-only. Row-level security and service-role-only SQL functions protect reads and updates. Database errors do not fall back to another storage provider or display a false success. Supabase functions use row locks/advisory locks to enforce session state and submission limits across instances.

The current checkout is configured and verified locally. No production host or Supabase project has been provisioned or deployed by these changes. The existing Next.js/SQLite runtime needs Node hosting; a static-only upload will not run this backend.

## Verification

```powershell
npm test
npm run test:location
npm run build
# With the local SQLite server running on port 3100:
npm run test:location:http
```

The HTTP test uses synthetic coordinates and the existing local owner secret; it removes only reports it creates. `LOCATION_TEST_ORIGIN` can select another localhost port. `tests/location-preview.cjs` temporarily inserts a clearly labeled public-landmark pin for visual QA, moves it after ten seconds, and removes it after three minutes; it never reads device GPS. Browser QA verified manual pickup submission, owner sign-in, and actual map tile rendering with synthetic coordinates. Physical GPS movement and the Supabase migration were not tested against an external device/database.

Before-change source/configuration backups are in `../pingshield-backups/location-20261114`. They include the previous local environment file; keep this directory private and outside deployment bundles. Browser verification images are in `verification/`.
