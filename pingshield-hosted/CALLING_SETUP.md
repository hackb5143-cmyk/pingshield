# Masked telephone calls

The exact public demo is https://pingshield-location-beacon.sunlitbeech14.chatgpt.site/s/DEMO001. Its QR downloads are `/PingShield-DEMO001-QR.png` and `/PingShield-DEMO001-QR.svg`.

Private website chat works without telephone infrastructure. Finder access uses a random, per-conversation capability, lasts 24 hours, and is stored in the finder's current browser session. Messages are stored in D1 and poll every four seconds while visible. The owner reads and replies through the protected inbox. No phone number or GPS is required. This is not SMS delivery or end-to-end encrypted messaging; the server stores messages for the conversation and the owner can delete them.

Phone calls are currently **inactive** because no calling account or carrier connection exists. The code does not pretend to ring or send SMS. It fails closed when configuration is absent. Open-source jambonz can supply the call-control server, but a SIP carrier and a valid service number are still required to reach normal phones. Carrier charges and country-specific availability are separate from the open-source software.

## Enable the prepared jambonz adapter

1. Provision your own jambonz server or account and configure an outbound phone carrier. Use a service number you are authorized to present as caller ID. Official documentation: https://docs.jambonz.org/reference/rest-call-control/calls/create-call/ and https://docs.jambonz.org/verbs/verbs/dial.
2. Configure these server-side runtime values through the Site's environment settings. Do not add them to source code or send secrets in chat:
   - `JAMBONZ_API_BASE`: your HTTPS REST base, without `/v1/Accounts/...`; the adapter appends that path. The jambonz documentation lists both hosted and self-hosted REST base options, so use the base shown by your own account/server.
   - `JAMBONZ_ACCOUNT_SID`: the account UUID.
   - `JAMBONZ_API_KEY`: the private bearer credential.
   - `MASKED_CALL_NUMBER`: the provisioned service number in E.164 format.
   - `OWNER_PHONE_NUMBER`: the private owner's phone in E.164 format.
3. Redeploy the saved Site version to apply runtime changes. The scanner will offer callback requests only when all values are configured and structurally valid. The runtime check does not prove carrier provisioning; place an authorized test call to confirm it.
4. The finder enters their own number and agrees to the callback. That number is encrypted with AES-256-GCM before D1 storage; only its last four digits are shown in the owner UI. The owner must approve the request in the protected inbox before any phone is dialed.
5. The bridge calls the finder with the provisioned service caller ID. After answer, an authenticated webhook directs jambonz to dial the private owner with the same service caller ID. No raw owner number is sent to the scanner or owner web UI. The telecom provider necessarily processes both destinations.

Calls have a three-minute maximum. A thread can initiate one approved attempt; duplicate approval does not originate another call. Uncertain provider responses are marked `dispatch_unknown` and block new calls until the operator checks the provider, preventing blind retries that could create duplicate charges. No call recording is requested.

The adapter uses per-conversation HTTP Basic credentials for provider hooks and validates call SIDs. Provider credentials and owner number never belong in a browser bundle. Hook URLs are HTTPS `/api/telephony/:conversationId/answer` and `/api/telephony/:conversationId/status` and are supplied automatically in call creation. D1 stores only the encrypted finder callback number, its masked hint, call status, and provider call ID.

This integration has protocol and mocked-provider tests, but **no real PSTN call has been placed**. SMS needs a separately provisioned messaging carrier/integration; website chat does not send texts to a SIM.
