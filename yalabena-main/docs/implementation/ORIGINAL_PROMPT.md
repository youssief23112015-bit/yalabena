SpeakUp TMS — Continue HR Development and Implement Inventory Module

You are working on my existing SpeakUp Training Management System (TMS) repository.

I will provide:

1. The latest project ZIP.
2. The Software Requirements Specification (SRS).
3. The latest project status/README, if not available.

Your job is to inspect the actual codebase, continue the unfinished HR module, and then implement the Inventory module completely according to the SRS.

Do not start from scratch. Do not replace the project architecture. Do not give me generic tutorials or isolated code snippets. Work on the existing project and produce complete, integrated, buildable code.

1. Current Project Context

- Project folder: `yalabena-main`
- Backend: NestJS, TypeScript, TypeORM.
- Database: PostgreSQL 15 running in Docker.
- Cache/service: Redis running in Docker.
- Frontend: React, TypeScript, Vite.
- API prefix: `/api/v1`.
- Swagger: `http://localhost:3000/docs`.
- Docker services: 
  - `speakup-api`
  - `speakup-postgres`
  - `speakup-redis`

Current verified database state

The top-level `database` folder contains:

- `speakup_tms_full_schema.sql`
- `seed-test-data.sql`
- `seed-test-data-v2.1.sql`
- `seed-test-data.ps1`
- `reset-and-seed.ps1`
- `TEST_USERS_AND_PASSWORDS.txt`

The official SQL schema and test seed were successfully applied using:

`.\database\reset-and-seed.ps1`

The verification output showed:

- Tables: 80
- Courses: 6
- Students: 2
- Invoices: 1
- Invoice items: 1
- Inventory items: 3

A backup was created at:

`database/backups/speakup_tms_20261008_223351.sql`

The Docker services were running, and the NestJS application logged:

`Nest application successfully started`

Important: the database was rebuilt using the top-level SQL schema and seed, not by running TypeORM migrations. The successful backend startup does not prove every entity, migration, endpoint, or frontend workflow is compatible with this database. Verify compatibility before changing the database or running migrations.

These details describe the last verified state. Re-check the provided repository instead of assuming that every detail is still true.

2\. Mandatory First Step: Audit the Real Repository

Before editing anything:

1. Inspect the project structure, `package.json` files, modules, controllers, services, entities, DTOs, guards, decorators, permissions, migrations, seed scripts, frontend pages, API clients, and routes.
2. Read the SRS carefully and extract all HR and Inventory requirements.
3. Inspect the current implementation of HR and Inventory on both backend and frontend.
4. Identify exactly what is complete, partially implemented, missing, broken, duplicated, or disconnected.
5. Check existing coding patterns and follow the architecture already used in this project.
6. Inspect the actual PostgreSQL schema in the supplied SQL files and compare it with the TypeORM entities and the existing migrations.
7. Identify the project's build, test, lint, and formatting commands.

Create a clear implementation checklist based on the SRS. Keep track of completed and remaining work.

Do not claim a feature is implemented merely because a file or endpoint exists. Trace it through the database/entity, service, controller, authorization, API client, frontend, and relevant workflows.

3\. Phase One — Finish the HR Module

Continue the HR module from its actual current state.

Use the SRS as the source of truth. Inspect existing functionality first and preserve working code. Do not rewrite completed components without a concrete reason.

Check all HR requirements that apply to this project, including the following where specified in the SRS:

- Employee records and employee profiles.
- Employee creation, viewing, editing, and status management.
- Departments, job positions, branches, and organizational relationships.
- Attendance and working schedules.
- Leave requests, leave balances, approval/rejection workflows, and leave history.
- Payroll, salary information, allowances, deductions, and payroll processing.
- HR documents and employee-related records.
- Employee search, filtering, pagination, and validation.
- Role-based access control and HR-specific permissions.
- Dashboard statistics, reports, and exports.
- Frontend forms, tables, details pages, loading states, error handling, and validation.

These are audit candidates, not permission to invent requirements. Implement only the features required by the SRS or already established by the project design.

For every required feature:

1. Complete the backend entity/schema integration where necessary.
2. Implement or repair DTOs and validation.
3. Implement service logic and correct business rules.
4. Implement controller routes and consistent API responses.
5. Apply the existing authentication and RBAC conventions.
6. Connect the frontend to the real backend API.
7. Implement loading, empty, success, and error states.
8. Test important success cases and failure cases.
9. Check for regressions in existing functionality.

Do not mark HR complete until the implementation has been verified against the SRS checklist.

4\. Phase Two — Implement the Inventory Module

After the HR work is complete and verified, implement the Inventory module according to the SRS and the existing project architecture.

First inspect the current Inventory module, the existing `inventory_items` table/entity, the current seed records, and all related code. Extend existing components instead of creating duplicate modules or tables.

Audit the following capabilities and implement the ones required by the SRS:

A. Inventory items

- Create, view, edit, search, filter, and deactivate inventory items.
- Item code/SKU, name, description, category, unit of measure, and other required fields.
- Quantity on hand, minimum stock, reorder level, unit cost, and storage location when required.
- Validation for duplicate item codes, invalid quantities, and invalid prices.

B. Categories and locations

- Inventory categories and storage locations, if required.
- Relationships and referential integrity.
- Prevent invalid deletion of records that are already referenced by transactions.

C. Stock movements

- Stock receiving and stock issuance.
- Stock adjustments and transfers when required.
- Track movement type, quantity, date, reference, notes, and responsible user as required.
- Maintain accurate stock balances.
- Prevent negative stock unless the SRS explicitly allows it.
- Use database transactions for operations that update stock and record movement history together.
- Prevent race conditions and inconsistent stock balances.

D. Suppliers and procurement

- Suppliers, purchase orders, receiving workflows, and related records only if required by the SRS.
- Follow the project's existing procurement/finance integration patterns.
- Avoid creating duplicate supplier or purchasing functionality if it already exists elsewhere.

E. Inventory reports and alerts

- Low-stock and reorder alerts.
- Inventory valuation and movement reports where required.
- Search, filtering, sorting, and pagination.
- Export functionality only where required.

F. Frontend

Implement the actual Inventory screens and connect them to the backend:

- Inventory list and details.
- Create/edit item forms.
- Categories and locations if required.
- Stock receiving, issuing, adjustment, or transfer workflows as specified.
- Movement history.
- Reports and low-stock views.

Reuse the project's existing UI components, styling, layout, form libraries, API client, routing, and notification patterns. Do not introduce an unrelated UI framework.

5\. Database and Migration Safety

This project has both TypeORM migrations and top-level SQL schema/seed files. Treat database compatibility as a critical requirement.

Before changing the schema:

1. Determine which database structure the running application actually uses.
2. Compare the existing SQL schema with the TypeORM entities.
3. Inspect the migration history and migration ordering.
4. Identify missing columns, tables, enums, constraints, and indexes.
5. Decide on the correct schema change based on the project's established deployment workflow.
6. Add migrations only when appropriate and ensure they are compatible with the actual starting schema.

Never assume that adding an entity automatically creates its table.

Never run a destructive reset, `DROP SCHEMA`, truncate existing data, or overwrite database data just to make a feature work. Do not execute destructive commands. Preserve existing data and provide explicit instructions for any manual database operation.

If the schema and code conflict, document the exact conflict and implement a safe, consistent solution.

6\. Authentication, RBAC, and Security

Follow the existing authentication and authorization architecture.

- Use the existing guards, permission decorators, roles, and permission seeds.
- Verify that read, create, update, delete, approval, and stock-movement operations have appropriate permissions.
- Do not rely on hiding frontend buttons as authorization.
- Validate user input on the backend.
- Avoid exposing salary, personal employee data, or other sensitive information to unauthorized users.
- Prevent users from changing protected fields or assigning permissions they do not have.
- Keep credentials, JWT secrets, and API keys out of source control.
- Do not hardcode test credentials into application code.

7. Testing and Verification
    Do not stop after writing files.
    Run the available commands from the correct project directories. Check the repository's actual scripts before choosing commands.
    At minimum:

- Backend production build.
- Frontend production build.
- Existing tests.
- Tests for new business logic and critical endpoints.
- TypeScript and lint checks if configured.
- API endpoint and validation checks.
- HR and Inventory permission checks.
- Database/entity/schema compatibility checks.
- Regression checks for existing modules.

Create meaningful automated tests for new functionality, following the project's existing test framework and conventions. If there are no tests or a command cannot run, report that honestly; do not claim tests passed.

Pay particular attention to stock arithmetic, transaction rollback, invalid quantities, duplicate item codes, unauthorized access, and HR approval workflows.

8\. Implementation Rules

These rules are mandatory:

1. Do not return only a plan. Audit the repository and then implement the work.
2. Do not return pseudocode, placeholder methods, empty handlers, mock APIs, or TODOs in place of required functionality.
3. Do not provide snippets and ask me to manually reconstruct entire files.
4. Preserve working existing functionality.
5. Do not duplicate existing entities, endpoints, tables, pages, or permission definitions.
6. Use consistent naming and follow existing project conventions.
7. Keep frontend and backend contracts consistent.
8. Do not silently omit requirements because they are difficult.
9. Do not fabricate successful test results.
10. Do not change unrelated modules unless a dependency requires it.
11. Do not overwrite or delete existing project files without checking their current content and purpose.
12. Do not claim to have changed files unless you actually modified them in the available workspace.
13. Never expose `.env` contents, credentials, JWT secrets, or private test-account passwords in your final report.
14. If the environment supports editing the uploaded/extracted repository, edit the real files directly. If it does not, clearly explain the limitation rather than pretending the changes were made.
15. Required Workflow

    Work in this order:

    Step 1: Audit the SRS and actual repository.

    Step 2: Produce a concise HR/Inventory gap checklist with the relevant existing files and endpoints.

    Step 3: Complete the HR requirements that remain unfinished.

    Step 4: Build and test the backend and frontend; fix the errors caused by your changes.

    Step 5: Implement the required Inventory backend and database integration.

    Step 6: Implement the Inventory frontend and connect it to real API endpoints.

    Step 7: Add or update tests and run the available verification commands.

    Step 8: Re-audit both modules against the SRS and report remaining gaps.

    If a dependency blocks progress, explain the exact blocker and continue with other independent work. Ask me a question only when an essential decision cannot be determined from the repository or SRS.
16. Final Deliverables

    When finished, provide:
17. A summary of what was already implemented before your changes.
18. A list of every file created or modified and why.
19. A requirement-by-requirement HR checklist with verified status.
20. A requirement-by-requirement Inventory checklist with verified status.
21. Any schema changes and migration instructions, including whether they were actually applied.
22. The API routes implemented and their permissions.
23. The frontend pages and workflows implemented.
24. Build/test commands executed and their real results.
25. Known issues or requirements that remain incomplete.
26. Exact commands I should run locally to verify the result.
27. Git commands for reviewing and committing the changes, but do not push anything without my approval.

Be precise and honest. Distinguish between implemented, build-verified, test-verified, and not yet verified.

Start Now

Inspect the supplied ZIP and SRS first. Determine the exact current state of HR and Inventory from the real files. Then continue coding—finish the remaining HR work before implementing Inventory—and verify the result. Do not give me a generic response or a plan-only answer.