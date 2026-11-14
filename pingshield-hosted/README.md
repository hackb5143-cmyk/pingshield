# PingShield hosted edition

This is the deployment checkout for PingShield's scanner, QR page, protected owner inbox, and live-location API. It preserves the local app's design and supported demo flow. The local Next.js/SQLite source remains in `../pingshield`.

Hosting uses Vinext on Cloudflare Workers with persistent D1 storage. `.openai/hosting.json` records the Site identity and `DB` binding. Schema-only migrations are in `drizzle/` and apply during Sites deployment. No local reports, credentials, environment files, or backup files are copied into the deployment source.

Runtime secrets: `DEMO_OWNER_PASSCODE`, `OWNER_SESSION_SECRET`, `REPORT_HASH_SECRET`. They are configured through Sites environment variables. The hosted owner passcode matches `DEMO_OWNER_PASSCODE` in the local app's private `.env.local`. Neither the passcode nor a service credential is included in the frontend.

Routes:
- `/` opens `/s/DEMO001`, the public demo scanner.
- `/demo` generates the QR code for this hosted origin.
- `/owner` requires the owner passcode.
- `/api/reports` saves reports; reading requires a signed owner cookie.
- `/api/reports/:id/location` updates/stops a session using its private random capability.

GPS sharing requires consent and HTTPS. Live sessions update while the page remains active, expire after 30 minutes, and can be stopped. OpenStreetMap tiles require internet access. This is a single-owner demo tag; the public QR link is not proof that a location report is genuine.

Private two-way website messages are available from the scanner's **Send Message** card and the protected owner inbox. They do not need GPS or a phone number. Telephone calls remain inactive until a jambonz account/carrier and number are configured; see `CALLING_SETUP.md` for the prepared adapter. Website chat is not SMS.

Owner email copies use FormSubmit over HTTPS after one-time recipient activation. Runtime email configuration stays server-only. Each finder message shows its notification status separately from chat persistence. See `EMAIL_SETUP.md` for transport behavior, limits, and tests.

Download the exact hosted demo QR at `/PingShield-DEMO001-QR.png` or `/PingShield-DEMO001-QR.svg`. Regenerate these assets with `node scripts/generate-demo-qr.mjs` if the canonical hosted address changes.

Build: `npm run build`. Generate schema migrations with `npm run db:generate` only after a schema change; never edit an already-deployed migration. Follow the Sites workflow for future deployment so source and artifacts stay matched.
