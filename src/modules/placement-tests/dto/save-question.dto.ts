import { IsString, IsNotEmpty, IsEnum, IsOptional, IsInt, Min, IsBoolean, IsObject } from 'class-validator';
import { QuestionType } from '../../../common/enums/question-type.enum';

export class SaveQuestionDto {
  @IsString()
  @IsNotEmpty()
  question_text: string;

  @IsEnum(QuestionType)
  type: QuestionType;

  @IsOptional()
  @IsObject()
  options?: any;

  @IsObject()
  correct_answer: any;

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsString()
  @IsNotEmpty()
  level: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  points?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
