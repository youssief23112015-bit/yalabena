import { PartialType } from '@nestjs/swagger';
import { CreateGroupDto } from './create-group.dto';

export class UpdateGroupDto extends PartialType(CreateGroupDto) {
  /**
   * When true, sessions that fall outside the new start/end date range are
   * automatically cancelled instead of rejecting the update. When false or
   * omitted, a 400 Bad Request is returned listing the affected session dates.
   */
  cascade_prune_sessions?: boolean;
}