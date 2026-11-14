# Hosted deployment

- Public site: https://pingshield-location-beacon.sunlitbeech14.chatgpt.site
- Owner inbox: https://pingshield-location-beacon.sunlitbeech14.chatgpt.site/owner
- QR generator: https://pingshield-location-beacon.sunlitbeech14.chatgpt.site/demo
- Site project: appgprj_6af7aff697b48191967542c6fe135ea4
- Source checkout: E:\ANTIGRAVITY WEBSITE\pingshield-hosted
- Source commit: c6dc37f36bfda0520c4cf2884db693474d71b82e
- Saved version: 1
- Deployment: appgdep_6af7b21932f0819187abc54d33c4553d
- Result: succeeded, public, HTTPS, D1 database connected

Owner passcode is DEMO_OWNER_PASSCODE in this local project's private .env.local. No local report data or credentials were uploaded with source. Hosted data is stored separately in D1. The existing local app remains available unchanged.

Private chat update (version 2):
- Source commit: 806226abb6db87ddd632697e67b19bb080a38de9
- Deployment: appgdep_6af7b7b373d08191b882e1176c6ab4c0 (succeeded)
- Private two-way website chat verified on the public deployment. Synthetic verification conversation deleted afterward.
- QR: https://pingshield-location-beacon.sunlitbeech14.chatgpt.site/PingShield-DEMO001-QR.png
- QR was decoded and the published file matched the local PNG exactly.
- Masked telephone integration is prepared for jambonz, but phone calls and SMS are inactive because no telecom account/carrier/number is configured.
- Setup guide: E:\ANTIGRAVITY WEBSITE\pingshield-hosted\CALLING_SETUP.md

Email notifications update (version 6):
- Site: https://pingshield-location-beacon.sunlitbeech14.chatgpt.site/s/DEMO001
- Source: 90d1168451858625bcc9871172e5319ae777b7ec
- Deployment: appgdep_6af7c0bb120c81919c6d09304654819c (succeeded, environment revision 3)
- Provider: activated FormSubmit invisible-email endpoint, using its official browser AJAX flow.
- Live browser verification observed a saved chat message and explicit provider success. The owner separately confirmed receipt of that exact website test email in Gmail.
- The owner recipient address remains a server-side secret and is absent from public config and message payloads. The public form identifier is intentionally publishable.
- Chat persistence, email status parsing, SQLite quota SQL, result-receipt permissions, and type/build checks passed.
- Synthetic chat records were removed after verification. Existing user conversations and location reports were preserved.
- Integrated alert limits: one attempt per conversation per minute and 20 per Site per ten minutes. FormSubmit also enforces its own controls.
- Shared-server requests were rate-limited; no IP rotation or SMTP credentials were used. Owner replies remain in private chat, and phone calls/SMS remain inactive.
- Details: E:\ANTIGRAVITY WEBSITE\pingshield-hosted\EMAIL_SETUP.md
