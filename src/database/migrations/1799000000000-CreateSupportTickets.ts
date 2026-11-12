import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the support ticketing tables:
 *  - support_tickets: tickets submitted by authenticated users.
 *  - support_ticket_replies: staff replies to tickets.
 */
export class CreateSupportTickets1799000000000
  implements MigrationInterface
{
  name = 'CreateSupportTickets1799000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'support_ticket_status_enum') THEN
          CREATE TYPE support_ticket_status_enum AS ENUM ('open', 'in_progress', 'resolved');
        END IF;
      END $$;
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'support_ticket_priority_enum') THEN
          CREATE TYPE support_ticket_priority_enum AS ENUM ('low', 'medium', 'high', 'urgent');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "support_tickets" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid,
        "subject" character varying(255) NOT NULL,
        "category" character varying(100) NOT NULL,
        "message" text NOT NULL,
        "priority" support_ticket_priority_enum NOT NULL DEFAULT 'medium',
        "status" support_ticket_status_enum NOT NULL DEFAULT 'open',
        "user_name" character varying(255),
        "user_email" character varying(255),
        "admin_reply" text,
        "replied_by" uuid,
        "replied_at" TIMESTAMP WITH TIME ZONE,
        "resolved_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_support_tickets" PRIMARY KEY ("id"),
        CONSTRAINT "FK_support_tickets_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "support_ticket_replies" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "ticket_id" uuid NOT NULL,
        "body" text NOT NULL,
        "created_by" uuid,
        "created_by_name" character varying(255),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_support_ticket_replies" PRIMARY KEY ("id"),
        CONSTRAINT "FK_support_ticket_replies_ticket" FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "support_ticket_replies";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "support_tickets";`);
    await queryRunner.query(`DROP TYPE IF EXISTS support_ticket_status_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS support_ticket_priority_enum;`);
  }
}
