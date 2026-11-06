import { MigrationInterface, QueryRunner } from "typeorm";
export class CreateChatTables1789000000000 implements MigrationInterface {
    name = "CreateChatTables1789000000000";
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "public"."chat_rooms_type_enum"
            AS ENUM('one_on_one', 'group', 'announcement')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."chat_messages_type_enum"
            AS ENUM('text', 'emoji', 'image', 'file', 'system')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."chat_violations_action_taken_enum"
            AS ENUM('blocked', 'warned', 'flagged_only')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."chat_strikes_action_enum"
            AS ENUM('warning', 'mute_24h', 'ban_permanent')
        `);
//  chat_rooms
        await queryRunner.query(`
            CREATE TABLE "chat_rooms" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "type" "public"."chat_rooms_type_enum" NOT NULL,
                "group_id" uuid,
                "name" character varying(150),
                "topic" character varying(255),
                "is_archived" boolean NOT NULL DEFAULT false,
                "archived_at" TIMESTAMP WITH TIME ZONE,
                "created_by" uuid,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_chat_rooms_id" PRIMARY KEY ("id")
            )
        `);
//  chat_room_members
        await queryRunner.query(`
            CREATE TABLE "chat_room_members" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "room_id" uuid NOT NULL,
                "user_id" uuid NOT NULL,
                "role" character varying(20) NOT NULL DEFAULT 'member',
                "joined_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "last_read_at" TIMESTAMP WITH TIME ZONE,
                "is_muted" boolean NOT NULL DEFAULT false,
                "muted_until" TIMESTAMP WITH TIME ZONE,
                "is_banned" boolean NOT NULL DEFAULT false,
                "banned_until" TIMESTAMP WITH TIME ZONE,
                "ban_reason" text,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_chat_room_members_id" PRIMARY KEY ("id")
            )
        `);
//  chat_messages
        await queryRunner.query(`
            CREATE TABLE "chat_messages" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "room_id" uuid NOT NULL,
                "sender_id" uuid NOT NULL,
                "body" text,
                "type" "public"."chat_messages_type_enum" NOT NULL DEFAULT 'text',
                "file_url" character varying(500),
                "file_size" bigint,
                "file_name" character varying(255),
                "reply_to_id" uuid,
                "edited_at" TIMESTAMP WITH TIME ZONE,
                "edited_count" integer NOT NULL DEFAULT 0,
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                "is_flagged" boolean NOT NULL DEFAULT false,
                "flag_reason" character varying(100),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_chat_messages_id" PRIMARY KEY ("id")
            )
        `);
//  chat_violations
        await queryRunner.query(`
            CREATE TABLE "chat_violations" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "message_id" uuid,
                "room_id" uuid NOT NULL,
                "sender_id" uuid NOT NULL,
                "rule_matched" character varying(100) NOT NULL,
                "original_message" text NOT NULL,
                "action_taken" "public"."chat_violations_action_taken_enum" NOT NULL,
                "moderator_id" uuid,
                "moderator_note" text,
                "resolved_at" TIMESTAMP WITH TIME ZONE,
                "is_false_positive" boolean NOT NULL DEFAULT false,
                "detection_method" character varying(50) NOT NULL DEFAULT 'text_regex',
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_chat_violations_id" PRIMARY KEY ("id")
            )
        `);
//  chat_strikes
        await queryRunner.query(`
            CREATE TABLE "chat_strikes" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "violation_id" uuid NOT NULL,
                "strike_number" integer NOT NULL,
                "action" "public"."chat_strikes_action_enum" NOT NULL,
                "expires_at" TIMESTAMP WITH TIME ZONE,
                "applied_by" uuid,
                "applied_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "is_active" boolean NOT NULL DEFAULT true,
                CONSTRAINT "PK_chat_strikes_id" PRIMARY KEY ("id")
            )
        `);
//  chat_rooms -> groups
        await queryRunner.query(`
            ALTER TABLE "chat_rooms"
            ADD CONSTRAINT "FK_chat_rooms_group"
            FOREIGN KEY ("group_id")
            REFERENCES "groups"("id")
            ON DELETE SET NULL
            ON UPDATE NO ACTION
        `);
//  chat_rooms -> users
        await queryRunner.query(`
            ALTER TABLE "chat_rooms"
            ADD CONSTRAINT "FK_chat_rooms_creator"
            FOREIGN KEY ("created_by")
            REFERENCES "users"("id")
            ON DELETE SET NULL
            ON UPDATE NO ACTION
        `);
//  chat_room_members -> chat_rooms
        await queryRunner.query(`
            ALTER TABLE "chat_room_members"
            ADD CONSTRAINT "FK_chat_room_members_room"
            FOREIGN KEY ("room_id")
            REFERENCES "chat_rooms"("id")
            ON DELETE CASCADE
            ON UPDATE NO ACTION
        `);
//  chat_room_members -> users
        await queryRunner.query(`
            ALTER TABLE "chat_room_members"
            ADD CONSTRAINT "FK_chat_room_members_user"
            FOREIGN KEY ("user_id")
            REFERENCES "users"("id")
            ON DELETE CASCADE
            ON UPDATE NO ACTION
        `);
//  chat_messages -> chat_rooms
        await queryRunner.query(`
            ALTER TABLE "chat_messages"
            ADD CONSTRAINT "FK_chat_messages_room"
            FOREIGN KEY ("room_id")
            REFERENCES "chat_rooms"("id")
            ON DELETE CASCADE
            ON UPDATE NO ACTION
        `);
//  chat_messages -> users
        await queryRunner.query(`
            ALTER TABLE "chat_messages"
            ADD CONSTRAINT "FK_chat_messages_sender"
            FOREIGN KEY ("sender_id")
            REFERENCES "users"("id")
            ON DELETE CASCADE
            ON UPDATE NO ACTION
        `);
//  chat_messages -> chat_messages
        await queryRunner.query(`
            ALTER TABLE "chat_messages"
            ADD CONSTRAINT "FK_chat_messages_reply"
            FOREIGN KEY ("reply_to_id")
            REFERENCES "chat_messages"("id")
            ON DELETE SET NULL
            ON UPDATE NO ACTION
        `);
//  chat_violations -> chat_rooms
        await queryRunner.query(`
            ALTER TABLE "chat_violations"
            ADD CONSTRAINT "FK_chat_violations_room"
            FOREIGN KEY ("room_id")
            REFERENCES "chat_rooms"("id")
            ON DELETE CASCADE
            ON UPDATE NO ACTION
        `);
//  chat_violations -> users
        await queryRunner.query(`
            ALTER TABLE "chat_violations"
            ADD CONSTRAINT "FK_chat_violations_sender"
            FOREIGN KEY ("sender_id")
            REFERENCES "users"("id")
            ON DELETE CASCADE
            ON UPDATE NO ACTION
        `);
//  chat_violations -> users (moderator)
        await queryRunner.query(`
            ALTER TABLE "chat_violations"
            ADD CONSTRAINT "FK_chat_violations_moderator"
            FOREIGN KEY ("moderator_id")
            REFERENCES "users"("id")
            ON DELETE SET NULL
            ON UPDATE NO ACTION
        `);
        /*
         * IMPORTANT:
         * Do NOT create the chat_violations.message_id FK here.
         * Stage3Check.ts owns that FK and creates it with the
         * exact constraint name it expects.
         */
//  chat_strikes -> users
        await queryRunner.query(`
            ALTER TABLE "chat_strikes"
            ADD CONSTRAINT "FK_chat_strikes_user"
            FOREIGN KEY ("user_id")
            REFERENCES "users"("id")
            ON DELETE CASCADE
            ON UPDATE NO ACTION
        `);
//  chat_strikes -> chat_violations
        await queryRunner.query(`
            ALTER TABLE "chat_strikes"
            ADD CONSTRAINT "FK_chat_strikes_violation"
            FOREIGN KEY ("violation_id")
            REFERENCES "chat_violations"("id")
            ON DELETE CASCADE
            ON UPDATE NO ACTION
        `);
//  chat_strikes -> users (applied_by)
        await queryRunner.query(`
            ALTER TABLE "chat_strikes"
            ADD CONSTRAINT "FK_chat_strikes_applied_by"
            FOREIGN KEY ("applied_by")
            REFERENCES "users"("id")
            ON DELETE SET NULL
            ON UPDATE NO ACTION
        `);
//  Indexes
        await queryRunner.query(`
            CREATE INDEX "IDX_chat_room_members_room_id"
            ON "chat_room_members" ("room_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_chat_room_members_user_id"
            ON "chat_room_members" ("user_id")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_chat_room_members_room_user"
            ON "chat_room_members" ("room_id", "user_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_chat_messages_room_id"
            ON "chat_messages" ("room_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_chat_messages_sender_id"
            ON "chat_messages" ("sender_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_chat_violations_room_id"
            ON "chat_violations" ("room_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_chat_violations_sender_id"
            ON "chat_violations" ("sender_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_chat_strikes_user_id"
            ON "chat_strikes" ("user_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_chat_strikes_violation_id"
            ON "chat_strikes" ("violation_id")
        `);
    }
    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX IF EXISTS "public"."IDX_chat_strikes_violation_id"
        `);
        await queryRunner.query(`
            DROP INDEX IF EXISTS "public"."IDX_chat_strikes_user_id"
        `);
        await queryRunner.query(`
            DROP INDEX IF EXISTS "public"."IDX_chat_violations_sender_id"
        `);
        await queryRunner.query(`
            DROP INDEX IF EXISTS "public"."IDX_chat_violations_room_id"
        `);
        await queryRunner.query(`
            DROP INDEX IF EXISTS "public"."IDX_chat_messages_sender_id"
        `);
        await queryRunner.query(`
            DROP INDEX IF EXISTS "public"."IDX_chat_messages_room_id"
        `);
        await queryRunner.query(`
            DROP INDEX IF EXISTS "public"."IDX_chat_room_members_room_user"
        `);
        await queryRunner.query(`
            DROP INDEX IF EXISTS "public"."IDX_chat_room_members_user_id"
        `);
        await queryRunner.query(`
            DROP INDEX IF EXISTS "public"."IDX_chat_room_members_room_id"
        `);
        await queryRunner.query(`
            DROP TABLE IF EXISTS "chat_strikes"
        `);
        await queryRunner.query(`
            DROP TABLE IF EXISTS "chat_violations"
        `);
        await queryRunner.query(`
            DROP TABLE IF EXISTS "chat_messages"
        `);
        await queryRunner.query(`
            DROP TABLE IF EXISTS "chat_room_members"
        `);
        await queryRunner.query(`
            DROP TABLE IF EXISTS "chat_rooms"
        `);
        await queryRunner.query(`
            DROP TYPE IF EXISTS "public"."chat_strikes_action_enum"
        `);
        await queryRunner.query(`
            DROP TYPE IF EXISTS "public"."chat_violations_action_taken_enum"
        `);
        await queryRunner.query(`
            DROP TYPE IF EXISTS "public"."chat_messages_type_enum"
        `);
        await queryRunner.query(`
            DROP TYPE IF EXISTS "public"."chat_rooms_type_enum"
        `);
    }
}
