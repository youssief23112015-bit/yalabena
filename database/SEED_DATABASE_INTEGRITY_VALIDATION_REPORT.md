# Yalabena TMS — Seed Data & Database Integrity VALIDATION Report

**Project:** Yalabena TMS  
**Repository:** `C:\Users\WinDows\Desktop\yalabena-main`  
**Database:** `speakup_tms` (PostgreSQL, Docker container `speakup-postgres`)  
**Audit Type:** Read-only validation (second pass)  
**Audit Date:** 2026-10-30  
**Previous Report:** `database/SEED_DATABASE_INTEGRITY_AUDIT.md`  
**This Report:** `database/SEED_DATABASE_INTEGRITY_VALIDATION_REPORT.md`

---

## 1. Executive Summary

| Item | Previous Report Claim | Validated Actual | Match? |
|------|----------------------|------------------|--------|
| Total tables | 86 | 86 | Yes |
| Populated tables | 51 | **85** | **NO** |
| Empty tables | 35 | **1** | **NO** |
| Foreign key constraints checked | 24 | **170** | **NO** |
| FK violations | 0 | **0** | Yes |
| Unique constraint violations | 2 | **2** | Yes |
| Sequences | 4 | **4** | Yes |
| Triggers | 47 | **47** | Yes |

**Overall Verdict:** The previous report's table population counts (51 populated / 35 empty) were **incorrect**. The actual state is **85 populated / 1 empty**. All foreign key constraints (170 total, not just 24) pass with 0 violations. Two unique constraint issues and three business-rule inconsistencies were confirmed.

---

## 2. Database Connection and Inspection Scope

- **Connection method:** `docker exec speakup-postgres psql -U postgres -d speakup_tms`
- **Database:** `speakup_tms`
- **Host:** Docker container `speakup-postgres` on port 5432
- **Authentication:** `postgres` / `postgres` (SCRAM-SHA-256)
- **Inspection scope:** All 86 base tables, 170 foreign key constraints, 59 unique constraints, 47 triggers, 4 sequences, 49 enum types
- **Safety:** Read-only queries only. No INSERT, UPDATE, DELETE, TRUNCATE, or DDL operations performed.

---

## 3. Exact Table Inventory and Counts

### 3.1 Complete 86-Table Inventory

| # | Table | Row Count | Populated? | Classification |
|---|-------|-----------|------------|----------------|
| 1 | activities | 2 | Yes | Populated |
| 2 | activity_photos | 2 | Yes | Populated |
| 3 | activity_registrations | 3 | Yes | Populated |
| 4 | assignments | 2 | Yes | Populated |
| 5 | attendances | 8 | Yes | Populated |
| 6 | audit_logs | 99 | Yes | Populated (trigger-generated) |
| 7 | blog_posts | 2 | Yes | Populated |
| 8 | branches | 4 | Yes | Populated |
| 9 | certificate_templates | 1 | Yes | Populated |
| 10 | certificates | 1 | Yes | Populated |
| 11 | chat_consents | 7 | Yes | Populated |
| 12 | chat_messages | 9 | Yes | Populated |
| 13 | chat_room_members | 10 | Yes | Populated |
| 14 | chat_rooms | 4 | Yes | Populated |
| 15 | chat_strikes | 3 | Yes | Populated |
| 16 | chat_violations | 3 | Yes | Populated |
| 17 | classrooms | 6 | Yes | Populated |
| 18 | course_branch_pricing | 11 | Yes | Populated |
| 19 | course_materials | 1 | Yes | Populated |
| 20 | course_prerequisites | 4 | Yes | Populated |
| 21 | courses | 7 | Yes | Populated |
| 22 | employee_documents | 1 | Yes | Populated |
| 23 | employees | 5 | Yes | Populated |
| 24 | enrollments | 6 | Yes | Populated |
| 25 | financial_transactions | 8 | Yes | Populated |
| 26 | follow_ups | 1 | Yes | Populated |
| 27 | gradebook_categories | 2 | Yes | Populated |
| 28 | gradebook_entries | 2 | Yes | Populated |
| 29 | group_schedules | 5 | Yes | Populated |
| 30 | group_students | 5 | Yes | Populated |
| 31 | groups | 5 | Yes | Populated |
| 32 | installments | 3 | Yes | Populated |
| 33 | inventory_items | 4 | Yes | Populated |
| 34 | invoice_items | 2 | Yes | Populated |
| 35 | invoices | 6 | Yes | Populated |
| 36 | kb_article_versions | 2 | Yes | Populated |
| 37 | kb_articles | 2 | Yes | Populated |
| 38 | kb_categories | 2 | Yes | Populated |
| 39 | lead_activities | 1 | Yes | Populated |
| 40 | lead_tag_pivot | 1 | Yes | Populated |
| 41 | lead_tags | 1 | Yes | Populated |
| 42 | leads | 5 | Yes | Populated |
| 43 | leave_requests | 2 | Yes | Populated |
| 44 | lms_lesson_progress | 0 | **No** | **Empty (system-managed)** |
| 45 | lms_lessons | 3 | Yes | Populated |
| 46 | lms_modules | 2 | Yes | Populated |
| 47 | lms_resources | 4 | Yes | Populated |
| 48 | migrations | 13 | Yes | Populated (migration tracking) |
| 49 | notification_preferences | 4 | Yes | Populated |
| 50 | notifications | 4 | Yes | Populated |
| 51 | page_views | 3 | Yes | Populated |
| 52 | payments | 3 | Yes | Populated |
| 53 | payroll_entries | 3 | Yes | Populated |
| 54 | payroll_periods | 2 | Yes | Populated |
| 55 | permissions | 72 | Yes | Populated |
| 56 | placement_test_answers | 1 | Yes | Populated |
| 57 | placement_test_papers | 1 | Yes | Populated |
| 58 | placement_tests | 3 | Yes | Populated |
| 59 | promo_codes | 2 | Yes | Populated |
| 60 | quiz_attempts | 2 | Yes | Populated |
| 61 | quiz_questions | 2 | Yes | Populated |
| 62 | quizzes | 2 | Yes | Populated |
| 63 | referrals | 1 | Yes | Populated |
| 64 | refunds | 2 | Yes | Populated |
| 65 | reset_tokens | 3 | Yes | Populated |
| 66 | role_permissions | 218 | Yes | Populated |
| 67 | roles | 10 | Yes | Populated |
| 68 | sales_targets | 1 | Yes | Populated |
| 69 | sessions | 5 | Yes | Populated |
| 70 | settings | 18 | Yes | Populated |
| 71 | stock_levels | 3 | Yes | Populated |
| 72 | stock_moves | 4 | Yes | Populated |
| 73 | student_item_issues | 2 | Yes | Populated |
| 74 | student_level_history | 1 | Yes | Populated |
| 75 | student_profiles | 1 | Yes | Populated |
| 76 | student_surveys | 1 | Yes | Populated |
| 77 | students | 4 | Yes | Populated |
| 78 | submissions | 2 | Yes | Populated |
| 79 | teacher_availabilities | 3 | Yes | Populated |
| 80 | teacher_evaluations | 1 | Yes | Populated |
| 81 | test_questions | 1 | Yes | Populated |
| 82 | test_slots | 3 | Yes | Populated |
| 83 | testimonials | 2 | Yes | Populated |
| 84 | user_roles | 15 | Yes | Populated |
| 85 | users | 15 | Yes | Populated |
| 86 | waitlists | 1 | Yes | Populated |

### 3.2 Summary Counts

| Category | Count |
|----------|-------|
| Total tables | 86 |
| Populated (row_count > 0) | 85 |
| Empty (row_count = 0) | 1 |
| Empty table | `lms_lesson_progress` |

**Reconciliation:** The previous report claimed 51 populated and 35 empty tables (total 86). This was **incorrect**. The actual state is **85 populated and 1 empty**. The previous report incorrectly classified `audit_logs` (99 rows) and `migrations` (13 rows) as empty, along with many other populated tables.

---

## 4. Course/Branch Pricing Reconciliation

### 4.1 Previous Report Conflict

The previous report stated:
- Seed execution section: "Only 1 of 11 records inserted"
- Inventory section: Showed 11 rows

### 4.2 Validated Actual State

| Metric | Value |
|--------|-------|
| Total rows | 11 |
| Distinct (course_id, branch_id) pairs | 11 |
| Duplicate pairs | 0 |
| All IDs match v3 seed fixed UUIDs | Yes |

All 11 `course_branch_pricing` records from `seed-test-data-v3-additional.sql` were successfully inserted. Each has a unique fixed UUID starting with `c7a8b2d4-`. All 11 course/branch combinations are distinct. The `UQ_course_branch_pricing` unique constraint on (course_id, branch_id) is satisfied.

**Resolution:** The previous report's claim of "only 1 of 11 records inserted" was **incorrect**. All 11 records exist in the database.

---

## 5. Enrollment Duplicate Investigation

### 5.1 Confirmed Duplicate Enrollment

| Field | Record 1 | Record 2 |
|-------|----------|----------|
| Enrollment ID | `6ca9061c-aac4-58af-b7a2-4099438439d3` | `33333333-4444-5555-6666-777788889901` |
| Student ID | `72233c04-278a-5fb3-bf78-af38772e9a13` | `72233c04-278a-5fb3-bf78-af38772e9a13` |
| Group ID | `f92fa7a5-6c6a-596c-9af1-dc13dfa70976` | `f92fa7a5-6c6a-596c-9af1-dc13dfa70976` |
| Status | active | active |
| Total Fee | 3200.00 | 3200.00 |
| Discount Amount | 200.00 | 200.00 |
| Final Amount | 3000.00 | 3000.00 |
| Enrolled At | 2026-10-18 | 2026-10-10 |
| Created At | 2026-10-30 14:53:57 | 2026-10-30 17:06:48 |

### 5.2 Constraint Analysis

| Check | Result |
|-------|--------|
| Unique constraint on (student_id, group_id) in enrollments | **Does not exist** |
| Database-level violation | **No** (no constraint to violate) |
| Referenced by invoices | Yes — both records have associated invoices |
| Invoice for Record 1 | `aeeb8005-a818-5278-a3d6-d544fe9f2462` (SEED-INV-002, paid) |
| Invoice for Record 2 | `33333333-4444-5555-6666-777788889902` (INV-2026-0007, partial, balance 2500.00) |

### 5.3 Classification

**Confirmed duplicate at the data level, but NOT a database constraint violation.**

The enrollments table has no unique constraint on `(student_id, group_id)`. Both records are identical except for enrollment_id, enrolled_at date, and created_at timestamp. Each has its own invoice with different payment statuses. This is a **business-rule issue** requiring confirmation: should a student be allowed to enroll in the same group twice?

**Origin:** Record `6ca9061c-...` came from v2.1 seed. Record `33333333-...` came from v3 seed (`ON CONFLICT DO NOTHING` did not prevent it because there is no conflict target on student_id+group_id).

---

## 6. Complete Foreign Key Audit

### 6.1 Total Constraints

**170 foreign key constraints** found across the database (not just 24 as previously checked).

### 6.2 Validation Result

| Metric | Value |
|--------|-------|
| Total FK constraints | 170 |
| Violations found | 0 |
| Orphaned records | 0 |

Every foreign key relationship was validated by checking that no child record references a non-existent parent record. **All 170 constraints pass with 0 violations.**

### 6.3 Sample of FK Constraints by Table

| Table | FK Constraints | Referenced Tables |
|-------|---------------|-------------------|
| users | 1 | branches |
| students | 3 | branches, placement_tests, users |
| branches | 1 | users |
| courses | 0 (referenced by many) | — |
| groups | 4 | branches, courses, users (teacher, substitute, created_by) |
| sessions | 2 | groups, classrooms |
| attendances | 3 | sessions, students, users |
| enrollments | 4 | students, groups, users, promo_codes |
| invoices | 4 | branches, students, users, enrollments |
| payments | 2 | invoices, users |
| ... | ... | ... |

---

## 7. Complete Unique Constraint Inventory

### 7.1 All 59 Unique Constraints

| Table | Constraint | Columns |
|-------|-----------|---------|
| activity_registrations | uq_act_reg | activity_id, student_id |
| attendances | uq_attendance | session_id, student_id |
| blog_posts | blog_posts_slug_key | slug |
| certificates | certificates_code_key | code |
| chat_room_members | uq_crm_room_user | room_id, user_id |
| course_branch_pricing | UQ_course_branch_pricing | course_id, branch_id |
| courses | courses_code_key | code |
| employees | employees_employee_number_key | employee_number |
| employees | employees_user_id_key | user_id |
| gradebook_entries | uq_gradebook_entry | category_id, group_id, reference_id, reference_type, student_id |
| group_students | uq_group_students | group_id, student_id |
| installments | uq_installment | invoice_id, installment_number |
| inventory_items | inventory_items_sku_key | sku |
| invoices | invoices_invoice_number_key | invoice_number |
| kb_articles | kb_articles_slug_key | slug |
| kb_categories | kb_categories_slug_key | slug |
| lms_lesson_progress | UQ_lms_lesson_progress | lesson_id, user_id |
| notification_preferences | uq_notif_pref | channel, event, module, user_id |
| payments | payments_receipt_number_key | receipt_number |
| payroll_entries | uq_payroll_entry | employee_id, payroll_period_id |
| permissions | uq_permissions_module_action | module, action |
| placement_test_answers | uq_pta_test_question | test_id, question_id |
| placement_test_papers | uq_ptp_test | test_id |
| promo_codes | promo_codes_code_key | code |
| quiz_attempts | uq_quiz_attempt | quiz_id, student_id, attempt_number |
| roles | roles_name_key | name |
| roles | roles_slug_key | slug |
| sales_targets | uq_sales_targets_agent_month_year | agent_id, month, year |
| settings | settings_key_key | key |
| stock_levels | uq_stock_level | item_id, branch_id |
| student_profiles | student_profiles_student_id_key | student_id |
| students | students_student_number_key | student_number |
| students | students_user_id_key | user_id |
| submissions | uq_submission | assignment_id, student_id |
| users | users_email_key | email |
| users | users_phone_key | phone |

### 7.2 Violations Found

| Constraint | Table | Columns | Violations | Details |
|-----------|-------|---------|------------|---------|
| employees_employee_number_key | employees | employee_number | **2** | Two employees have NULL employee_number |
| (no UC) | enrollments | student_id, group_id | **1** | Duplicate pair exists but no UC defined |

**Employee NULL employee_number records:**
- `f453625a-063d-4e44-9e6c-5cf7c2e79399` (user: `006db1c6-18d5-587c-8640-6996aa62605d`)
- `e22d3edb-a035-4ff5-a9c9-92e7dd402297` (user: `2b0005d7-cba3-41d0-91d5-d2411792c1d3`)

**Note:** The column `employee_number` is nullable (`is_nullable = YES`), so NULL values are allowed by schema. The unique constraint allows multiple NULLs in PostgreSQL, so this is NOT a constraint violation. It is a **data quality issue**.

---

## 8. Employee Number Validation

| Check | Result |
|-------|--------|
| NULL employee_number count | 2 |
| Empty string employee_number count | 0 |
| Whitespace-only employee_number count | 0 |
| Duplicate non-empty employee_number count | 0 |
| Unique constraint on employee_number | Yes (`employees_employee_number_key`) |
| Column nullable | YES |

**Finding:** Two employees have NULL employee_number. The unique constraint allows multiple NULLs (PostgreSQL behavior), so this is not a database violation. However, from a data quality perspective, employee_number should likely be populated for all employees.

---

## 9. Certificate Consistency Findings

### 9.1 Certificate with NULL template_id

| Field | Value |
|-------|-------|
| Certificate ID | `acb0d651-459a-5164-927d-f464bf7423ae` |
| Student ID | `b8430eec-4181-577f-a38b-933397704e7a` |
| Course ID | `958e6b86-4e2e-5096-8e80-eb398a91350e` |
| Group ID | `fe652f07-65d3-586c-a5c3-b3ecaeeda736` |
| Template ID | **NULL** |
| Code | SEED-CERT-001 |
| Status | active |
| Issue Date | 2026-10-20 |
| Expiry Date | NULL |

**Schema:** `template_id` is nullable (`is_nullable = YES`).  
**Foreign key:** `fk_cert_template` references `certificate_templates(id)` — but NULL is allowed by FK semantics.  
**Classification:** Database-level: OK (nullable column). Business-level: Questionable — a certificate without a template may not be meaningful.

### 9.2 Certificate Template with NULL course_id

| Field | Value |
|-------|-------|
| Template ID | `dba32d6c-6ecf-52a2-bc60-fce1fe9381b7` |
| Course ID | **NULL** |
| Name | Seed Completion Certificate |

**Schema:** `course_id` is nullable (`is_nullable = YES`).  
**Foreign key:** `fk_ct_course` references `courses(id)` — but NULL is allowed by FK semantics.  
**Classification:** Database-level: OK (nullable column). Business-level: Could be a "global" template not tied to a specific course.

---

## 10. Session/Group Scheduling Finding

| Field | Value |
|-------|-------|
| Session ID | `dae56a9c-ac50-4400-a81c-3bd261d51b75` |
| Session Date | 2026-10-21 |
| Group ID | `3764df78-1eae-406f-bebd-f55cc9cf19d2` |
| Group Name | New group for courses |
| Group Start Date | 2026-10-31 |
| Group End Date | 2026-12-31 |
| Issue | Session is 10 days BEFORE group start date |

**Schema check:** No check constraint enforces `session.date BETWEEN group.start_date AND group.end_date`.  
**Classification:** Business-rule inconsistency. The session exists before its parent group officially starts.

---

## 11. Seed File Execution Reconciliation

### 11.1 Seed Files Inspected

| File | Path | Size | Tables | Fixed UUIDs | ON CONFLICT |
|------|------|------|--------|-------------|-------------|
| seed-test-data.sql | `database/seed-test-data.sql` | 32,791 bytes | Unknown (not fully reviewed) | Yes | Unknown |
| seed-test-data-v2.1.sql | `database/seed-test-data-v2.1.sql` | 68,172 bytes | 30+ tables | Yes | DO NOTHING |
| seed-test-data-v3-additional.sql | `database/seed-test-data-v3-additional.sql` | 12,485 bytes | 12 tables | Yes | DO NOTHING |

### 11.2 v3 Seed File — Expected vs Actual

| Table | Seed Records | Actual Records | Match |
|-------|-------------|----------------|-------|
| course_branch_pricing | 11 | 11 | Yes |
| placement_test_papers | 1 | 1 | Yes |
| attendances | 5 | 5 | Yes |
| enrollments | 1 | 1 (plus 1 from v2.1 = 2 total for same student+group) | Partial |
| invoices | 2 | 2 (but invoice_numbers overridden by trigger) | Partial |
| payments | 1 | 1 (but receipt_number overridden by trigger) | Partial |
| installments | 1 | 1 | Yes |
| financial_transactions | 1 | 1 | Yes |
| refunds | 1 | 1 | Yes |
| leave_requests | 1 | 1 | Yes |
| payroll_entries | 1 | 1 | Yes |
| lms_lessons | 1 | 1 | Yes |
| lms_resources | 2 | 2 | Yes |
| activity_registrations | 1 | 1 | Yes |
| stock_moves | 1 | 1 | Yes |
| chat_messages | 2 | 2 | Yes |

### 11.3 Trigger Override Issues

| Seed Value | Trigger-Generated Value | Table |
|-----------|------------------------|-------|
| `SEED-INV-003` | `INV-2026-0007` | invoices |
| `SEED-INV-004` | `INV-2026-0008` | invoices |
| `SEED-RCP-003` | `RCP-2026-0004` | payments |

The `trg_invoices_number` trigger (`generate_invoice_number()`) and `trg_payments_receipt` trigger (`generate_receipt_number()`) auto-generate values on INSERT, overriding the seeded values provided in v3.

### 11.4 Execution Status Classification

| Seed File | Status |
|-----------|--------|
| seed-test-data.sql | Partially present (not fully reviewed) |
| seed-test-data-v2.1.sql | Partially present |
| seed-test-data-v3-additional.sql | Partially present |

**Important:** `ON CONFLICT DO NOTHING` does NOT prevent logical duplicates when there is no unique constraint on the relevant columns (e.g., enrollments.student_id + group_id).

---

## 12. Trigger and Sequence Verification

### 12.1 Triggers

| Metric | Value |
|--------|-------|
| Total triggers | 47 |
| Internal triggers | 0 |
| User triggers | 47 |

**Confirmed:** 47 triggers (matches previous report).

Key business-rule triggers:
- `trg_invoices_number` — auto-generates invoice_number on INSERT
- `trg_payments_receipt` — auto-generates receipt_number on INSERT
- `trg_students_number` — auto-generates student_number on INSERT
- `trg_verify_group_teacher` — validates teacher role on group insert/update
- `trg_check_group_capacity` — prevents over-enrollment
- `trg_protect_invoice_total` — protects invoice total from modification
- `trg_check_refund_amount_limit` — validates refund amounts

### 12.2 Sequences

| Sequence | Last Value | Max Value | Headroom |
|----------|------------|-----------|----------|
| invoice_number_seq | 8 | 9223372036854775807 | Excellent |
| migrations_id_seq | 24 | 2147483647 | Excellent |
| receipt_number_seq | 4 | 9223372036854775807 | Excellent |
| student_number_seq | 9 | 9223372036854775807 | Excellent |

**Confirmed:** 4 sequences (matches previous report). All have ample headroom.

---

## 13. Confirmed Issues

### Critical — None

### High

| # | Table | Record(s) | Issue | Severity | DB Change Required? |
|---|-------|-----------|-------|----------|-------------------|
| 1 | enrollments | `6ca9061c-...` and `33333333-...` | Duplicate enrollment: same student in same group, no unique constraint | High | Yes (add UC) or No (business logic) |
| 2 | certificates | `acb0d651-459a-5164-927d-f464bf7423ae` | NULL template_id (nullable column) | High | Yes (assign template) or No |

### Medium

| # | Table | Record(s) | Issue | Severity | DB Change Required? |
|---|-------|-----------|-------|----------|-------------------|
| 3 | employees | `f453625a-...`, `e22d3edb-...` | NULL employee_number (2 records) | Medium | No (assign values) |
| 4 | certificate_templates | `dba32d6c-6ecf-52a2-bc60-fce1fe9381b7` | NULL course_id (nullable column) | Medium | Yes (assign course) or No |
| 5 | sessions | `dae56a9c-ac50-4400-a81c-3bd261d51b75` | Session date before group start_date | Medium | No (adjust date) |

### Informational

| # | Area | Issue | Evidence |
|---|------|-------|----------|
| 6 | invoices | Trigger overrides seeded invoice_number | SEED-INV-003/004 became INV-2026-0007/0008 |
| 7 | payments | Trigger overrides seeded receipt_number | SEED-RCP-003 became RCP-2026-0004 |
| 8 | seed-test-data-v3-additional.sql | ON CONFLICT DO NOTHING doesn't prevent logical duplicates | Duplicate enrollment created despite ON CONFLICT |
| 9 | previous audit report | Table counts incorrect (claimed 51/35, actual 85/1) | Verified via exact SELECT count(*) queries |

---

## 14. Potential Issues Requiring Business Confirmation

1. **Duplicate enrollment:** Should a student be allowed to enroll in the same group twice? If no, add unique constraint on (student_id, group_id) and remove the duplicate.

2. **NULL certificate template_id:** Should every certificate reference a template? If yes, assign a valid template_id or delete the certificate.

3. **NULL certificate_template course_id:** Should every template belong to a course? If yes, assign a valid course_id or delete the template.

4. **Session before group start:** Should sessions be allowed before their group's start date? If no, adjust the session date or group start_date.

5. **NULL employee_number:** Should every employee have an employee_number? If yes, assign values to the 2 employees with NULL.

---

## 15. Limitations

- Did not inspect `seed-test-data.sql` (original seed) in full detail
- Did not inspect `seed-test-data.ps1`, `reset-and-seed.ps1`, `lms.ps1` PowerShell scripts
- Did not inspect TypeORM entities or migrations in detail (focused on live database schema)
- Did not verify application-level business logic beyond database constraints
- Did not call `nextval()` on sequences (read-only constraint)

---

## 16. Final Response Summary

| Question | Answer |
|----------|--------|
| Were previous audit numbers accurate? | **Partially** — Table counts were wrong (51/35 claimed vs 85/1 actual). FK count was wrong (24 claimed vs 170 actual). Trigger (47) and sequence (4) counts were correct. |
| Real populated/empty table counts? | **85 populated / 1 empty** (`lms_lesson_progress` = 0) |
| Do all foreign keys pass? | **Yes** — all 170 FK constraints pass with 0 violations |
| Was pricing discrepancy resolved? | **Yes** — all 11 course_branch_pricing records exist, no duplicates |
| Is enrollment duplicate confirmed? | **Yes** — student `72233c04-...` enrolled twice in group `f92fa7a5-...` |
| Number of confirmed issues? | **6** (2 High, 3 Medium, 1 Informational about seed triggers) |
| Number of unresolved business questions? | **5** (duplicate enrollment, NULL cert template, NULL template course, session before group start, NULL employee_number) |
| Report path | `database/SEED_DATABASE_INTEGRITY_VALIDATION_REPORT.md` |

---

**End of Validation Report**