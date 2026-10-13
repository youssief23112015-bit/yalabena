# SpeakUp TMS — Delivery Notes

## How to use this ZIP

1. Extract this ZIP to a new folder first; do not overwrite your working copy before reviewing changes.
2. Read this file and `docs/implementation/CLAUDE_CONTINUATION_PROMPT.md`.
3. Review `docs/implementation/CHANGED_FILES_MANIFEST.md`.
4. Compare the updated source with your current working copy using Git or a directory diff.
5. Do not reset or reseed your database to apply these code changes. No database reset was run for this package.

## Changes included in this package

- Added a real Inventory page and API client to the React frontend, registered `/inventory`, and added English/Arabic inventory translations.
- Corrected Inventory TypeORM entity mappings to match the supplied top-level SQL schema: the item catalog does not own `branch_id`; branch stock belongs in `stock_levels`; the database column is `sale_price`; inventory enum names are explicitly mapped.
- Made inventory item creation with opening stock transactional, and made stock adjustment, student issue, and item return flows update stock and the movement ledger inside a single transaction with a row lock.
- Added validation for stock movement branch and quantity, positive issue quantities, return conditions, and adjustment reference types.
- Changed deletion behavior so an item with movement history is archived instead of being deleted; non-zero stock still blocks deletion.
- Added HR guardrails for employee contract dates and non-negative pay rates, whitelisted employee update fields, server-calculated leave duration, invalid date-range rejection, and pending-only/self-approval checks for leave decisions.
- Included the original request, Claude chat reference, SRS document, and revised continuation prompt for traceability.

## Database safety

No live database was available in this workspace, and no SQL was executed against a database. No migration was applied. The entity edits are intended to align with the supplied top-level SQL schema, but migration files still need a deliberate reconciliation review before anyone runs TypeORM migrations.

## Verification status

The ZIP is a source package, not a claim of a fully verified production release. Backend and frontend dependency installation could not complete in offline mode because required npm packages were not cached. Therefore full backend/frontend builds and Jest/Vite tests were **not run successfully** in this environment. Run the commands below on a machine with registry access and the project's supported Node version.

Backend:

```powershell
cd yalabena-main
npm ci
npm run build
npm test -- --runInBand
```

Frontend:

```powershell
cd yalabena-main\front
npm ci
npm run typecheck
npm run build
```

Do not run `npm run migration:run`, `database/reset-and-seed.ps1`, or any reset/reseed command just to test these code changes. First back up your database and reconcile schema/migration state separately.

## Known gaps requiring full verification

- Full HR requirement-by-requirement acceptance is not claimed; HR still needs a complete SRS audit, integration tests, and authorization review.
- Inventory branch-scope authorization must be tested against the actual authenticated user/branch claims and current guards. A role decorator alone does not prove branch isolation.
- Inventory category/status enum names and all entity mappings should be checked against the exact database instance before running migrations.
- Frontend build, runtime behavior, API response wrapping, and RTL behavior have not been verified due unavailable npm dependencies.
- Existing TypeORM migration history may differ from the top-level SQL schema. Do not assume they can be safely mixed.
