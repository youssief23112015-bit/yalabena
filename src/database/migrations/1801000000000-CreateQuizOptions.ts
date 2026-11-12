import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds a relational `quiz_options` table so each LMS quiz question can have
 * explicitly modelled answer choices with an `is_correct` flag. Backs the
 * per-quiz question CRUD endpoints:
 *   POST /lms/quizzes/:quizId/questions
 *   GET  /lms/quizzes/:quizId/questions
 *   PUT  /lms/quizzes/questions/:questionId
 *   DELETE /lms/quizzes/questions/:questionId
 */
export class CreateQuizOptions1801000000000 implements MigrationInterface {
  name = 'CreateQuizOptions1801000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "quiz_options" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "quiz_question_id" uuid NOT NULL,
        "option_text" text NOT NULL,
        "is_correct" boolean NOT NULL DEFAULT false,
        "order" integer NOT NULL DEFAULT '0',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_quiz_options" PRIMARY KEY ("id"),
        CONSTRAINT "FK_quiz_options_question" FOREIGN KEY ("quiz_question_id") REFERENCES "quiz_questions"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "quiz_options"`);
  }
}
