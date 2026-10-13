# YALABENA — HR Complete Patch

## 1. Purpose

This ZIP is a **replace/add patch for the YALABENA project**. It is **not a full copy of the application**.

The patch is intended to finish the HR frontend/backend integration on top of the uploaded YALABENA project and to replace the HR-related files that must be changed for the feature set to work together.

### Patch status

- HR implementation: **implemented in the patch**
- Archive structure: **checked**
- HR local imports/paths: **checked statically**
- Full dependency install/build in this environment: **NOT verified**
- Production readiness: **must be verified on the actual project machine**

Do not treat this ZIP as a guarantee that the entire YALABENA application is production-complete. It is specifically an HR patch.

---

# 2. What is included

The ZIP contains **23 files**.

## Backend files

### Required replacements

```text
src/modules/hr/hr.controller.ts
src/modules/hr/hr.service.ts
```

These files contain the HR API/controller and service changes required by the patch.

The patch adds/supports:

```text
GET    /api/v1/hr/me
GET    /api/v1/hr/my-leaves
PUT    /api/v1/hr/leaves/:id/cancel

PATCH  /api/v1/hr/availabilities/:id
DELETE /api/v1/hr/availabilities/:id
```

The teacher self-service operations are scoped to the authenticated employee.

---

# 3. Frontend files

## Required replacements

```text
front/src/App.tsx
front/src/lib/i18n.ts
```

`App.tsx` is replaced because HR routes need to be connected to the **active application router**.

`i18n.ts` is replaced because HR Arabic/English translations and RTL/LTR handling are part of the implementation.

## HR API/types/RBAC

```text
front/src/api/hr.ts
front/src/types/hr.ts
front/src/lib/rbac.ts
```

## HR pages

```text
front/src/pages/hr/HrLayout.tsx
front/src/pages/hr/EmployeesPage.tsx
front/src/pages/hr/EmployeeDetailsPage.tsx
front/src/pages/hr/LeavesPage.tsx
front/src/pages/hr/LeavesTable.tsx
front/src/pages/hr/MyHrPage.tsx
front/src/pages/hr/PayrollPage.tsx
```

## HR components

```text
front/src/components/hr/EmployeeFormDialog.tsx
front/src/components/hr/TerminateDialog.tsx
front/src/components/hr/AvailabilityPanel.tsx
front/src/components/hr/LeaveDecisionDialog.tsx
front/src/components/hr/LeaveRequestDialog.tsx
```

## HR translations

```text
front/src/locales/en/hr.json
front/src/locales/ar/hr.json
```

## Documentation/manifest

```text
README_HR_PATCH.md
HR_PATCH_MANIFEST.json
```

---

# 4. HR functionality covered

The patch connects the HR workflow end-to-end around the existing backend architecture.

## Employees

- Employee list
- Search/filter
- Create employee
- Edit employee
- Employee details
- Terminate employee
- Role-aware actions

## Employee documents

- List employee documents
- Upload using the existing file-upload flow
- Attach HR document metadata
- Open document
- Delete document

The upload flow uses the existing application file service rather than inventing a separate HR file-storage mechanism.

## Teacher availability

- Add availability
- List availability
- Update availability
- Delete availability
- Employee-scoped availability access
- HR/admin management support

## Leaves

- View leaves
- Filter leaves
- Submit leave
- Approve leave
- Reject leave
- Cancel own pending leave
- Teacher self-service leave access
- Role-aware actions

## Teacher self-service

The HR self-service page provides the authenticated teacher with:

- Own employee information
- Own availability
- Own leaves
- Leave request
- Pending-leave cancellation

The backend endpoints are scoped to the authenticated employee so the frontend does not need to trust a user-supplied employee ID for self-service operations.

## Payroll

- Create payroll period
- List payroll periods
- Calculate teacher payroll
- View payroll entries
- Close payroll period
- Export payroll as CSV

The patch does **not** introduce automatic bank transfers.

---

# 5. Important routing change

The original project had HR-related UI work that was not fully connected to the active application route tree.

This patch replaces:

```text
front/src/App.tsx
```

so the HR pages can actually be reached through the application.

After installation, verify the HR routes in the browser rather than assuming that simply having the page files is enough.

---

# 6. Before installing — BACK UP YOUR PROJECT

Do this first.

From PowerShell:

```powershell
$Project = "C:\Users\WinDows\Desktop\yalabena-main"
$Backup = "C:\Users\WinDows\Desktop\yalabena-main-before-hr-patch"

Copy-Item $Project $Backup -Recurse -Force
```

If your actual project path is different, change `$Project`.

---

# 7. Install the patch

Put:

```text
yalabena_hr_complete_patch.zip
```

where you can access it from PowerShell.

Then run from the project root:

```powershell
$Project = "C:\Users\WinDows\Desktop\yalabena-main"

Expand-Archive `
  -Path ".\yalabena_hr_complete_patch.zip" `
  -DestinationPath $Project `
  -Force
```

The ZIP already contains the correct project-relative paths.

For example:

```text
front/src/pages/hr/EmployeesPage.tsx
```

will be extracted to:

```text
C:\Users\WinDows\Desktop\yalabena-main\front\src\pages\hr\EmployeesPage.tsx
```

Do **not** manually create another `yalabena-main` directory inside the project.

---

# 8. Install frontend dependencies and build

Run:

```powershell
cd "$Project\front"
npm install
```

Then:

```powershell
npm run typecheck
npm run build
```

If your frontend does not have a `typecheck` script, inspect:

```powershell
Get-Content .\package.json
```

and use the available TypeScript/build script.

---

# 9. Install backend dependencies and build

Run:

```powershell
cd $Project
npm install
npm run build
```

If the project uses a different backend package structure, use the scripts already defined in the root `package.json`.

---

# 10. Run the application

Start the backend using the project's existing development/start command.

For example, if the project uses Nest's standard script:

```powershell
npm run start:dev
```

Then start the frontend using its existing script, commonly:

```powershell
cd "$Project\front"
npm run dev
```

Do not create a second backend or frontend project.

---

# 11. HR verification checklist

After the application starts, verify these flows with accounts that have the appropriate roles.

## Employees

- [ ] Open HR
- [ ] Employee list loads
- [ ] Search/filter works
- [ ] Create employee works
- [ ] Edit employee works
- [ ] Open employee details
- [ ] Terminate employee works

## Documents

- [ ] Employee documents load
- [ ] HR file upload succeeds
- [ ] Document metadata is saved
- [ ] Document can be opened
- [ ] Document can be deleted

## Availability

- [ ] Availability loads
- [ ] Add availability
- [ ] Edit availability
- [ ] Delete availability
- [ ] Teacher sees only the intended self-service data

## Leaves

- [ ] HR/manager can view leaves
- [ ] Teacher can submit leave
- [ ] HR/manager can approve
- [ ] HR/manager can reject
- [ ] Teacher can cancel an eligible pending request
- [ ] Teacher cannot manipulate another employee's self-service leave

## Payroll

- [ ] Payroll period can be created
- [ ] Teacher payroll calculation runs
- [ ] Payroll entries load
- [ ] Period can be closed
- [ ] CSV export downloads successfully

## Localization

- [ ] English UI works
- [ ] Arabic UI works
- [ ] RTL direction is correct in Arabic
- [ ] No missing HR translation keys appear

## RBAC

Test with the actual roles used by the project, especially:

```text
super_admin
hr
branch_manager
teacher
finance
academic
```

A user should only see and execute actions allowed by the backend roles.

---

# 12. API sanity checks

The backend uses the project's existing API prefix:

```text
/api/v1
```

HR endpoints should therefore resolve under:

```text
/api/v1/hr/...
```

Do not change the frontend API base URL just for this patch unless your project's environment configuration requires it.

The frontend should continue using the existing authenticated API client.

---

# 13. What this patch does NOT claim

This ZIP does **not** claim to finish every YALABENA module.

It does not claim that the following non-HR areas are complete:

- CRM
- LMS
- Finance outside the HR payroll integration
- Inventory
- Reports
- Knowledge Base
- Live Chat compliance
- Certificates
- Activities
- Integrations
- PWA
- Other SRS modules

Those areas require their own SRS-to-code verification.

Likewise, this patch does not claim that the entire application has passed production QA.

---

# 14. Why the patch replaces files instead of only adding files

Some HR functionality cannot work by simply adding new pages.

The active application router and HR backend controller/service also need changes.

Therefore these files are intentionally replacement files:

```text
front/src/App.tsx
front/src/lib/i18n.ts
src/modules/hr/hr.controller.ts
src/modules/hr/hr.service.ts
```

Do not keep an older conflicting version of these files after installing the patch.

---

# 15. Rollback

If the patch causes a problem, restore the backup created before installation.

For example:

```powershell
Remove-Item "C:\Users\WinDows\Desktop\yalabena-main" -Recurse -Force

Copy-Item `
  "C:\Users\WinDows\Desktop\yalabena-main-before-hr-patch" `
  "C:\Users\WinDows\Desktop\yalabena-main" `
  -Recurse `
  -Force
```

Make sure the backup path is correct before running destructive commands.

---

# 16. Verification limitation

The archive structure and HR source relationships were checked statically.

A complete `npm install` + frontend build + backend build was **not completed in the patch-building environment** because dependency installation timed out.

Therefore the correct status is:

> **Implemented patch — build verification still required on the actual YALABENA development machine.**

Do not report the project as production-verified until:

```powershell
cd "$Project\front"
npm run typecheck
npm run build
```

and:

```powershell
cd $Project
npm run build
```

complete successfully.

---

# 17. Final expected result

After a successful installation and build, the intended HR area is:

```text
HR
├── Employees
│   ├── List
│   ├── Create/Edit
│   ├── Details
│   ├── Documents
│   └── Termination
│
├── Availability
│   ├── Add
│   ├── Edit
│   └── Delete
│
├── Leaves
│   ├── Requests
│   ├── Approve
│   ├── Reject
│   └── Teacher self-service
│
└── Payroll
    ├── Periods
    ├── Calculate teachers
    ├── Entries
    ├── Close period
    └── CSV export
```

The ZIP is designed to be extracted directly over the YALABENA project root so that the listed replacement files overwrite the old versions and the new HR files are added in their correct locations.
