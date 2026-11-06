import { IsString, IsUUID, IsInt, IsOptional, IsEnum, IsObject } from 'class-validator';
import { QuestionType } from '../../../common/enums/question-type.enum';

export class CreateQuestionDto {
  @IsOptional()
  @IsUUID()
  quiz_id?: string;

  @IsString()
  question_text: string;

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
