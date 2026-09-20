# Edits to make in your original seed file

Only two blocks change. Everything else stays as is.

## 1. Replace the `test_questions` block

FIND:

```sql
-- test_questions
INSERT INTO test_questions (id,question_text,type,correct_answer,level,category,points,is_active) VALUES
('36c38ed7-ce4d-55ac-81f6-0631004fae64','Seed question','mcq','"A"'::jsonb,'A1','grammar',1,TRUE)
ON CONFLICT DO NOTHING;
```

REPLACE WITH the contents of the `test_questions` section of `01_seed_placement_patch.sql`
(steps 2 and 3, the two INSERT ... ON CONFLICT (id) DO UPDATE statements).

## 2. Delete the `placement_test_answers` block

DELETE:

```sql
-- placement_test_answers
INSERT INTO placement_test_answers (id,test_id,question_id,answer,score,is_correct) VALUES
('871a352e-c6ae-54a9-949d-e9b84e9503df','4528edc2-673c-51c2-8b4a-ec9405a70eea','36c38ed7-ce4d-55ac-81f6-0631004fae64','"A"'::jsonb,1,TRUE)
ON CONFLICT DO NOTHING;
```

Why: it stores an answer for a test that has never been taken. It collided with the first real
submit (`uq_pta_test_question`), and it makes "has this test been submitted?" ambiguous.
