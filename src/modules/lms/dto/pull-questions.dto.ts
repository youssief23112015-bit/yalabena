import { IsOptional, IsString, IsInt, IsIn } from 'class-validator';

export class PullQuestionsDto {
  @IsOptional()
  @IsString()
  topic_tag?: string;

  @IsOptional()
  @IsIn(['easy', 'medium', 'hard'])
  difficulty?: 'easy' | 'medium' | 'hard';

  @IsOptional()
  @IsInt()
  limit?: number;
}
