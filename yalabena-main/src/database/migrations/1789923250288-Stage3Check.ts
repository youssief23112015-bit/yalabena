import { MigrationInterface, QueryRunner } from "typeorm";

export class Stage3Check1789923250288 implements MigrationInterface {
    name = 'Stage3Check1789923250288'

    public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. إسقاط جميع الـ FK والـ Constraints القديمة بأمان بدون أخطاء لو مش موجودة
    await queryRunner.query(`ALTER TABLE "group_students" DROP CONSTRAINT IF EXISTS "FK_8b5b7bb7e2c2f1a8e4319ae3394"`);
    await queryRunner.query(`ALTER TABLE "group_students" DROP CONSTRAINT IF EXISTS "FK_86ac11b05c01e9981dd4e4ba39e"`);
    await queryRunner.query(`ALTER TABLE "group_students" DROP CONSTRAINT IF EXISTS "FK_50d45645710f456f595955979ff"`);
    await queryRunner.query(`ALTER TABLE "group_students" DROP CONSTRAINT IF EXISTS "UQ_2dc2c3c7c14f90c8bd41151548f"`);
    await queryRunner.query(`ALTER TABLE "group_students" DROP CONSTRAINT IF EXISTS "PK_cd596d1c8176853f748dc44af4b"`);
    await queryRunner.query(`ALTER TABLE "group_students" DROP CONSTRAINT IF EXISTS "PK_2dc2c3c7c14f90c8bd41151548f"`);
    await queryRunner.query(`ALTER TABLE "group_students" DROP CONSTRAINT IF EXISTS "PK_72f9cc5725656666453ab33f1b2"`);
    await queryRunner.query(`ALTER TABLE "group_students" DROP CONSTRAINT IF EXISTS "PK_8e0cdf4506738278b99ab92d4a5"`);

    // 2. إسقاط الأعمدة وإعادتها بالتعديلات المطلوبة
    await queryRunner.query(`ALTER TABLE "group_students" DROP COLUMN IF EXISTS "id"`);
    await queryRunner.query(`ALTER TABLE "group_students" DROP COLUMN IF EXISTS "enrolled_at"`);
    await queryRunner.query(`ALTER TABLE "group_students" DROP COLUMN IF EXISTS "enrolled_by"`);
    await queryRunner.query(`ALTER TABLE "group_students" DROP COLUMN IF EXISTS "dropped_at"`);
    await queryRunner.query(`ALTER TABLE "group_students" DROP COLUMN IF EXISTS "status"`);
    await queryRunner.query(`ALTER TABLE "group_students" DROP COLUMN IF EXISTS "drop_reason"`);

    await queryRunner.query(`ALTER TABLE "group_students" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`);
    await queryRunner.query(`ALTER TABLE "group_students" ADD "enrolled_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "group_students" ADD "enrolled_by" uuid`);
    await queryRunner.query(`ALTER TABLE "group_students" ADD "status" character varying(20) NOT NULL DEFAULT 'active'`);
    await queryRunner.query(`ALTER TABLE "group_students" ADD "dropped_at" TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(`ALTER TABLE "group_students" ADD "drop_reason" text`);

    // 3. إنشاء الـ Primary Key المركب الفعلي (مرة واحدة فقط)
    await queryRunner.query(`ALTER TABLE "group_students" ADD CONSTRAINT "PK_72f9cc5725656666453ab33f1b2" PRIMARY KEY ("student_id", "id", "group_id")`);

    // 4. إنشاء الـ Indexes والـ Constraints الإضافية
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_86ac11b05c01e9981dd4e4ba39"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_8b5b7bb7e2c2f1a8e4319ae33"`);
    await queryRunner.query(`CREATE INDEX "IDX_86ac11b05c01e9981dd4e4ba39" ON "group_students" ("student_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_8b5b7bb7e2c2f1a8e4319ae33" ON "group_students" ("group_id")`);
    await queryRunner.query(`ALTER TABLE "group_students" ADD CONSTRAINT "UQ_2dc2c3c7c14f90c8bd41151548f" UNIQUE ("group_id", "student_id")`);

    // 5. تعديلات جدول chat_violations والربط بالعلاقات
    await queryRunner.query(`ALTER TABLE "chat_violations" DROP CONSTRAINT IF EXISTS "FK_696c9711b596429534143ba0ba5"`);
    await queryRunner.query(`ALTER TABLE "chat_violations" ALTER COLUMN "message_id" DROP NOT NULL`);

    await queryRunner.query(`ALTER TABLE "group_students" ADD CONSTRAINT "FK_8b5b7bb7e2c2f1a8e4319ae3394" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "group_students" ADD CONSTRAINT "FK_86ac11b05c01e9981dd4e4ba39e" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "group_students" ADD CONSTRAINT "FK_50d45645710f456f595955979ff" FOREIGN KEY ("enrolled_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "chat_violations" ADD CONSTRAINT "FK_696c9711b596429534143ba0ba5" FOREIGN KEY ("message_id") REFERENCES "chat_messages"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
}

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_violations" DROP CONSTRAINT "FK_696c9711b596429534143ba0ba5"`);
        await queryRunner.query(`ALTER TABLE "group_students" DROP CONSTRAINT "FK_50d45645710f456f595955979ff"`);
        await queryRunner.query(`ALTER TABLE "group_students" DROP CONSTRAINT "FK_86ac11b05c01e9981dd4e4ba39e"`);
        await queryRunner.query(`ALTER TABLE "group_students" DROP CONSTRAINT "FK_8b5b7bb7e2c2f1a8e4319ae3394"`);
        await queryRunner.query(`ALTER TABLE "group_students" DROP CONSTRAINT "UQ_2dc2c3c7c14f90c8bd41151548f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8b5b7bb7e2c2f1a8e4319ae339"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_86ac11b05c01e9981dd4e4ba39"`);
        await queryRunner.query(`ALTER TABLE "group_students" DROP CONSTRAINT IF EXISTS "PK_72f9cc5725656666453ab33f1b2"`);
        await queryRunner.query(`ALTER TABLE "group_students" ADD CONSTRAINT "PK_8e0cdf4506738278b99ab92d4a5" PRIMARY KEY ("student_id", "id")`);
        await queryRunner.query(`ALTER TABLE "group_students" DROP CONSTRAINT "PK_8e0cdf4506738278b99ab92d4a5"`);
        await queryRunner.query(`ALTER TABLE "group_students" ADD CONSTRAINT "PK_cd596d1c8176853f748dc44af4b" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "chat_violations" ALTER COLUMN "message_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "chat_violations" ADD CONSTRAINT "FK_696c9711b596429534143ba0ba5" FOREIGN KEY ("message_id") REFERENCES "chat_messages"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "group_students" DROP CONSTRAINT "PK_cd596d1c8176853f748dc44af4b"`);
        await queryRunner.query(`ALTER TABLE "group_students" ADD CONSTRAINT "PK_8e0cdf4506738278b99ab92d4a5" PRIMARY KEY ("student_id", "id")`);
        await queryRunner.query(`ALTER TABLE "group_students" DROP CONSTRAINT "PK_8e0cdf4506738278b99ab92d4a5"`);
        await queryRunner.query(`ALTER TABLE "group_students" ADD CONSTRAINT "PK_72f9cc5725656666453ab33f1b2" PRIMARY KEY ("group_id", "student_id", "id")`);
        await queryRunner.query(`ALTER TABLE "group_students" DROP CONSTRAINT "PK_2dc2c3c7c14f90c8bd41151548f"`);
        await queryRunner.query(`ALTER TABLE "group_students" ADD CONSTRAINT "PK_cd596d1c8176853f748dc44af4b" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "group_students" DROP COLUMN "drop_reason"`);
        await queryRunner.query(`ALTER TABLE "group_students" DROP COLUMN "dropped_at"`);
        await queryRunner.query(`ALTER TABLE "group_students" DROP COLUMN "status"`);
        await queryRunner.query(`ALTER TABLE "group_students" DROP COLUMN "enrolled_by"`);
        await queryRunner.query(`ALTER TABLE "group_students" DROP COLUMN "enrolled_at"`);
        await queryRunner.query(`ALTER TABLE "group_students" DROP CONSTRAINT "PK_cd596d1c8176853f748dc44af4b"`);
        await queryRunner.query(`ALTER TABLE "group_students" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "group_students" ADD "drop_reason" text`);
        await queryRunner.query(`ALTER TABLE "group_students" ADD "status" character varying(20) NOT NULL DEFAULT 'active'`);
        await queryRunner.query(`ALTER TABLE "group_students" ADD "dropped_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "group_students" ADD "enrolled_by" uuid`);
        await queryRunner.query(`ALTER TABLE "group_students" ADD "enrolled_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "group_students" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "group_students" ADD CONSTRAINT "PK_cd596d1c8176853f748dc44af4b" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "group_students" ADD CONSTRAINT "UQ_2dc2c3c7c14f90c8bd41151548f" UNIQUE ("group_id", "student_id")`);
        await queryRunner.query(`ALTER TABLE "group_students" ADD CONSTRAINT "FK_50d45645710f456f595955979ff" FOREIGN KEY ("enrolled_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "group_students" ADD CONSTRAINT "FK_86ac11b05c01e9981dd4e4ba39e" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "group_students" ADD CONSTRAINT "FK_8b5b7bb7e2c2f1a8e4319ae3394" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
