import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * The academy pivots to 100% branchless operation — groups no longer require
 * a branch assignment. The NOT NULL constraint on groups.branch_id made
 * group creation crash with a constraint violation when branchId was omitted.
 */
export class GroupBranchIdNullable1797000000000 implements MigrationInterface {
    name = 'GroupBranchIdNullable1797000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "groups" ALTER COLUMN "branch_id" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`UPDATE "groups" SET "branch_id" = (SELECT id FROM "branches" ORDER BY "created_at" ASC LIMIT 1) WHERE "branch_id" IS NULL`);
        await queryRunner.query(`ALTER TABLE "groups" ALTER COLUMN "branch_id" SET NOT NULL`);
    }
}