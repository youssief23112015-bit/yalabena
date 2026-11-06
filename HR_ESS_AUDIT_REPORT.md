# SpeakUp TMS — Employee Self-Service (ESS) & HR Audit Report

**Phase 1 — Audit Only.** No files were modified. This report documents existing functionality, gaps, security issues, and the implementation plan for Phase 2 (backend) and Phase 3 (frontend).

---

## A. EXISTING FUNCTIONALITY

### A.1 Backend HR module

| File | Existing implementation |
|------|-------------------------|
| `src/modules/hr/hr.service.ts:1-573` | `HrService` with full CRUD: employees (create/find/findOne/update/terminate), documents (add/find/remove), availability (set/find/update/delete), leave (request/find/cancel/approve/reject), payroll (periods open/close/calculate-teachers/entries create/find/export CSV). |
| `src/modules/hr/hr.controller.ts:1-222` | `HrController` at `/hr` with `Roles` guards on every endpoint. Routes: employees, documents, availabilities, `/me`, `/my-leaves`, leaves, payroll-periods, payroll-entries, export. |
| `src/modules/hr/hr.module.ts:1-23` | `HrModule` registers `TypeOrmModule.forFeature([Employee, EmployeeDocument, TeacherAvailability, LeaveRequest, PayrollPeriod, PayrollEntry, Session, User])`, `HrController`, exports `HrService`. |
| `src/modules/hr/hr.helpers.ts:1-91` | Pure presenters: `presentEmployee` (compensation gating via `pickUser`), `presentLeave`, `presentPayrollEntry`; math helpers `round2`, `inclusiveDays`, `rangesOverlap`, `toMinutes`, `exactHours`, `payrollTotal`. |
| `src/modules/hr/dto/*.ts` | DTOs: `create-employee`, `update-employee`, `terminate-employee`, `set-availability` (+ `UpdateAvailabilityDto`), `request-leave`, `decide-leave`, `create-payroll-period`, `create-payroll-entry`, `query` (`ListEmployeesQueryDto`, `ListLeavesQueryDto`), `add-document`. |

### A.2 Entities reused by HR

| File | Entity | Key columns |
|------|--------|-------------|
| `src/shared/entities/employee.entity.ts` | `Employee` | `id`, `user_id` (unique), `employee_number` (unique), `employee_type`, `department`, `job_title`, `contract_start/end`, `salary`, `hourly_rate`, `currency`, `bank_account`, `bank_name`, `status`, `termination_date/reason`. OneToOne `User`. |
| `src/shared/entities/user.entity.ts` | `User` | `id`, `email`, `password_hash`, `first/last_name`, `avatar_url`, `language`, `status`, `two_factor_*`, `password_changed_at`, `created/updated_at`. **No `branch_id`** (branchless by design). OneToMany `UserRole`. |
| `src/shared/entities/leave-request.entity.ts` | `LeaveRequest` | `id`, `employee_id`, `type`, `start_date`, `end_date`, `days_count`, `reason`, `attachment_url`, `status`, `approved_by` (+ `approver` User), `approved_at`, `approval_note`. |
| `src/shared/entities/payroll-period.entity.ts` | `PayrollPeriod` | `id`, `name`, `start_date`, `end_date`, `status`, `closed_at`, `closed_by` (+ `closer` User). |
| `src/shared/entities/payroll-entry.entity.ts` | `PayrollEntry` | `id`, `payroll_period_id`, `employee_id`, `base_amount`, `hours_worked` (5,2), `classes_taught`, `bonus`, `deductions`, `hourly_rate`, `total_amount`, `status`, `notes`. `@Unique(['payroll_period_id','employee_id'])`. |
| `src/shared/entities/teacher-availability.entity.ts` | `TeacherAvailability` | `id`, `employee_id`, `day_of_week`, `start_time`, `end_time`, `is_available`, `note`. |
| `src/shared/entities/employee-document.entity.ts` | `EmployeeDocument` | `id`, `employee_id`, `name`, `file_url`, `document_type`, `expiry_date`. |

### A.3 Supporting infrastructure

| File | What it provides |
|------|------------------|
| `src/common/guards/roles.guard.ts` | Global `RolesGuard`: public bypass, super_admin bypass, any-of roles, wildcard permission matching (`module:action`, `module:*`, `*`). |
| `src/common/decorators/roles.decorator.ts` | `@Roles(...)`, `@Permissions(...)`, `PermissionsOptions { mode: 'any'|'all' }`. |
| `src/common/decorators/current-user.decorator.ts` | `@CurrentUser()` and `@CurrentUser('id')` (correctly extracts property). |
| `src/modules/auth/strategies/jwt.strategy.ts:1-85` | `JwtStrategy.validate()` returns `{ id, userId, email, roles, permissions, branchId: null, status }`. Pulls roles/permissions dynamically from `UserRole` → `Role` → `Permission`. Rejects tokens issued before `password_changed_at`. |
| `src/common/utils/branch-scope.ts` | `effectiveBranchFilter()` / `assertBranchAccess()` — no-op (branchless). |
| `src/database/seeds/permission.seed.ts` | Seeds `hr:view`, `hr:create`, `hr:edit`, `hr:approve`, `hr:process_payroll` (+ `branches:*` legacy). |
| `src/database/seeds/role-permission.seed.ts` | Role matrix: `hr` = `hr:view/create/edit/approve/process_payroll`; `teacher` has no `hr:*`; `academic` has no `hr:*`; `sales` has no `hr:*`; `super_admin` = `*`. |

### A.4 Frontend HR

| File | Existing implementation |
|------|-------------------------|
| `front/src/App.tsx:305-313` | Routes `/hr` (HrLayout, roles `super_admin,hr,branch_manager,teacher,finance`), `/hr/employees` (+ `:id`), `/hr/leaves`, `/hr/my`, `/hr/payroll`. |
| `front/src/pages/hr/HrLayout.tsx` | Tab bar: Employees (`HR_VIEW_ROLES`), Leaves (`HR_VIEW_ROLES`), My HR (`teacher`), Payroll (`HR_PAYROLL_ROLES`). `resolveTarget()` redirects teachers → `/hr/my`, finance → `/hr/payroll`. |
| `front/src/pages/hr/MyHrPage.tsx` | Teacher self-service: own employee record (`hrApi.myEmployee`), own leaves (`hrApi.myLeaves`), cancel leave, AvailabilityPanel, LeaveRequestDialog. |
| `front/src/pages/hr/EmployeesPage.tsx` | Employee directory: list, search, status filter, add/edit/terminate (HR only). |
| `front/src/pages/hr/EmployeeDetailsPage.tsx` | Employee detail: compensation, documents upload (via `filesApi.upload` + `hrApi.addDocument`), AvailabilityPanel. HR-only edit. |
| `front/src/pages/hr/LeavesPage.tsx` + `LeavesTable.tsx` | Leave list with status/employee filters, approve/reject (HR/branch_manager). |
| `front/src/pages/hr/PayrollPage.tsx` | Payroll periods, calculate teacher payroll, close period, CSV export. HR/finance only. |
| `front/src/components/hr/*.tsx` | `EmployeeFormDialog`, `TerminateDialog`, `LeaveDecisionDialog`, `LeaveRequestDialog`, `AvailabilityPanel`. |
| `front/src/api/hr.ts` | `hrApi`: employees, employee, create/update/terminate employee, documents, availability, leaves, myEmployee, myLeaves, requestLeave, cancelMyLeave, approve/rejectLeave, payrollPeriods, create/close/calculate, payrollEntries, createPayrollEntry, exportPayroll. |
| `front/src/types/hr.ts` | TS types: `Employee`, `EmployeeDocument`, `TeacherAvailability`, `LeaveRequest`, `PayrollPeriod`, `PayrollEntry`, `CreateEmployeeInput`, enums. |
| `front/src/lib/rbac.ts` | `HR_VIEW_ROLES`, `HR_PAYROLL_ROLES`, `useUserRoles()`, `hasAnyRole()`. |
| `front/src/store/authStore.ts` | Zustand auth: JWT/refresh token storage (local/session), `sanitizeUser` (drops `password_hash`, `two_factor_secret`), `hasPermission()` wildcard matching, auto-refresh on 401. |
| `front/src/components/layout/Sidebar.tsx` | Role-based nav; `/hr` visible to `super_admin,hr,branch_manager,teacher,finance`; target resolution per role. |
| `front/src/api/client.ts` | Axios client with Bearer token interceptor, 401 → refresh-token rotation, error normalization (`message`, `errors`, `conflicts`). |

### A.5 Related modules (for reuse — do NOT duplicate)

| Module | Relevant existing logic |
|--------|------------------------|
| `UsersService` (`src/modules/users/users.service.ts`) | User creation with bcrypt hashing, `ensureStudentProfile`/`deactivateStudentProfile` sync, `updateRole`, `remove` (refuses if Employee record exists — "terminate from HR first"). **Employee ↔ User ownership lives here.** |
| `SessionsService` (`src/modules/sessions/sessions.service.ts`) | `detectConflicts()` (group/teacher/classroom overlap), `findAll()` with teacher scoping (`group.teacher_id = userId`), `recordAttendance()`, `getAttendance()` (teacher ownership check), `cancel()`, `lockAttendance()`. |
| `GroupsService` (`src/modules/groups/groups.service.ts`) | Group CRUD, `assignTeacher`, `addStudent`, schedules. `Group.teacher_id` links group → teacher (User). |
| `LmsModule` (`src/modules/lms/lms.service.ts`, `lms.controller.ts`) | LMS modules/lessons/resources. `LmsLessonProgress` tracks per-user lesson completion (`user_id`). |
| `NotificationsModule` (`src/modules/notifications/`) | `Notification` entity (`user_id`, `type`, `title`, `body`, `data`, `action_url`, `read_at`), gateway + service. |
| `LeadsModule` + `SalesTarget` entity | `Lead.assigned_to` (User), `LeadStatus`, `converted_to_student_id`. `SalesTarget` (`agent_id`, month/year, target/achieved). **No dedicated sales service module found.** |
| `AttendanceModule` + `Attendance` entity | `Attendance` (`session_id`, `student_id`, `status`, `check_in_time`, `minutes_late`, `created_by`). Student-facing attendance, not employee. |
| `TeacherEvaluation` entity | `teacher_evaluations` (`group_id`, `student_id`, `teacher_id`, `term`, `form_data`, `overall_comment`, `is_shared_with_student`). **No HR endpoint exists.** |
| `GradebookEntry` entity | Student grades per group/category. |

---

## B. MISSING FUNCTIONALITY

### B.1 Teacher ESS (`/hr/my`) — missing

| Capability | File(s) where it should go | Problem |
|------------|---------------------------|---------|
| Assigned groups list | `HrService` + `/hr/teacher/groups` | No endpoint. Teacher cannot see which groups they teach from HR. |
| Assigned students list | `HrService` + `/hr/teacher/students` | No endpoint. |
| Teaching schedule / sessions | `HrService` + `/hr/teacher/sessions` | No endpoint. `SessionsService.findAll()` supports teacher scoping but isn't exposed through HR. |
| Teaching hours / payroll view | `HrService` + `/hr/teacher/payroll` | No employee self-view of payroll. Payroll entries only visible to HR/finance. |
| Session reports | None | No session report concept in HR. |
| LMS resources | `LmsModule` reuse | No link from `/hr/my` to LMS lessons/resources for the teacher's groups. |
| Student progress | `LmsLessonProgress` reuse | No endpoint to view students' lesson completion for teacher's groups. |
| Attendance (own sessions) | `Attendance`/`SessionsService` reuse | No teacher attendance view in HR. |
| Documents (self-upload/view) | `HrService.addDocument` is HR-only | Employee cannot upload/view own documents via `/hr/my`. |
| Performance & evaluations | `TeacherEvaluation` entity exists | No HR endpoint; evaluations not surfaced in ESS. |
| Work schedule | `TeacherAvailability` exists (availability slots) | Only availability slots, no actual taught schedule. |

### B.2 Academic ESS — missing entirely

| Capability | Problem |
|------------|---------|
| Academic responsibilities dashboard | No `/hr/academic` area. `academic` role has no `hr:*` permissions and no `/hr` route access except via `roleGate` list on `/hr` (but `academic` is NOT in the `/hr` route gate in App.tsx:306). |
| Teacher evaluations view | `TeacherEvaluation` entity exists but no controller/service endpoint. |
| Observation schedules | No endpoint. |
| Academic tasks | No endpoint. |

### B.3 Sales ESS — missing entirely

| Capability | Problem |
|------------|---------|
| Assigned leads | `Lead.assigned_to` exists; `LeadsModule` exists but no HR/ESS endpoint for "my leads". |
| Sales targets | `SalesTarget` entity exists; **no service module** for sales targets; no ESS endpoint. |
| Conversion performance | No endpoint. |
| Commission information | Not supported (no commission entity/logic). |

### B.4 Other employees (non-teacher) — missing

| Capability | Problem |
|------------|---------|
| Profile | `/hr/me` restricted to `super_admin,hr,teacher` (App.tsx:311, controller:121). Other employees cannot view own record. |
| Attendance | No employee attendance ESS. |
| Leave | `/hr/my-leaves` and `/hr/leaves` restricted to `super_admin,hr,teacher` (+ branch_manager for list). Other employees cannot request/view leave. |
| Payroll | No self-view. |
| Documents | No self-upload/view. |
| Requests | No generic request endpoint. |
| Work schedule | No endpoint. |

---

## C. INCOMPLETE FUNCTIONALITY

### C.1 Backend — ownership/actor gaps

| File | Lines | Problem |
|------|-------|---------|
| `src/modules/hr/hr.controller.ts` | 54-59 `updateEmployee` | `@CurrentUser() user` is **not passed** to `service.updateEmployee(id, dto)`. Service signature has no `actor` param. No branch/ownership validation on update (beyond Roles guard). |
| `src/modules/hr/hr.controller.ts` | 61-66 `terminateEmployee` | `user` not passed. No actor/scope validation. |
| `src/modules/hr/hr.controller.ts` | 69-74 `addDocument` | `user` not passed. Service `addDocument(dto)` has **no ownership check** — any HR user can add a document to any employee. |
| `src/modules/hr/hr.controller.ts` | 83-88 `removeDocument` | `user` not passed. No ownership check — any HR user can delete any document. |
| `src/modules/hr/hr.controller.ts` | 209-214 `createPayrollEntry` | `user` not passed. No actor validation. |
| `src/modules/hr/hr.controller.ts` | 171-176 `createPeriod` | `user` not passed. |
| `src/modules/hr/hr.service.ts` | 152 `updateEmployee(id, dto)` | No `actor` parameter — cannot enforce branch scoping or "self cannot edit own compensation". |
| `src/modules/hr/hr.service.ts` | 195 `addDocument(dto)` | No `actor`, no `assertEmployeeInScope`. |
| `src/modules/hr/hr.service.ts` | 216 `removeDocument(id)` | No `actor`, no `assertEmployeeInScope`. |
| `src/modules/hr/hr.service.ts` | 418 `createPeriod(dto)` | No `actor`. |
| `src/modules/hr/hr.service.ts` | 527 `createPayrollEntry(dto)` | No `actor`. |

### C.2 Frontend — incomplete

| File | Problem |
|------|---------|
| `front/src/pages/hr/MyHrPage.tsx` | Only shows own employee record, leaves, availability. No groups, students, sessions, teaching hours, payroll, documents, LMS, evaluations. |
| `front/src/api/hr.ts` | Missing endpoints for teacher groups/sessions/payroll-self, academic, sales. |
| `front/src/types/hr.ts` | Missing types for `TeacherSchedule`, `TeacherPayrollView`, `Evaluation`, `SalesTarget`, `Lead`. |
| `front/src/lib/rbac.ts` | `HR_VIEW_ROLES` / `HR_PAYROLL_ROLES` only. No `ACADEMIC_HR_ROLES`, `SALES_HR_ROLES`, `EMPLOYEE_SELF_ROLES`. |
| `front/src/App.tsx:306` | `/hr` route gate excludes `academic` and `sales` and non-teacher employees. `/hr/me` gate excludes non-teacher employees. |

### C.3 Data / seed gaps

| File | Problem |
|------|---------|
| `src/database/seeds/role-permission.seed.ts` | `teacher` role lacks `hr:view` (needed for `/hr/my`). `academic` and `sales` lack any `hr:*`. No `employee:self` style permission. |
| `src/database/seeds/*.sql` | Seed data may not include employee records for all roles, or payroll periods/entries for testing ESS. |

---

## D. SECURITY VULNERABILITIES

### D.1 IDOR / ownership validation gaps

| File | Lines | Issue |
|------|-------|-------|
| `src/modules/hr/hr.controller.ts` | 54-59 | `updateEmployee` doesn't pass `actor`; service doesn't check ownership/branch. An HR user can edit any employee record (including compensation) — intended for HR but no "self-protection" (e.g., HR editing their own record). |
| `src/modules/hr/hr.controller.ts` | 69-74, 83-88 | `addDocument`/`removeDocument` have **no actor/ownership check**. Any HR user can add/delete documents for any employee. No validation that the document `file_url` is under an allowed upload path. |
| `src/modules/hr/hr.controller.ts` | 209-214 | `createPayrollEntry` — no actor. Any HR/finance user can create payroll entries for any employee/period. |
| `front/src/pages/hr/EmployeeDetailsPage.tsx` | 12, 14 | Documents listed/uploaded; `isHr` gates upload UI, but backend is the only enforcement. No frontend ownership check (acceptable if backend enforced). |

### D.2 Payroll privacy

| File | Lines | Issue |
|------|-------|-------|
| `src/modules/hr/hr.helpers.ts` | 64-73 `presentEmployee` | Compensation fields (`salary`, `hourly_rate`, `bank_account`, `bank_name`, `currency`) deleted unless `canSeeCompensation`. Correctly gated. |
| `src/modules/hr/hr.controller.ts` | 216-221 `findPayrollEntries` | `@Roles('super_admin,hr,finance')` — payroll entries reveal all employees' compensation. Correctly gated but no employee self-view exists (so employees can't verify their own pay). |
| `src/modules/hr/hr.service.ts` | 453-502 `calculateTeacherPayroll` | Iterates **all active employees**, including non-teachers, creating payroll entries from session hours keyed on `grp.teacher_id = emp.user_id`. Non-teacher employees get zero-session entries with base salary. Intended per SRS 4.10, but worth noting it touches every active employee. |

### D.3 JWT identity / branch isolation

| File | Lines | Issue |
|------|-------|-------|
| `src/modules/auth/strategies/jwt.strategy.ts` | 81 | `branchId: null` is **hardcoded**. `User` entity has no `branch_id`. Branch isolation is disabled by design ("branchless"), but if branches are reintroduced, `branchScope()` in `HrService` returns `null` for everyone (line 55-58) and `effectiveBranchFilter()` returns `undefined` — meaning no branch filtering would occur. |
| `src/modules/hr/hr.service.ts` | 55-58 `branchScope()` | Returns `actor.branchId` for non-admin, but JWT always provides `null`, so branch scoping is effectively dead code. |

### D.4 Self-service update restrictions

| File | Lines | Issue |
|------|-------|-------|
| `src/modules/hr/hr.service.ts` | 152-180 `updateEmployee` | Whitelist prevents `user_id`/`id` changes, but there is **no endpoint for an employee to update their own profile** (phone, etc.). UsersService handles user profile but is gated to admin roles (`/users`). No `PATCH /hr/me/profile`. |
| `src/modules/hr/hr.controller.ts` | 120-125 `getMyEmployee` | `@Roles('super_admin,hr,teacher')` — blocks non-teacher employees from viewing own record. |

### D.5 Document access

| File | Lines | Issue |
|------|-------|-------|
| `src/modules/hr/hr.service.ts` | 209-214 `findDocuments` | Calls `assertEmployeeInScope` (branch check, no-op). No check that the requesting actor is the document's owner or HR. HR-only via Roles guard, but no "employee can view own documents". |
| `src/shared/entities/employee-document.entity.ts` | `file_url` | Stored URL could point to external storage; no validation that URL is from the platform's upload endpoint (`filesApi.upload`). |

---

## E. BACKEND CHANGES REQUIRED (Phase 2)

### E.1 New service methods (HrService)

| Method | Purpose | Actor/roles |
|--------|---------|-------------|
| `getMyProfile(userId)` | Return own employee record with `presentEmployee(emp, false)` (no compensation). | Any employee |
| `updateMyProfile(userId, dto)` | Update own limited fields (phone via User, non-compensation job/department). | Any employee |
| `getMyGroups(userId)` | Groups where `group.teacher_id = userId` (teacher) — reuse `GroupsService`/`Group` entity. | Teacher |
| `getMyStudents(userId)` | Students in teacher's groups via `group_students`/`enrollments`. | Teacher |
| `getMySessions(userId)` | Sessions of teacher's groups (date range filter). Reuse `SessionsService.findAll` teacher scoping. | Teacher |
| `getMyTeachingHours(periodId, userId)` | Read own payroll entry for a period (no calculation). | Teacher |
| `getMyPayrollEntries(userId)` | Own payroll entries across periods. | Any employee |
| `getMyDocuments(userId)` | Own documents. | Any employee |
| `addMyDocument(userId, dto)` | Employee uploads own document (file_url from files service). | Any employee |
| `requestLeave` — already exists (self) | Keep. | Any employee |
| `getMyEvaluations(userId)` | `TeacherEvaluation` where `teacher_id = userId`. | Teacher |
| `getMyAvailability` — exists | Keep. | Teacher |

### E.2 Controller changes

| Controller | Change |
|------------|--------|
| `HrController` | Add `GET /hr/me/profile`, `PATCH /hr/me/profile`, `GET /hr/me/groups`, `GET /hr/me/students`, `GET /hr/me/sessions`, `GET /hr/me/payroll`, `GET /hr/me/documents`, `POST /hr/me/documents`, `GET /hr/me/evaluations`, `GET /hr/me/attendance`. |
| `HrController` | Pass `toActor(user)` to `updateEmployee`, `terminateEmployee`, `addDocument`, `removeDocument`, `createPeriod`, `createPayrollEntry` and add `actor` params to service methods for ownership/branch checks. |
| `HrController` | Expand `@Roles` on `/hr/me` to include all employee roles (or create a separate `EmployeeSelf` guard). |

### E.3 New DTOs

| DTO | Fields |
|-----|--------|
| `UpdateMyProfileDto` | `phone?`, `job_title?`, `department?` (non-compensation) |
| `AddMyDocumentDto` | `name`, `file_url`, `document_type`, `expiry_date?` |
| `MyPayrollQueryDto` | `period_id?` |

### E.4 Permission/seed changes

| File | Change |
|------|--------|
| `src/database/seeds/permission.seed.ts` | Add `hr:self:view`, `hr:self:edit`, `hr:self:documents`, `hr:self:leave` (or extend `hr:view` to include self). |
| `src/database/seeds/role-permission.seed.ts` | Grant `teacher` → `hr:self:*`; `academic` → `hr:view` (for academic oversight); `sales` → `hr:self:*`; add `employee:self` role-group if needed. |

---

## F. FRONTEND CHANGES REQUIRED (Phase 3)

### F.1 New pages / tabs

| Page | Route | Roles | Purpose |
|------|-------|-------|---------|
| `MyProfilePage` | `/hr/me/profile` | All employees | View/edit own profile (non-compensation). |
| `MyGroupsPage` | `/hr/me/groups` | Teacher | Assigned groups + students. |
| `MySchedulePage` | `/hr/me/sessions` | Teacher | Teaching schedule/sessions. |
| `MyPayrollPage` | `/hr/me/payroll` | All employees | Own payroll entries & periods. |
| `MyDocumentsPage` | `/hr/me/documents` | All employees | View + upload own documents. |
| `MyEvaluationsPage` | `/hr/me/evaluations` | Teacher | Teacher evaluations (shared ones). |
| `SalesDashboardPage` | `/hr/sales` | Sales | Assigned leads, targets, conversions. |
| `AcademicDashboardPage` | `/hr/academic` | Academic | Teacher evaluations, observation schedules. |

### F.2 API service additions (`front/src/api/hr.ts`)

| Function | Endpoint |
|----------|----------|
| `myProfile()` | `GET /hr/me/profile` |
| `updateMyProfile(dto)` | `PATCH /hr/me/profile` |
| `myGroups()` | `GET /hr/me/groups` |
| `myStudents()` | `GET /hr/me/students` |
| `mySessions(params)` | `GET /hr/me/sessions` |
| `myPayroll(params)` | `GET /hr/me/payroll` |
| `myDocuments()` | `GET /hr/me/documents` |
| `addMyDocument(input)` | `POST /hr/me/documents` |
| `myEvaluations()` | `GET /hr/me/evaluations` |

### F.3 Types (`front/src/types/hr.ts`)

Add: `TeacherGroup`, `TeacherStudent`, `TeacherSession`, `MyPayrollEntry`, `MyDocument`, `Evaluation`, `SalesTarget`, `Lead`.

### F.4 RBAC (`front/src/lib/rbac.ts`)

Add: `EMPLOYEE_SELF_ROLES = ['super_admin','hr','teacher','academic','sales','branch_manager','finance']`, `ACADEMIC_HR_ROLES`, `SALES_HR_ROLES`, `hasSelfRole()`.

### F.5 Routing (`front/src/App.tsx`)

- Expand `/hr` route gate to include all employee roles (or split into `/hr/admin` and `/hr/self`).
- Add `/hr/me/*` sub-routes under `MyHrPage` layout or a dedicated `SelfHrLayout`.
- Add `/hr/sales` and `/hr/academic` routes.

### F.6 Sidebar (`front/src/components/layout/Sidebar.tsx`)

Add nav items for `/hr/me/*`, `/hr/sales`, `/hr/academic` with appropriate role gates. `resolveTarget()` should route teachers to `/hr/my`, sales to `/hr/sales`, academic to `/hr/academic`.

### F.7 Components

- `MyProfileForm`, `DocumentUpload` (reuse `filesApi.upload`), `PayrollEntryRow`, `EvaluationCard`, `SalesTargetCard`, `LeadList`.

---

## G. DATABASE CHANGES REQUIRED

**No new tables required.** All needed tables exist: `employees`, `users`, `user_roles`, `roles`, `permissions`, `groups`, `group_students`, `enrollments`, `sessions`, `leave_requests`, `payroll_periods`, `payroll_entries`, `employee_documents`, `teacher_availabilities`, `teacher_evaluations`, `lms_lesson_progress`, `leads`, `sales_targets`, `attendances`, `notifications`.

**Existing triggers/functions to reuse:** `trg_employees_updated_at`, `trg_users_updated_at`, `trg_leave_requests_updated_at` (if exists), `trg_payroll_entries_updated_at`, `trg_teacher_evaluations_updated_at`, `update_updated_at_column()`.

**Possible additions (only if needed):**
- A DB trigger/function to prevent employees from editing their own compensation fields (defense in depth), since `updateEmployee` whitelist is application-level only.
- Index on `groups(teacher_id)` and `sessions(group_id, date)` for teacher schedule queries (check existing indexes first).

---

## H. EXISTING MODULES THAT SHOULD BE REUSED (DO NOT DUPLICATE)

| Module | What to reuse | Where |
|--------|--------------|-------|
| `UsersService` (`src/modules/users/users.service.ts`) | User profile update, password change, `updateRole`, `remove` (employee-refusal check). | Profile/password ESS |
| `SessionsService` (`src/modules/sessions/sessions.service.ts`) | `findAll()` teacher scoping (`group.teacher_id`), `getAttendance()`, `recordAttendance()`. | Teacher schedule/attendance |
| `GroupsService` (`src/modules/groups/groups.service.ts`) | Group queries by teacher. | Teacher groups/students |
| `LmsModule` (`src/modules/lms/`) | `LmsLesson`, `LmsResource`, `LmsLessonProgress(user_id)`. | Teacher LMS resources & student progress |
| `NotificationsModule` (`src/modules/notifications/`) | `Notification` entity + service. | Leave approval notifications |
| `Files/upload` (`front/src/api/files.ts`) | `filesApi.upload(kind='hr')`. | Document upload |
| `Payroll calculation` (`HrService.calculateTeacherPayroll`) | Reuse for HR-side calculation; add read-only self-view. | Teacher payroll self-view |
| `TeacherEvaluation` entity | Read-only evaluations for teacher. | Performance tab |

**Do NOT duplicate:** user creation/password hashing (UsersService), session conflict detection (SessionsService), attendance recording (SessionsService.recordAttendance), lead/sales logic (LeadsModule), LMS content creation (LmsModule).

---

## I. RECOMMENDED IMPLEMENTATION SEQUENCE

### Phase 2 — Backend (recommended order)

1. **Actor propagation:** Add `actor: HrActor` to `updateEmployee`, `terminateEmployee`, `addDocument`, `removeDocument`, `createPeriod`, `createPayrollEntry`; pass `toActor(user)` from controller. Add `assertEmployeeInScope` ownership checks where missing (documents).
2. **Self-service endpoints:** `getMyProfile`, `updateMyProfile`, `getMyGroups`, `getMyStudents`, `getMySessions`, `getMyPayrollEntries`, `getMyDocuments`, `addMyDocument`, `getMyEvaluations`.
3. **Controllers + routes:** Add `/hr/me/*` routes; expand `@Roles` on `/hr/me`.
4. **Permissions/seeds:** Add `hr:self:*` permissions; grant to `teacher`, `sales`, `academic`, `branch_manager`, `finance` as appropriate.
5. **Tests:** Add spec coverage for new self-service methods and ownership guards.

### Phase 3 — Frontend (recommended order)

1. **Types + API:** Add TS types and `hrApi` methods for self-service endpoints.
2. **RBAC:** Add role constants and `hasSelfRole()`/`hasAcademicRole()`/`hasSalesRole()`.
3. **MyHrPage expansion:** Add profile, groups/students, sessions, payroll, documents, evaluations tabs to `/hr/my`.
4. **New pages:** `MyProfilePage`, `MyPayrollPage`, `MyDocumentsPage`, `MyEvaluationsPage`, `SalesDashboardPage`, `AcademicDashboardPage`.
5. **Routing + Sidebar:** Register routes; add nav items; update `resolveTarget()`.
6. **Components:** `DocumentUpload` (reuse `filesApi.upload`), payroll/evaluation display components.
7. **Tests:** Frontend component/route tests.

---

**Deliverable status:** Phase 1 audit complete. No files modified. Ready for Phase 2 (backend implementation) upon user approval.
