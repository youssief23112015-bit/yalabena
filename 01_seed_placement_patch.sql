-- =====================================================================
-- SPEAK UP TMS - Placement written-test seed patch (idempotent)
-- Run against the CURRENT database (after the schema + main seed):
--   docker exec -i speakup-postgres psql -U postgres -d speakup_tms < 01_seed_placement_patch.sql
-- Safe to run more than once.
-- =====================================================================
BEGIN;

-- 1) The original seed pre-filled an answer for a test nobody had taken.
--    That row collided with the first real submit (uq_pta_test_question).
DELETE FROM placement_test_answers
WHERE id = '871a352e-c6ae-54a9-949d-e9b84e9503df';

-- 2) Give the original seed question real options and a text answer.
--    (The old seed had no options and correct_answer "A".)
INSERT INTO test_questions (id, question_text, type, options, correct_answer, level, category, points, is_active)
VALUES (
  '36c38ed7-ce4d-55ac-81f6-0631004fae64',
  'What is the correct form: She ___ a student?',
  'mcq',
  '["am","is","are","be"]'::jsonb,
  '"is"'::jsonb,
  'A1', 'grammar', 1, TRUE
)
ON CONFLICT (id) DO UPDATE SET
  question_text  = EXCLUDED.question_text,
  type           = EXCLUDED.type,
  options        = EXCLUDED.options,
  correct_answer = EXCLUDED.correct_answer,
  level          = EXCLUDED.level,
  category       = EXCLUDED.category,
  points         = EXCLUDED.points,
  is_active      = EXCLUDED.is_active;

-- 3) More A1 questions so the test can actually tell students apart.
INSERT INTO test_questions (id, question_text, type, options, correct_answer, level, category, points, is_active) VALUES
('524c9909-f738-56e3-bbbb-72431b934e2a','I ___ from Egypt.','mcq','["am", "is", "are", "be"]'::jsonb,'"am"'::jsonb,'A1','grammar',1,TRUE),
('2b696321-b6ed-5b56-99d0-209be3e00b71','They ___ my friends.','mcq','["am", "is", "are", "be"]'::jsonb,'"are"'::jsonb,'A1','grammar',1,TRUE),
('2519ad06-4473-599b-a1e9-2cb0b6e0ee50','He ___ a car.','mcq','["have", "has", "having", "haves"]'::jsonb,'"has"'::jsonb,'A1','grammar',1,TRUE),
('2eee5662-b113-5332-a4f4-07b56c057e85','___ you like coffee?','mcq','["Do", "Does", "Is", "Are"]'::jsonb,'"Do"'::jsonb,'A1','grammar',1,TRUE),
('94e75cdd-daa5-5be9-99fa-da8f7234d3cc','This is ___ apple.','mcq','["a", "an", "the", "any"]'::jsonb,'"an"'::jsonb,'A1','grammar',1,TRUE),
('8682b576-eec4-50c2-82ed-f11376cd1f27','There ___ two books on the table.','mcq','["is", "am", "are", "be"]'::jsonb,'"are"'::jsonb,'A1','grammar',1,TRUE),
('a8fe7955-871c-5274-9a88-6bf2a45e4119','What ___ your name?','mcq','["is", "are", "am", "do"]'::jsonb,'"is"'::jsonb,'A1','grammar',1,TRUE),
('d0f943e9-fd62-5760-877c-acbe0c4df38a','She ___ to school every day.','mcq','["go", "goes", "going", "gone"]'::jsonb,'"goes"'::jsonb,'A1','grammar',1,TRUE),
('980448a7-7162-5374-ad0e-44638a395d11','My name ___ Ali. (be)','fill_blank',NULL,'"is"'::jsonb,'A1','grammar',1,TRUE),
('5b6fb1aa-b185-5877-87dc-b16337d2c162','We ___ students. (be)','fill_blank',NULL,'"are"'::jsonb,'A1','grammar',1,TRUE)
ON CONFLICT (id) DO UPDATE SET
  question_text  = EXCLUDED.question_text,
  type           = EXCLUDED.type,
  options        = EXCLUDED.options,
  correct_answer = EXCLUDED.correct_answer,
  level          = EXCLUDED.level,
  category       = EXCLUDED.category,
  points         = EXCLUDED.points,
  is_active      = EXCLUDED.is_active;

COMMIT;

-- Check:
-- SELECT type, count(*) FROM test_questions WHERE is_active AND level='A1' GROUP BY type;
