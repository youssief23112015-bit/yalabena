import { IsArray, ValidateNested, IsUUID, IsDefined } from 'class-validator';
import { Type } from 'class-transformer';

export class WrittenAnswerDto {
  @IsUUID()
  question_id: string;

  @IsDefined()
  answer: any;
}

export class SubmitWrittenDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WrittenAnswerDto)
  answers: WrittenAnswerDto[];
}
