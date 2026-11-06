-- Dev only: reset the seeded placement test so it can be taken again.
--   Get-Content .\02_reset_placement_test.sql | docker exec -i speakup-postgres psql -U postgres -d speakup_tms
BEGIN;

DELETE FROM placement_test_answers
WHERE test_id = '4528edc2-673c-51c2-8b4a-ec9405a70eea';

DELETE FROM placement_test_papers
WHERE test_id = '4528edc2-673c-51c2-8b4a-ec9405a70eea';

UPDATE placement_tests
SET written_score = NULL,
    status = 'scheduled'
WHERE id = '4528edc2-673c-51c2-8b4a-ec9405a70eea';

COMMIT;