import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NotificationService } from './notifications.service';

@ApiTags('Users')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly service: NotificationService) {}
}
