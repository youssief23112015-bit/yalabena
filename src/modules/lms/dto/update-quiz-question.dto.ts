import { IsString, IsInt, IsOptional, IsEnum, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { QuestionType } from '../../../common/enums/question-type.enum';
import { QuizOptionInputDto } from './create-quiz-question.dto';

/**
 * Normalizes incoming question-type values to uppercase so they match the
 * shared `QuestionType` enum and the uppercase values now present in the
 * PostgreSQL enums. Prevents `invalid input value for enum question_type`.
 */
function normalizeQuestionType(value: unknown): QuestionType {
  if (typeof value !== 'string') return value as QuestionType;
  const upper = value.toUpperCase() as QuestionType;
  return upper in QuestionType ? upper : (value as QuestionType);
}

export class UpdateQuizQuestionDto {
  @IsOptional()
  @IsString()
  question_text?: string;

  @IsOptional()
  @Transform(({ value }) => normalizeQuestionType(value), { toClassOnly: true })
  @IsEnum(QuestionType)
  type?: QuestionType;

  @IsOptional()
  @IsInt()
  points?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizOptionInputDto)
  options?: QuizOptionInputDto[];
}
