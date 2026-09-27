import { IsEnum } from 'class-validator';
import { ReleaseMode } from '../../../common/enums/release-mode.enum';

export class SetReleaseModeDto {
  @IsEnum(ReleaseMode)
  release_mode: ReleaseMode;
}
