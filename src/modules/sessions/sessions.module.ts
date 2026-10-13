import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from '../../shared/entities/session.entity';
import { Attendance } from '../../shared/entities/attendance.entity';
import { Group } from '../../shared/entities/group.entity';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { AttendancesModule } from '../attendance/attendance.module';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Session, Attendance, Group]),
    // Reused for QR check-in codes + student self check-in on session routes.
    AttendancesModule,
    // Zoom/OnMeet auto-creation for online sessions (SRS 5.1/5.2).
    IntegrationsModule,
  ],
  controllers: [SessionsController],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
