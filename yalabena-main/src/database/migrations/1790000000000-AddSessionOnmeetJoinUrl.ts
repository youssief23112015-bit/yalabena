import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSessionOnmeetJoinUrl1790000000000 implements MigrationInterface {
    name = 'AddSessionOnmeetJoinUrl1790000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "onmeet_join_url" character varying(500)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sessions" DROP COLUMN IF EXISTS "onmeet_join_url"`);
    }
}
