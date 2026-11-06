-- =====================================================================
-- 04_chat_violations_nullable_message_id.sql
-- Chat compliance fix (SRS §6.4).
--
-- chat_violations.message_id was created NOT NULL, but a BLOCKED message is
-- never inserted into chat_messages, so recordViolation(messageId = null)
-- failed with:
--   null value in column "message_id" of relation "chat_violations"
--   violates not-null constraint
-- and the client received "Internal server error" instead of the required
-- "Sharing personal contact info is not allowed…" response, and no violation
-- row was stored (moderator queue stayed empty).
--
-- The entity, the TypeORM migration 1789000000000-CreateChatTables.ts and the
-- newer database backups already treat the column as nullable. This patch
-- aligns the live schema with them. Relaxing a constraint only; no data is
-- modified. Safe to run more than once.
--
-- Run:
--   docker exec -i speakup-postgres psql -U postgres -d speakup_tms < 04_chat_violations_nullable_message_id.sql
-- =====================================================================
BEGIN;

ALTER TABLE chat_violations ALTER COLUMN message_id DROP NOT NULL;

COMMIT;
