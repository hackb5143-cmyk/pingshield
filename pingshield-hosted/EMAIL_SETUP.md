# Owner email notifications

The message flow saves each finder message in D1, then submits an email copy through FormSubmit's official browser AJAX flow. The confirmed owner's publishable invisible-email form ID hides the actual recipient address. The owner activates their destination once through FormSubmit's activation email. Sender email, GPS, an SMTP password, and an API key are not required.

Runtime values, configured through Sites:

- `EMAIL_PROVIDER=formsubmit-browser`
- `FORM_SUBMIT_FORM_ID`: the 32-character publishable form identifier provided to the owner after activation. It is intentionally exposed as the contact-form endpoint, not an authentication credential.
- `OWNER_NOTIFICATION_EMAIL`: the confirmed owner's recipient address; store as a secret. It is not embedded in browser code, public config responses, or the Git source.

The earlier server-side transport (`EMAIL_PROVIDER=formsubmit`) remains available, but the shared hosted-server path returned HTTP 429 rate-limit responses. The current implementation follows FormSubmit's documented browser AJAX integration. It respects service 429 responses and does not retry them automatically. No proxy rotation or alternate IP relay is used.

The backend claims the integrated notification attempt before returning the fixed message payload and invisible-email endpoint to the finder. The browser submits it directly to FormSubmit and posts a best-effort result receipt using its conversation capability. The receipt can only update that conversation's pending finder message within two minutes. Owner retries use the authenticated owner session.

The site's canonical `/s/DEMO001` URL is used consistently as the form URL and Referer so activation is associated with the same form. When changing the hosted domain, update `publicSiteOrigin` in `lib/email-protocol.ts` and activate the new form URL if the service requires it.

Every initial message and subsequent finder reply is eligible for an alert. Owner replies stay in private chat and do not trigger email loops. Emails contain the finder message, a short conversation reference, and the protected owner inbox link. They do not contain the finder capability, phone number, GPS coordinates, owner passcode, or session cookie. The email service processes submitted message text; FormSubmit documents retaining form submissions for 30 days. Reply through the website inbox to keep the owner's email private; replying to the notification email does not reach the finder.

## Honest delivery states

- `accepted`: the service returned an explicit boolean `true` or string `"true"`. This means accepted by the service, not verified arrival in the Gmail inbox.
- `browser_accepted`: the finder browser reported an explicit provider success. This is **not server-verified acceptance or proof of inbox delivery**. It cannot be used to authorize any other action.
- `activation_required`: the service requested activation. The owner must click **Activate Form** in their inbox.
- `failed`: an explicit rejection or invalid provider response.
- `unknown`: timeout or uncertain upstream failure; no automatic retry is performed because the service may have accepted the request.
- `rate_limited`: the chat message is saved, but email is limited to one attempt per conversation per minute and 20 attempts across the Site per ten minutes.
- `disabled`: missing/invalid email configuration. Chat continues working.

Email attempts are claimed with one atomic D1 statement to prevent duplicate dispatches in the integrated flow. A publishable contact-form endpoint can also be submitted to directly; FormSubmit's own anti-spam and rate controls therefore remain necessary. Accepted or uncertain attempts are never retried automatically. The owner can explicitly retry the last failed, activation-pending, or rate-limited finder alert from the protected inbox. Cooldowns still apply. Earlier messages are not automatically mailed after enabling this feature.

Deleting a conversation removes its message/status rows. It cannot recall an email already accepted by FormSubmit or erase copies in the recipient mailbox or service archive.

Verification:

```text
node scripts/test-email.cjs
node scripts/test-contact-http.mjs
node node_modules/typescript/bin/tsc --noEmit --incremental false
```

The unit tests mock provider responses and cover string `"false"` (which is truthy in JavaScript), activation, timeouts, quotas, privacy, and duplicate prevention. Local preview has no mail recipient configured, so synthetic HTTP chat tests do not email anyone. Live verification is performed separately with the owner's confirmed address and explicit setup messages.

Service documentation: https://formsubmit.co/documentation, https://formsubmit.co/ajax-documentation, https://formsubmit.co/help.
