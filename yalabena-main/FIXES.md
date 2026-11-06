# SpeakUp RBAC / Permissions Fix

This package contains **only the files that need to be added/replaced**. It is not the full project.

## 1. Backend: replace files at the exact paths

Copy the files from this ZIP into the project root, preserving the folder structure. When Windows asks whether to replace an existing file, choose **Replace**.

### Authentication / permissions core
- `src/modules/auth/strategies/jwt.strategy.ts`
- `src/modules/auth/auth.service.ts`
- `src/database/seeds/permission.seed.ts`
- `src/database/seeds/role-permission.seed.ts` **(new file)**
- `src/database/seeds/main.seed.ts`

### Roles management
- `src/modules/roles/roles.module.ts`
- `src/modules/roles/roles.service.ts`
- `src/modules/roles/roles.controller.ts`

### Backend RBAC on modules that were previously open
- `src/modules/leads/leads.controller.ts`
- `src/modules/students/students.controller.ts`
- `src/modules/attendance/attendance.controller.ts`
- `src/modules/groups/groups.controller.ts`
- `src/modules/courses/courses.controller.ts`
- `src/modules/sessions/sessions.controller.ts`
- `src/modules/waitlists/waitlists.controller.ts`
- `src/modules/inventory/inventory.controller.ts`
- `src/modules/classrooms/classrooms.controller.ts`
- `src/modules/placement-tests/placement-tests.controller.ts`
- `src/modules/hr/hr.controller.ts`
- `src/modules/chat/chat.controller.ts`
- `src/modules/integrations/integrations.controller.ts`

### Frontend auth / role protection
- `front/src/hooks/use-auth.ts`
- `front/src/store/authStore.ts`
- `front/src/types/index.ts`
- `front/src/api/roles.ts`
- `front/src/components/common/RequireRoles.tsx` **(new file)**
- `front/src/routes/ProtectedRoute.tsx`
- `front/src/routes/index.tsx`
- `front/src/components/layout/Sidebar.tsx`
- `front/src/App.tsx`
- `front/src/pages/Roles.tsx`

## 2. Important backend fix

The old JWT strategy loaded roles and permissions from the database, then returned `payload.roles` / `payload.permissions` instead. That means permissions were commonly empty, and the user's real branch was not returned to the request context.

The replacement now returns fresh DB values on every authenticated request and includes both `id` and `userId` so existing controllers using `CurrentUser('id')` and controllers using `userId` both work.

## 3. Seed the permissions and role-permission mapping

From the backend project root run:

```bash
npm run seed
```

The seed order is now:

1. permissions
2. roles
3. role -> permission assignments
4. settings
5. branch
6. super user

Do not skip the seed step after copying the files. The new `role-permissions.seed.ts` is what actually links each role to the permissions stored in the database.

## 4. What each main role can access after this patch

- `super_admin`: bypasses RBAC checks and receives all seeded permissions.
- `branch_manager`: branch operations, users (within controller branch checks), CRM, groups, attendance oversight, finance view/create, inventory, reports, etc.
- `sales`: CRM/lead workflow, sales, placement-test viewing, waitlist assignment, selected inventory/activities/chat access.
- `finance`: finance operations plus read-only supporting data such as certificates/CRM/inventory/reports.
- `academic`: placement tests, groups, attendance, LMS authoring/grading, certificates, reports.
- `teacher`: attendance, LMS teaching/grading, groups/sessions, chat, knowledge base, reports.
- `student`: LMS read access, chat, activities, knowledge base. Group/session admin endpoints are not exposed to students because their current services do not apply student-specific filtering.
- `moderator`: chat moderation/violation tools only.
- `hr`: employee/leave/payroll-related backend routes plus relevant read access.
- `auditor`: read-only permissions where permission records are used.

## 5. Notes

The backend controller roles are the primary security boundary. The frontend role checks only control navigation and route UX; they must not be treated as the security mechanism by themselves.

Branch ownership and student-self-service filtering are partly enforced in services/controllers already present in the project. This patch fixes the missing RBAC layer but does not invent new data-filtering rules that are not implemented by the existing service layer.
