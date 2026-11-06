import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Adds password_changed_at column to the users table.
 *
 * This column records the timestamp of the user's last password change and
 * is used by JwtStrategy to invalidate all access/refresh tokens issued
 * before a password change (session invalidation on password reset).
 *
 * The column is nullable so existing user records (created before this
 * migration) remain valid: JwtStrategy treats a null value as "never
 * changed", so tokens issued before any password change are accepted.
 */
export class AddPasswordChangedAt1798000000000 implements MigrationInterface {
    name = 'AddPasswordChangedAt1798000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "password_changed_at" TIMESTAMP WITH TIME ZONE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "password_changed_at"`);
    }
}
