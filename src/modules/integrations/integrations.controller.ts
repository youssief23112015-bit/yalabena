import { Controller, Post, Get, Body, Req, Headers, HttpCode, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHmac } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { ZoomService } from './zoom.service';
import { OnMeetService } from './onmeet.service';
import { EasyKashService } from './easykash.service';
import { Session } from '../../shared/entities/session.entity';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Integrations')
@Controller('integrations')
export class IntegrationsController {
  private readonly logger = new Logger(IntegrationsController.name);

  constructor(
    private readonly zoom: ZoomService,
    private readonly onmeet: OnMeetService,
    private readonly easykash: EasyKashService,
    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>,
    private readonly config: ConfigService,
  ) {}

  @Get('status')
  @Roles('super_admin', 'branch_manager')
  @ApiOperation({ summary: 'Check which integrations are configured' })
  status() {
    return {
      zoom: this.zoom.isConfigured(),
      onmeet: this.onmeet.isConfigured(),
      easykash: this.easykash.isConfigured(),
    };
  }

  // ---------- EasyKash webhook (SRS 5.3) ----------

  @Public()
  @Post('easykash/webhook')
  @HttpCode(200)
  @ApiOperation({ summary: 'EasyKash payment confirmation webhook' })
  async easykashWebhook(
    @Req() req: any,
    @Headers('x-signature') signature: string,
  ) {
    const rawBody: string = typeof req.rawBody === 'string' ? req.rawBody : JSON.stringify(req.body ?? {});
    if (!this.easykash.verifyWebhookSignature(rawBody, signature)) {
      return { received: false, error: 'invalid signature' };
    }
    return this.easykash.handleWebhook(req.body ?? JSON.parse(rawBody));
  }

  // ---------- Zoom webhook (SRS 5.1) ----------

  @Public()
  @Post('zoom/webhook')
  @HttpCode(200)
  @ApiOperation({ summary: 'Zoom events webhook (URL validation + recording.completed)' })
  async zoomWebhook(@Body() body: any, @Headers('authorization') auth: string) {
    if (!this.zoom.verifyWebhook(auth)) {
      return { status: 'unauthorized' };
    }

    // URL validation challenge
    if (body?.event === 'endpoint.url_validation') {
      const secret = this.config.get<string>('ZOOM_WEBHOOK_SECRET', '');
      const encrypted = createHmac('sha256', secret)
        .update(body.payload.plainToken)
        .digest('hex');
      return {
        plainToken: body.payload.plainToken,
        encryptedToken: encrypted,
      };
    }

    // Recording ready -> attach to the session record
    if (body?.event === 'recording.completed') {
      const meetingId = String(body?.payload?.object?.id ?? '');
      const recordingUrl: string | null =
        body?.payload?.object?.recording_files?.find((f: any) => f.file_type === 'MP4')?.share_url ?? null;
      if (meetingId && recordingUrl) {
        await this.sessionRepo.update({ zoom_meeting_id: meetingId } as any, { recording_url: recordingUrl } as any);
        this.logger.log(`Recording attached to session with Zoom meeting ${meetingId}`);
      }
    }

    return { status: 'ok' };
  }
}
