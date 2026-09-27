# SpeakUp Frontend — Iterative Build Plan (Backend 100% ✔)

Backend base: `http://localhost:3000/api/v1` (global prefix `api/v1`), envelope
`{ success, data, timestamp, path }` unwrapped in `front/src/api/client.ts`.
Auth: JWT Bearer + refresh rotation, `speakup-auth` zustand persist.

## Existing frontend (already coded)
- Shell: `AppShell`, `Sidebar` (static), `Topbar` (no bell), `ProtectedRoute`, `RequireRoles`
- Pages: Dashboard, Login, Register, Leads, Students, Courses, Groups, Sessions,
  Branches, Users, Roles, PlacementTestPage (public written player), AuditLogs (page exists, no route),
  SecuritySettings (page exists, no route), NotFound (exists, no route)
- APIs: auth, leads, students, courses, groups, sessions, branches, users, roles,
  dashboard (stale), notifications, audit, files, placement (written only)

## Gap vs backend (26 controllers)
Missing UI: `attendances` roster/bulk-mark/QR check-in · `placement-tests` admin CRUD ·
`waitlists` queue/assign/threshold · `inventory` stock/issues · `finance` invoices/payments/refunds/promos/ledger ·
`enrollments` · `certificates` templates/issue/verify · `lms` modules/lessons/resources/assignments/quizzes/gradebook ·
`hr` employees/leaves/payroll · `activities` · `kb` · `reports` 8 endpoints · `chat` rooms/messages/moderation ·
`public/blogs` site · real `dashboard/stats` wiring.

## Stages (sequential, each shippable)

### Stage F1 — Foundation hardening ✅ THIS STEP
- Role-aware `Sidebar` (filters by `user.roles`, super_admin bypass)
- `Topbar` + `NotificationBell` realtime wiring
- `App.tsx`: mount AuditLogs (`/audit`), Security (`/security`), 404 (`*` → NotFound)
- Locales `en/ar`: full `nav.*` + `notifications.*` + `security.*` keys
- This doc file. No breaking changes.

### Stage F2 — Academic Ops ✅ DONE
- `src/api/attendance.ts` → roster/mark/bulk-mark/for-session/check-in/check-in-code/reports/alerts
- `src/api/placementAdmin.ts` → placement-tests admin CRUD (leadId filter)
- `src/api/waitlists.ts` → list/threshold/assign/bulk-assign/remove
- Pages: `Attendance.tsx` (roster + bulk save + QR code + absence alerts),
  `PlacementTests.tsx` (admin table + create/edit), `Waitlists.tsx` (queue + threshold +
  single/bulk assign + remove), `Notifications.tsx` (full inbox). Routes + sidebar already wired in F1.
- Verified: `npx tsc --noEmit` exit 0.

### Stage F3 — Finance & Enrollments
- `src/api/finance.ts` (invoices, payments + receipt.pdf blob, refunds + decision/process, promos, ledger, receivables)
- `src/api/enrollments.ts` + `src/api/certificates.ts` (templates, issue, auto-issue, revoke, verify, pdf blob)
- Pages: `Finance.tsx` (tabs: invoices/payments/refunds/promos/ledger), `Enrollments.tsx`, `Certificates.tsx` + public `/verify/:code`.

### Stage F4 — LMS + HR + Activities + KB
- `src/api/lms.ts`, `hr.ts`, `activities.ts`, `kb.ts`; types extended
- Pages: `Lms.tsx`, `Hr.tsx` (employees/leaves/payroll + CSV export), `Activities.tsx`, `KnowledgeBase.tsx`

### Stage F5 — Chat + Reports + Inventory + Public
- `src/api/chat.ts` (+ `lib/chatSocket.ts`), `reports.ts` (8 reports, CSV), `inventory.ts`, `public.ts`
- Pages: `Chat.tsx`, `Reports.tsx`, `Inventory.tsx`, public `Blog.tsx`/`BlogPost.tsx`
- Dashboard rewritten to `dashboardApi.getStats()` with graceful fallback to current aggregation.

### Stage F6 — Polish & Hardening
- Global error/empty/loading states, form validation parity with DTOs (`forbidNonWhitelisted`),
  RTL audit, pagination normalization, `npm run typecheck` + `vite build` green.

## Conventions (must follow)
- API layer only via `apiClient` (`@/api/client`), unwrap `response.data` (interceptor already strips envelope).
- Data fetching: `@tanstack/react-query` + `DataTable` + `useToast` + `useConfirm` pattern (see `Roles.tsx`).
- Forms: `react-hook-form` + `zod` + shadcn `Input/Label/Card/Tabs/Badge/Button`.
- RBAC: backend `@Roles` is the boundary; frontend `RequireRoles`/`ProtectedRoute` is UX only.
- i18n: every label via `t("nav.*")`; keep `en` + `ar` in sync; `document.dir` RTL handled in `AppShell`.
- File blobs (PDF/CSV): `responseType: "blob"` + object-URL download, never JSON-parse.
