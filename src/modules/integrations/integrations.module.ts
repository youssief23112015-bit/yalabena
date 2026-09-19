import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { IntegrationsController } from './integrations.controller';
import { ZoomService } from './zoom.service';
import { OnMeetService } from './onmeet.service';
import { EasyKashService } from './easykash.service';
import { Payment } from '../../shared/entities/payment.entity';
import { Invoice } from '../../shared/entities/invoice.entity';
import { Session } from '../../shared/entities/session.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Invoice, Session]),
    JwtModule.register({
      secret: process.env.ZOOM_API_SECRET || 'zoom-legacy-signing-secret',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [IntegrationsController],
  providers: [ZoomService, OnMeetService, EasyKashService],
  exports: [ZoomService, OnMeetService, EasyKashService],
})
export class IntegrationsModule {}
