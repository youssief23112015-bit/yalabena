# SRS v1.0 — Scope conflicts requiring owner sign-off

This note preserves the original SRS and identifies contradictions instead of silently changing contractual requirements.

## Recommended canonical interpretation

Use Sections 2.1, 2.3, 5, and 13 together as the controlling scope: AI features, WhatsApp/SMS, Meta lead sync, external CRM sync, call-center/VoIP, native mobile apps, e-invoicing and payment gateways other than EasyKash are excluded from this phase. Zoom, OnMeet, and EasyKash are the only whitelisted third-party integrations.

## Conflicts to resolve in the source SRS

1. **Section 2.2 is labelled “In-Scope” but lists AI, WhatsApp Business, SMS Misr, Meta Ads and call-center integrations.** These conflict with the purpose statement and Section 13's explicit exclusions. Move them to Out of Scope / Future Phase.
2. **Section 4.8 mentions e-invoice, Mada, Fawry and Sadad.** Section 13 excludes e-invoicing and all gateways except EasyKash. Remove these items from v1 acceptance criteria unless the owner approves a formal scope change.
3. **Approval authority is inconsistent.** Section 5 says written approval from Samir, while the document control/sign-off lists other owners and roles. Confirm the authorized approver and use one name/role throughout.
4. **Retention policy is unresolved.** Section 6.6 says X months, with 24 months as a default. The owner/legal reviewer should approve the final retention duration before production.
5. **“Automated attendance” and “download protection” need measurable definitions.** Specify what source triggers automated attendance and what content protection is technically required; watermarking alone cannot guarantee that a downloaded file cannot be copied.
6. **Chat moderation expectations need staged acceptance.** Core text detection and audit logging can be tested independently. OCR, QR decoding, and PDF text extraction are explicitly not wired into the current chat upload controller and should remain open requirements until implemented and tested.

## Proposed acceptance gate for the chat module

- REST room list/history, consent, and message endpoints use the `/api/v1/chat` prefix and return usable responses to the frontend.
- Socket.IO polling/WebSocket traffic reaches the backend via `/socket.io/`, with namespace `/chat` and a valid JWT.
- Room membership is checked for joining, sending messages, marking read, and typing broadcasts.
- Blocked contact-sharing attempts are rejected before message persistence and recorded for moderation.
- OCR/QR/PDF scanning is not marked complete until test fixtures demonstrate both detection and false-positive behavior.
- Two-user browser test, moderator review test, and clean frontend/backend builds are attached as evidence before UAT.
