import { IsString, IsInt, IsOptional, IsEnum, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { QuestionType } from '../../../common/enums/question-type.enum';

/**
 * Normalizes incoming question-type values to uppercase so they match the
 * shared `QuestionType` enum (and the uppercase values now present in the
 * PostgreSQL `quiz_questions_type_enum` after running migration
 * 1802000000000-AddQuizQuestionTypeEnumValues).
 *
 * Without this, a frontend payload like `{ type: "true_false" }` would pass
 * `@IsEnum(QuestionType)` only after transformation, and a value like
 * `"TRUE_FALSE"` would reach PostgreSQL's `quiz_questions_type_enum` which
 * previously only knew lowercase labels — causing
 * `invalid input value for enum question_type: "TRUE_FALSE"`.
 */
function normalizeQuestionType(value: unknown): QuestionType {
  if (typeof value !== 'string') return value as QuestionType;
  const upper = value.toUpperCase() as QuestionType;
  return upper in QuestionType ? upper : (value as QuestionType);
}

export class QuizOptionInputDto {
  @IsOptional()
  @IsString()
  option_text?: string;

  @IsOptional()
  @IsBoolean()
  is_correct?: boolean;

  @IsOptional()
  @IsInt()
  order?: number;
}

export class CreateQuizQuestionDto {
  @IsString()
  question_text: string;

  @Transform(({ value }) => normalizeQuestionType(value), { toClassOnly: true })
  @IsEnum(QuestionType)
  type: QuestionType;

  @IsInt()
  points: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizOptionInputDto)
  options: QuizOptionInputDto[];
}
