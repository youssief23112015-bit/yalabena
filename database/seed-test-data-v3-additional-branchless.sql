-- SPEAK UP TMS - ADDITIONAL TEST SEED (v3, branchless)
-- Supplements seed-test-data-v2.1.sql with missing and under-seeded tables.
-- Idempotent: safe to run multiple times (ON CONFLICT DO NOTHING).
-- NOTE: course_branch_pricing and branches tables were removed by the
-- RemoveBranches migration. Sections referencing them or branch_id columns
-- have been adjusted to match the branchless schema.
SET TIME ZONE 'Africa/Cairo';

-- ============================================================
-- 2. placement_test_papers (0 rows -> seeded)
-- Test papers for existing placement tests
-- ============================================================
INSERT INTO placement_test_papers (id, test_id, level, question_ids, generated_at) VALUES
('11111111-2222-3333-4444-555566667777', '4528edc2-673c-51c2-8b4a-ec9405a70eea', 'A1', '["36c38ed7-ce4d-55ac-81f6-0631004fae64"]'::jsonb, NOW() - INTERVAL '1 day')
ON CONFLICT (test_id) DO NOTHING;

-- ============================================================
-- 3. Additional attendances for meaningful dashboard data
-- Different sessions, students, and statuses
-- ============================================================
INSERT INTO attendances (id, session_id, student_id, status, check_in_method, check_in_time, minutes_late, notes, created_by) VALUES
('22222222-3333-4444-5555-666677778881', '62a65381-78bd-451b-a4ef-6193c9ced129', 'b8430eec-4181-577f-a38b-933397704e7a', 'present', 'manual', NOW() - INTERVAL '19 days', 0, 'On time', 'd3995993-c92b-5696-b5eb-f7f09a1031e4'),
('22222222-3333-4444-5555-666677778882', 'dae56a9c-ac50-4400-a81c-3bd261d51b75', 'b8430eec-4181-577f-a38b-933397704e7a', 'absent', 'manual', NULL, 0, 'No show', '76405d67-fa63-58d9-bfd7-601661734136'),
('22222222-3333-4444-5555-666677778883', '23b3756a-0eae-560e-baf6-b47d981b4ff1', '72233c04-278a-5fb3-bf78-af38772e9a13', 'present', 'qr_code', NOW() - INTERVAL '8 days', 5, 'QR check-in', '76405d67-fa63-58d9-bfd7-601661734136'),
('22222222-3333-4444-5555-666677778884', '62a65381-78bd-451b-a4ef-6193c9ced129', '72233c04-278a-5fb3-bf78-af38772e9a13', 'late', 'manual', NOW() - INTERVAL '19 days', 15, 'Arrived 15 min late', 'd3995993-c92b-5696-b5eb-f7f09a1031e4'),
('22222222-3333-4444-5555-666677778885', 'dae56a9c-ac50-4400-a81c-3bd261d51b75', '72233c04-278a-5fb3-bf78-af38772e9a13', 'excused', 'manual', NULL, 0, 'Medical excuse', '76405d67-fa63-58d9-bfd7-601661734136')
ON CONFLICT (session_id, student_id) DO NOTHING;

-- ============================================================
-- 4. Additional financial data
-- More refunds, payments, installments, transactions
-- ============================================================
-- Additional enrollment for overdue invoice
INSERT INTO enrollments (id, student_id, group_id, total_fee, discount_amount, final_amount, status, enrolled_at, enrolled_by) VALUES
('33333333-4444-5555-6666-777788889901', '72233c04-278a-5fb3-bf78-af38772e9a13', 'f92fa7a5-6c6a-596c-9af1-dc13dfa70976', 3200, 200, 3000, 'active', NOW() - INTERVAL '20 days', '78cfa859-27ec-5273-8937-3446b7575ce2')
ON CONFLICT DO NOTHING;
-- Overdue invoice (branch_id column removed -- branchless schema)
INSERT INTO invoices (id, invoice_number, enrollment_id, student_id, subtotal, discount_amount, tax_amount, total_amount, paid_amount, balance_due, status, due_date, notes, created_by) VALUES
('33333333-4444-5555-6666-777788889902', 'SEED-INV-003', '33333333-4444-5555-6666-777788889901', '72233c04-278a-5fb3-bf78-af38772e9a13', 3200, 200, 0, 3000, 0, 3000, 'overdue', CURRENT_DATE - INTERVAL '10 days', 'Overdue seed invoice', '5ab51db0-5fba-52ca-b0a4-5528705e2e5f')
ON CONFLICT DO NOTHING;
-- Unpaid invoice for dashboard testing
INSERT INTO enrollments (id, student_id, group_id, total_fee, discount_amount, final_amount, status, enrolled_at, enrolled_by) VALUES
('33333333-4444-5555-6666-777788889903', 'b8430eec-4181-577f-a38b-933397704e7a', '04c1d0a6-9130-5772-b133-8de94693d52f', 2800, 0, 2800, 'active', NOW() - INTERVAL '10 days', '9b3dc22e-70c1-5ab5-85c3-25adcbc05b77')
ON CONFLICT DO NOTHING;
INSERT INTO invoices (id, invoice_number, enrollment_id, student_id, subtotal, discount_amount, tax_amount, total_amount, paid_amount, balance_due, status, due_date, notes, created_by) VALUES
('33333333-4444-5555-6666-777788889904', 'SEED-INV-004', '33333333-4444-5555-6666-777788889903', 'b8430eec-4181-577f-a38b-933397704e7a', 2800, 0, 0, 2800, 0, 2800, 'unpaid', CURRENT_DATE + INTERVAL '20 days', 'Unpaid seed invoice', '5ab51db0-5fba-52ca-b0a4-5528705e2e5f')
ON CONFLICT DO NOTHING;
-- Additional payment on overdue invoice (partial)
INSERT INTO payments (id, invoice_id, amount, method, reference, paid_at, recorded_by, status, receipt_number) VALUES
('44444444-5555-6666-7777-888899990001', '33333333-4444-5555-6666-777788889902', 500, 'cash', 'SEED-CASH-003', NOW() - INTERVAL '5 days', '5ab51db0-5fba-52ca-b0a4-5528705e2e5f', 'completed', 'SEED-RCP-003')
ON CONFLICT DO NOTHING;
-- Additional installment
INSERT INTO installments (id, invoice_id, installment_number, amount, due_date, paid_amount, paid_at, status) VALUES
('44444444-5555-6666-7777-888899990002', '33333333-4444-5555-6666-777788889902', 2, 1000, CURRENT_DATE + INTERVAL '5 days', 0, NULL, 'pending')
ON CONFLICT DO NOTHING;
-- Additional financial transaction (branch_id column removed -- branchless schema)
INSERT INTO financial_transactions (id, invoice_id, payment_id, transaction_type, direction, amount, transaction_date, description, created_by) VALUES
('44444444-5555-6666-7777-888899990003', '33333333-4444-5555-6666-777788889902', '44444444-5555-6666-7777888899990001', 'payment', 'in', 500, NOW() - INTERVAL '5 days', 'Cash partial payment', '5ab51db0-5fba-52ca-b0a4-5528705e2e5f')
ON CONFLICT DO NOTHING;
-- Additional refund
INSERT INTO refunds (id, payment_id, invoice_id, amount, reason_code, status, approved_by, approved_at, processed_by, processed_at) VALUES
('55555555-6666-7777-8888-999900000001', 'eebb1de8-d361-535d-8b91-2f31f6eec30e', '72413858-0205-5187-904b-9c4c1feb949a', 200, 'duplicate_payment', 'pending', '31d5ee25-71b5-5dbb-93cb-818ee85e084b', NULL, NULL, NULL)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 5. Additional HR data
-- More leave requests and payroll entries
-- ============================================================
-- Additional leave request (pending)
INSERT INTO leave_requests (id, employee_id, type, start_date, end_date, days_count, reason, status, approved_by, approved_at) VALUES
('55555555-6666-7777-8888-999900000002', '36f5ca2e-4a22-521a-be89-c2df80e55605', 'sick', CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE + INTERVAL '5 days', 1, 'Sick leave request', 'pending', NULL, NULL)
ON CONFLICT DO NOTHING;
-- Additional payroll entry
INSERT INTO payroll_entries (id, payroll_period_id, employee_id, base_amount, total_amount, hours_worked, classes_taught, bonus, deductions, hourly_rate, status) VALUES
('55555555-6666-7777-8888-999900000003', '72b961fe-e3d6-5cd3-a0da-14ffd38ed053', '36f5ca2e-4a22-521a-be89-c2df80e55605', 19500, 20000, 160, 22, 1500, 1000, 121.88, 'approved')
ON CONFLICT DO NOTHING;
-- ============================================================
-- 6. Additional LMS data
-- More lessons, resources for existing modules
-- ============================================================
INSERT INTO lms_lessons (id, module_id, name, content, type, duration_minutes, "order", is_published) VALUES
('66666666-7777-8888-9999-000000000001', 'c30e63bc-a75f-53e8-b304-21c7f2640875', 'A1 Reading Practice', 'Reading comprehension exercise for beginners.', 'content', 40, 2, TRUE)
ON CONFLICT DO NOTHING;
INSERT INTO lms_resources (id, lesson_id, name, type, external_url, access_control) VALUES
('66666666-7777-8888-9999-000000000002', '66666666-7777-8888-9999-000000000001', 'Reading PDF', 'pdf', 'https://example.com/a1-reading.pdf', 'enrolled')
ON CONFLICT DO NOTHING;
INSERT INTO lms_resources (id, lesson_id, name, type, external_url, access_control) VALUES
('66666666-7777-8888-9999-000000000003', 'fad3d413-278b-51de-ad41-05ef90679599', 'Introduction Video', 'video', 'https://example.com/a1-intro.mp4', 'enrolled')
ON CONFLICT DO NOTHING;
-- ============================================================
-- 7. Additional activity registrations
-- ============================================================
INSERT INTO activity_registrations (id, activity_id, student_id, status, paid_amount) VALUES
('77777777-8888-9999-0000-111122223331', '352c4d22-8676-51c6-939c-d4f5a6a9f0de', 'b8430eec-4181-577f-a38b-933397704e7a', 'registered', 50)
ON CONFLICT DO NOTHING;
-- ============================================================
-- 8. Additional stock moves (branch_id column removed -- branchless schema)
-- ============================================================
INSERT INTO stock_moves (id, item_id, type, quantity, unit_cost, reason, reference_type, created_by) VALUES
('88888888-9999-0000-1111-222233334441', '46880901-cff0-5c43-a855-91d0d0b457d5', 'out', 2, 120, 'Student issue', 'manual', '78cfa859-27ec-5273-8937-3446b7575ce2')
ON CONFLICT DO NOTHING;
-- ============================================================
-- 9. Additional chat messages
-- ============================================================
INSERT INTO chat_messages (id, room_id, sender_id, body, type) VALUES
('99999999-0000-1111-2222-333344445551', '238d8c87-ad12-5b9f-a30d-94261a593f33', '76405d67-fa63-58d9-bfd7-601661734136', 'Homework is due tomorrow.', 'text'),
('99999999-0000-1111-2222-333344445552', '238d8c87-ad12-5b9f-a30d-94261a593f33', '006db1c6-18d5-587c-8640-6996aa62605d', 'Thank you, teacher.', 'text')
ON CONFLICT DO NOTHING;
-- ============================================================
-- Verification query
-- ============================================================
SELECT 'placement_test_papers' AS table_name, COUNT(*) AS row_count FROM placement_test_papers
UNION ALL SELECT 'attendances', COUNT(*) FROM attendances
UNION ALL SELECT 'enrollments', COUNT(*) FROM enrollments
UNION ALL SELECT 'invoices', COUNT(*) FROM invoices WHERE invoice_number LIKE 'SEED-%'
UNION ALL SELECT 'payments', COUNT(*) FROM payments WHERE receipt_number LIKE 'SEED-%'
UNION ALL SELECT 'installments', COUNT(*) FROM installments
UNION ALL SELECT 'refunds', COUNT(*) FROM refunds
UNION ALL SELECT 'financial_transactions', COUNT(*) FROM financial_transactions
UNION ALL SELECT 'leave_requests', COUNT(*) FROM leave_requests
UNION ALL SELECT 'payroll_entries', COUNT(*) FROM payroll_entries
UNION ALL SELECT 'lms_lessons', COUNT(*) FROM lms_lessons
UNION ALL SELECT 'lms_resources', COUNT(*) FROM lms_resources
UNION ALL SELECT 'activity_registrations', COUNT(*) FROM activity_registrations
UNION ALL SELECT 'stock_moves', COUNT(*) FROM stock_moves
UNION ALL SELECT 'chat_messages', COUNT(*) FROM chat_messages
ORDER BY table_name;
