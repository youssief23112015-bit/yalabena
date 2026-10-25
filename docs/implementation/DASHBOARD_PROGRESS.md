# Dashboard Implementation Progress

## Phase 0 — Foundation (backend) — DONE

### What was done
Fixed the broken `dashboard.service.ts` (dead code, duplicate `const serviceKey`, missing `getStats`) and built the shared dashboard metrics infrastructure.

### Changed/new files
- `src/modules/dashboard/dashboard.service.ts` — fixed compilation; `getStats()` keeps legacy flat shape but is now branch-scoped, academy-time-zone aware, and computes real `teacher_utilization`
- `src/modules/dashboard/dashboard.controller.ts` — added `@Roles`, `DashboardQueryDto` validation (`@UsePipes(ValidationPipe)`), Swagger `@ApiQuery` docs, and role-specific endpoints: `/dashboard/stats`, `/dashboard/finance`, `/dashboard/sales`, `/dashboard/academic`, `/dashboard/teacher`, `/dashboard/student`, `/dashboard/hr`
- `src/modules/dashboard/dashboard.module.ts` — registered all 7 metric services + `PeriodResolver` + all needed TypeORM repositories
- `src/modules/dashboard/dashboard.dto.ts` — existing DTO with `DashboardQueryDto`, `KpiResult`, `TimeSeriesPoint`, `AlertItem`, `DashboardMetrics`, `DASHBOARD_ROLES` (all 10 roles)
- `src/modules/dashboard/metrics/base-metric.service.ts` — fixed `changePct` `toFixed()` returning string
- `src/modules/dashboard/metrics/period.util.ts` — `resolvePeriod` for today|7d|30d|month|quarter|year|custom, academy-time-zone aware, gap-free buckets
- `src/modules/dashboard/metrics/scope.util.ts` — `resolveScope` / `resolveBranchFilter` (non-super-admin locked to own branch)
- `src/modules/dashboard/metrics/trend.util.ts` — `withTrend(current, previous)` → `{value, previous_value, change_pct}` (null-safe, no div-by-zero)
- `src/modules/dashboard/metrics/cache.util.ts` — in-memory 60s TTL cache keyed by endpoint+scope+period
- `src/modules/dashboard/metrics/{period,scope,trend,admin-metric}.util.spec.ts` — 25 unit tests (branch scoping, empty period → zeros, period math)

### Pre-existing fixes (unblocked `tsc --noEmit`)
- `src/modules/auth/auth.service.ts` — added missing `ConfigService` injection (used by reset-link URL)
- `src/modules/auth/auth.service.spec.ts` — added `emailService` + `config` mocks to constructor call

### Verification
- `npx tsc --noEmit` — passes
- `npx jest src/modules/dashboard/metrics/` — 4 suites, 25 tests pass
- (Full `npm test` has 1 pre-existing failing suite `groups.service.spec.ts` — NestJS test-module `SessionRepository` DI issue, unrelated to dashboards)

### Next (Phase 0 frontend)
- Create `front/src/components/dashboard/` widgets (StatCard, AreaChartCard, BarChartCard, DonutChartCard, ProgressStat, TopList, AlertList, SectionCard, PeriodFilter, BranchSelect, LastUpdated)
- Add `front/src/locales/{en,ar}/dashboard.json` + register i18n namespace
- `useDashboardFilters` hook + Intl formatters
- Role routing refactor in `front/src/pages/Dashboard.tsx` (10 roles + generic fallback, multi-role tab switcher)
- Fix `LegacyAdminDashboard` (remove N+1, wrong labels)
