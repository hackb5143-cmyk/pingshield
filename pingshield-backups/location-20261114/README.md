# PingShield MVP

Next.js App Router, TypeScript, Tailwind and Supabase demo for recovering one fictional item. Finders can report without signing in. The owner inbox requires a server verified passcode. No owner phone number is stored or exposed.

## Set up

1. Create a Supabase project. In its SQL Editor, run `supabase/migrations/20260214_pingshield_init.sql`. This creates `demo_tags`, `recovery_reports`, the atomic submission function, access controls, and fictional DEMO001 item data.
2. Copy `.env.example` to `.env.local`. Set the project URL, **service role** key, a private owner passcode, and two random secrets. Never prefix the service role key with `NEXT_PUBLIC_` or commit `.env.local`.
3. Run `npm install` and `npm run dev` in this directory. Open `http://localhost:3000/demo`.

Supabase credentials are required. If the database is unavailable, the app returns an error and does not claim a report was saved.

## Verify the full flow

1. Open `/demo`, scan its QR code or click **Open scanner**.
2. At `/s/DEMO001`, enter a recovery message. Tap the GPS button to grant browser location access, or enter a manual pickup location. Submit.
3. A saved report ID appears only after Supabase commits the report.
4. Open `/owner`, enter `DEMO_OWNER_PASSCODE`, and view the report. GPS reports include a Google Maps directions link. **Refresh** fetches the latest saved reports.

Geolocation needs HTTPS on a deployed site (localhost works for local testing). Emergency links `tel:112` and `tel:1033` open the device dialer.

## Access and spam protection

- Browser roles have no direct table permissions. Only server routes use the Supabase service role key.
- The public POST validates content, tag, paired coordinate ranges, and a GPS or manual location. A honeypot rejects automated form fills.
- The database function uses an advisory lock and limits each hashed source IP to six reports per ten minutes across server instances. Raw IPs are not stored. Rotate `REPORT_HASH_SECRET` if needed.
- `/api/reports` GET and the `/owner` server page require a signed, HTTP only owner cookie. The owner passcode and signing secret remain server side. The demo owner sees only DEMO001 reports.

## Deploy to Vercel

1. Import this `pingshield` directory as the Vercel project root.
2. Add the five variables from `.env.example` to Vercel Environment Variables. Set `NEXT_PUBLIC_SUPABASE_URL` to the same Supabase project where you applied the migration. Set a strong passcode and secrets; keep the service role key server side.
3. Deploy with the Next.js preset. Open the deployed `/demo` and scan its QR code. It encodes the current site origin, so it works with the deployed hostname.
4. Complete the full flow above on the deployed site to confirm that the production database and environment variables match.

Run `npm run build` before deployment. This repository contains an older general purpose app alongside the MVP routes; the supported MVP entry points are `/demo`, `/s/DEMO001`, `/owner`, and `/api/reports`.
