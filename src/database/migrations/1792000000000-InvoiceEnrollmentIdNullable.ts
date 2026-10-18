import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Manual invoices (POST /finance/invoices, SRS §4.8) carry no enrollment —
 * the NOT NULL constraint on invoices.enrollment_id made that entire flow
 * crash with a constraint violation. Mirrors AuditLogTargetIdNullable.
 */
export class InvoiceEnrollmentIdNullable1792000000000 implements MigrationInterface {
    name = 'InvoiceEnrollmentIdNullable1792000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "invoices" ALTER COLUMN "enrollment_id" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`UPDATE "invoices" SET "enrollment_id" = (SELECT id FROM "enrollments" ORDER BY "created_at" ASC LIMIT 1) WHERE "enrollment_id" IS NULL`);
        await queryRunner.query(`ALTER TABLE "invoices" ALTER COLUMN "enrollment_id" SET NOT NULL`);
    }
}