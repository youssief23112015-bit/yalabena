-- Dev only: reset the seeded placement test so it can be taken again.
--   docker exec -i speakup-postgres psql -U postgres -d speakup_tms < 02_reset_placement_test.sql
BEGIN;
DELETE FROM placement_test_answers
WHERE test_id = '4528edc2-673c-51c2-8b4a-ec9405a70eea';

UPDATE placement_tests
SET written_score = NULL,
    status = 'scheduled'
WHERE id = '4528edc2-673c-51c2-8b4a-ec9405a70eea';
COMMIT;
