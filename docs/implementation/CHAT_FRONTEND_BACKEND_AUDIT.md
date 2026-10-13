# Speak Up TMS — Chat Integration Fix & Verification Notes

**Prepared:** 9 October 2026  
**Scope:** Existing NestJS + React/Vite chat wiring, not a claim that every SRS module is complete.

## Root causes fixed

1. **Wrong chat REST base URL.** `Chat.tsx` defaulted to `/api`, while NestJS applies the global `/api/v1` prefix and Vite only proxies `/api/v1`. This caused chat REST requests to miss the backend when no absolute `VITE_API_URL` was configured. The page now uses `VITE_API_URL`, then `VITE_API_BASE_URL`, then `/api/v1`.
2. **Socket.IO transport was not proxied in development.** The Socket.IO namespace is `/chat`, but its HTTP polling/WebSocket transport path is `/socket.io`. The Vite config now proxies `/socket.io` to port 3000 with WebSocket upgrades enabled.
3. **Socket.IO transport was not proxied in the Nginx deployment.** The Nginx config now forwards `/socket.io/` to the backend and sets the upgrade headers/timeouts needed for long-lived WebSocket connections.
4. **Typing event room-ID trust.** The gateway previously relayed typing events to the supplied room ID without checking room access. It now checks room access before broadcasting.
5. **Frontend configuration documentation.** `.env.example` documents the optional absolute `VITE_CHAT_WS_URL`; same-origin setups should leave it unset and use the proxy.

## Local verification checklist

From the repository root:

```powershell
npm install
npm run build
npm test -- --runInBand
```

From `front`:

```powershell
npm install
npm run typecheck
npm run build
```

Then start the backend and frontend, sign in, visit `/chat`, accept the chat policy, and verify:

- `GET /api/v1/chat/consent` returns 200 after sign-in.
- `GET /api/v1/chat/rooms` returns the signed-in user's rooms.
- Browser DevTools Network shows `/socket.io/?EIO=4...` reaching the backend (polling and/or WebSocket upgrade), not returning `index.html`.
- Two eligible users in the same room can exchange messages in real time.
- A phone number or email is rejected, and a violation appears for moderator/admin review.
- A user who is not eligible for a room cannot join or send typing events to it.

## Environment variables

For normal local development, use `front/.env`:

```dotenv
VITE_API_BASE_URL=/api/v1
VITE_APP_NAME=Speak Up Academy TMS
```

Do not set `VITE_API_URL` unless you intend to use an absolute API base URL. If frontend and backend are on different origins, set both `VITE_API_URL` (absolute URL ending in `/api/v1`) and `VITE_CHAT_WS_URL` (absolute URL ending in `/chat`) and configure matching CORS/origin rules on the backend/reverse proxy.

## Known gaps — do not mistake these fixes for full SRS completion

- The chat upload controller explicitly documents OCR / QR decoding and PDF text extraction as not yet wired into message scanning. These are required by SRS §4.7.2 and §6.3 and need a separate implementation and tests.
- Full production verification still requires a live PostgreSQL database, migrations, real authenticated accounts, and a browser-level two-user chat test. Static patching alone cannot prove production readiness.
- Other SRS modules/integrations have their own acceptance criteria and are outside this focused chat-linking patch.
