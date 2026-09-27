import { MigrationInterface, QueryRunner } from "typeorm";

export class AuditLogTargetIdNullable1790000001000 implements MigrationInterface {
    name = 'AuditLogTargetIdNullable1790000001000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "audit_logs" ALTER COLUMN "target_id" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "audit_logs" ALTER COLUMN "target_id" SET NOT NULL`);
    }
}
