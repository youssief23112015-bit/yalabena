import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds assigned_to column to support_tickets for ticket assignment.
 */
export class AddSupportTicketAssignee1800000000000
  implements MigrationInterface
{
  name = 'AddSupportTicketAssignee1800000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "assigned_to" uuid`);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_support_tickets_assignee'
        ) THEN
          ALTER TABLE "support_tickets"
            ADD CONSTRAINT "FK_support_tickets_assignee"
            FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "support_tickets" DROP CONSTRAINT IF EXISTS "FK_support_tickets_assignee"`);
    await queryRunner.query(`ALTER TABLE "support_tickets" DROP COLUMN IF EXISTS "assigned_to"`);
  }
}
