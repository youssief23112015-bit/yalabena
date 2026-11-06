import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * ASSUMPTION: I don't know this project's actual migrations folder or
 * whether it uses TypeORM CLI migrations vs. `synchronize: true`. If you
 * use `synchronize: true` in dev, you don't need this file at all — the
 * ChatConsent entity will create its own table automatically. If you use
 * real migrations, move this into wherever your existing migration files
 * live (the repo has a top-level `database/` folder — likely there) and
 * rename it to match your naming convention; the class name below follows
 * TypeORM CLI's default `Name + timestamp` pattern.
 */
export class CreateChatConsents1727600000000 implements MigrationInterface {
  name = 'CreateChatConsents1727600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "chat_consents" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "accepted_at" TIMESTAMPTZ NOT NULL,
        "policy_version" varchar(20) NOT NULL DEFAULT '1.0',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_chat_consents" PRIMARY KEY ("id")
      );
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_chat_consents_user_id" ON "chat_consents" ("user_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_chat_consents_user_id";`);
    await queryRunner.query(`DROP TABLE "chat_consents";`);
  }
}
