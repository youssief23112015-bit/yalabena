# SpeakUp TMS — Repository Continuation Prompt (Revised)

You are continuing the existing `yalabena-main` SpeakUp Training Management System repository. Do not start over or replace its architecture.

## Inputs and source-of-truth order

Use, in this order:
1. The actual files in this repository, including the current SQL schema, migrations, source code, frontend routes/API clients, and tests.
2. `docs/implementation/reference/SpeakUp_TMS_SRS_v1.docx` for product requirements.
3. `docs/implementation/CLAUDE_CHAT_REFERENCE.md` as historical context only. Chat logs and pasted terminal output are not proof that changes exist in this checkout.
4. `docs/implementation/ORIGINAL_PROMPT.md` as the initial request.

If two sources conflict, report the conflict before resolving it. The SRS itself has a conflict: an early introduction mentions AI scope, while Section 13 explicitly excludes AI/ML; treat the explicit Out-of-Scope section as controlling unless the project owner confirms otherwise. Do not add excluded integrations or features.

## Verified context to re-check, not assume

- Backend: NestJS + TypeScript + TypeORM.
- Database: PostgreSQL; Redis is used by the project.
- Frontend: React + TypeScript + Vite in `front/`.
- API prefix: `/api/v1`; Swagger is expected at `http://localhost:3000/docs`.
- The supplied baseline says the SQL schema and test seed were applied with `database/reset-and-seed.ps1`; that is historical context, not proof of the current local database.
- The baseline database uses the top-level SQL schema, while TypeORM migrations may represent a different schema. Never run migrations or change data until compatibility has been assessed.

## Mandatory work sequence

### 1. Audit before editing

- Inspect the real tree, both `package.json` files, scripts, module registration, entities, DTOs, controllers, services, guards, roles, permission seeds, frontend pages, API clients, routes, locales, SQL schema, migrations, and tests.
- Extract only the HR and Inventory requirements actually stated in the SRS. Audit candidates in the original prompt are not automatically requirements.
- Trace each feature end-to-end: database/schema → entity → DTO/validation → service/business rules → controller/authorization → frontend API client → route/page → relevant workflow/tests.
- Create a requirement checklist with statuses: `implemented`, `build-verified`, `test-verified`, `partial`, `missing`, or `blocked`. A file or endpoint existing is not proof of a working feature.

### 2. Finish HR first

Continue the current HR implementation without rewriting working parts. Implement only required features and established project behavior. Prioritize employee records/contracts, document attachments, teacher availability, substitute-teacher workflow if already supported by the SRS/project, leave requests and manager approval, fixed salary vs hourly rate, monthly teacher payout calculations, and payroll export.

Security and business rules:
- A non-HR employee must only submit or cancel their own leave request; never trust a client-supplied `employee_id` for self-service.
- Calculate leave duration on the server and reject end dates before start dates.
- Only pending leave requests can be approved/rejected; users cannot approve/reject their own requests.
- Whitelist editable employee fields; do not let clients replace linked user IDs or protected fields.
- Validate contract dates and non-negative salary/rate values.
- Preserve salary, bank, and other sensitive HR data behind appropriate backend authorization, not merely hidden frontend controls.
- Keep payroll calculation/export behavior consistent with actual schema constraints and the SRS. Payroll export is a file export, not a bank-transfer integration.

### 3. Verify HR before Inventory

Run the actual project scripts from the correct directories. Add meaningful tests using the repository's real test framework. Do not treat a temporary external harness as repository tests. Record exact commands and outputs. Fix regressions caused by changes.

### 4. Implement Inventory completely to the actual SRS

Inspect the existing `inventory_items`, `stock_levels`, `stock_moves`, and `student_item_issues` tables/entities before adding anything. Extend existing tables/modules; do not create duplicates.

Implement only the SRS-required flows, including applicable item CRUD/search/filtering, per-branch stock, receiving/issuing/adjustment, issue/return workflows if already required by project behavior, low-stock/valuation/movement reports, and frontend screens connected to real endpoints. Avoid inventing supplier/purchase-order workflows unless the SRS requires them.

Inventory correctness is mandatory:
- A stock change and its stock-movement ledger record must commit or roll back together.
- Use database transactions and row-level locking/atomic SQL where necessary to prevent concurrent overselling.
- Validate integer quantities, valid prices, SKU uniqueness, branch/item existence, and movement type.
- Never allow negative stock unless the SRS explicitly says so.
- An adjustment must have an explicit signed quantity and a reason.
- Prevent deletion of items that have stock or transaction history; archive historical items when appropriate.
- Verify stock balance behavior for good, damaged, and lost returns.
- Keep branch scoping and role permissions enforced by backend code.

### 5. Database/migration safety

- Compare the actual SQL schema with entity mappings and migrations before schema changes.
- Do not run `DROP SCHEMA`, truncate, reset, reseed, or otherwise destroy/overwrite user data.
- Do not run migrations automatically. Add a migration only if it fits the established deployment workflow and the real starting schema; document exact instructions and whether it was actually applied.
- If schema and migrations conflict, document both structures and the safe resolution. Never claim that entity definitions alone changed the live database.

### 6. Frontend requirements

- Reuse the current UI components, styling, form conventions, React Query patterns, API client, route guards, toast/error handling, and i18n setup.
- Connect forms to real APIs. Implement loading, empty, success, validation, and error states.
- Add English and Arabic strings to the project's existing locale resources and verify RTL/LTR behavior.
- Do not add a new UI framework or mock API in place of backend integration.

### 7. Verification requirements

Read scripts before running commands. Run backend build, frontend build/typecheck, existing tests, relevant lint checks, and new HR/Inventory tests. Test validation failures, authorization denials, leave approval rules, stock arithmetic, duplicate SKUs, rollback, and concurrent stock issuance where the existing test setup permits it.

If dependencies cannot be installed or an environment prevents a command, state the exact blocker and mark the item `not verified`; never fabricate successful output. Do not claim production readiness based only on syntax checks or a backend startup message.

## Required deliverable

Edit the real project files in the available workspace. Produce a ZIP containing the updated project and these docs. Do not push or publish anything. Before finalizing:
- Re-audit the SRS checklist for HR and Inventory.
- Include a changed-file manifest with a short reason for each change.
- Include exact build/test commands and real outcomes.
- List schema changes, migration status, permissions/routes, UI workflows, remaining gaps, and exact local verification commands.
- Distinguish clearly between implemented, build-verified, test-verified, and unverified work.
- Never include `.env` secrets or passwords in the report.

Do not stop after producing a plan. Continue independent work if one item is blocked. Ask a question only when an essential product decision cannot be inferred from the actual repository or SRS.
