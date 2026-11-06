# Changed Files Manifest

## Backend — Inventory

- `src/shared/entities/inventory-item.entity.ts` — align item entity with SQL schema: no item-level branch foreign key, `sale_price` column, explicit existing enum names.
- `src/shared/entities/branch.entity.ts` — remove the invalid inverse relation to a catalog item that has no `branch_id` column.
- `src/shared/entities/stock-move.entity.ts` — explicitly map the stock movement enum to the top-level SQL enum name and use the existing `creator` relation name in service queries.
- `src/shared/entities/student-item-issue.entity.ts` — explicitly map return condition to the existing SQL enum name.
- `src/modules/inventory/inventory.service.ts` — create opening stock transactionally; serialize stock changes with a row lock; commit stock balance, movement history, and issue/return record together; validate quantities/status; archive items with movement history; fix relation names and stock aggregation.
- `src/modules/inventory/inventory.controller.ts` — pass the branch identifier from the validated stock-adjustment DTO to the service.
- `src/modules/inventory/dto/save-item.dto.ts` — use the schema-aligned `sale_price` field and make branch selection optional when no opening stock is created.
- `src/modules/inventory/dto/adjust-stock.dto.ts` — require a branch, support signed stock adjustments, and constrain movement reference types to database-supported values.
- `src/modules/inventory/dto/issue-item.dto.ts` — require whole positive issue quantities and non-negative costs; validate optional reference IDs as UUIDs.

## Backend — HR

- `src/modules/hr/hr.service.ts` — validate contract date ranges and pay values; whitelist employee update fields; calculate leave duration on the server; reject reversed date ranges, repeat decisions, and self-approval/self-rejection.
- `src/modules/hr/hr.controller.ts` — pass authenticated actor information into leave request handling so self-service requests use the signed-in employee identity.
- `src/modules/hr/dto/request-leave.dto.ts` — make client-supplied `days_count` optional for compatibility because the service recalculates it.

## Frontend — Inventory

- `front/src/api/inventory.ts` — add typed API calls for inventory items, stock moves, low-stock alerts, adjustments, and valuation.
- `front/src/pages/Inventory.tsx` — add inventory catalog UI with search, branch selection, low-stock filtering, valuation summary, recent movement history, item create/edit, and stock receiving/issuing/adjustment form.
- `front/src/routes/index.tsx` — register the protected `/inventory` route.
- `front/src/locales/en/common.json` — add English inventory UI strings.
- `front/src/locales/ar/common.json` — add Arabic inventory UI strings.

## Documentation / handover

- `docs/implementation/ORIGINAL_PROMPT.md` — preserve the original prompt.
- `docs/implementation/CLAUDE_CHAT_REFERENCE.md` — preserve the supplied Claude chat excerpt as reference, not as proof of repository state.
- `docs/implementation/reference/SpeakUp_TMS_SRS_v1.docx` — include the supplied SRS for the next audit.
- `docs/implementation/CLAUDE_CONTINUATION_PROMPT.md` — provide the revised prompt with source precedence, workflow, schema safety, testing, and honest reporting requirements.
- `docs/implementation/DELIVERY_NOTES.md` — explain changes, limitations, and local verification commands.
- `docs/implementation/CHANGED_FILES_MANIFEST.md` — this file.
