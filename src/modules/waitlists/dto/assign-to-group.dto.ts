import { IsArray, IsUUID } from 'class-validator';

export class AssignToGroupDto {
  @IsUUID()
  group_id: string;
}

export class BulkAssignToGroupDto extends AssignToGroupDto {
  @IsArray()
  @IsUUID('4', { each: true })
  waitlist_ids: string[];
}
