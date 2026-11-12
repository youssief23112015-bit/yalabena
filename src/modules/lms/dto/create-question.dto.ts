import { IsString, IsUUID, IsInt, IsOptional, IsEnum, IsObject } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { QuestionType } from '../../../common/enums/question-type.enum';

/**
 * Normalizes incoming question-type values to uppercase so they match the
 * shared `QuestionType` enum and the uppercase values now present in the
 * PostgreSQL `quiz_questions_type_enum` (see migration
 * 1802000000000-AddQuizQuestionTypeEnumValues). Prevents
 * `invalid input value for enum question_type: "TRUE_FALSE"`.
 */
function normalizeQuestionType(value: unknown): QuestionType {
  if (typeof value !== 'string') return value as QuestionType;
  const upper = value.toUpperCase() as QuestionType;
  return upper in QuestionType ? upper : (value as QuestionType);
}

export class CreateQuestionDto {
  @IsOptional()
  @IsUUID()
  quiz_id?: string;

  @IsString()
  question_text: string;

  @Transform(({ value }) => normalizeQuestionType(value), { toClassOnly: true })
  @IsEnum(QuestionType)
  type: QuestionType;

  @IsOptional()
  @IsObject()
  options?: Record<string, unknown>;

  @IsObject()
  correct_answer: unknown;

  @IsInt()
  points: number;

  @IsOptional()
  @IsString()
  topic_tag?: string;

  @IsOptional()
  @IsEnum(['easy', 'medium', 'hard'])
  difficulty?: 'easy' | 'medium' | 'hard';
}
