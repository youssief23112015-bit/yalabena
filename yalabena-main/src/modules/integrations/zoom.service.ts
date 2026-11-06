import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

const fetchFn: any = (globalThis as any).fetch;

export interface ZoomMeetingResult {
  meeting_id: string;
  join_url: string;
  password: string | null;
  start_url: string | null;
}

/**
 * Zoom integration (SRS 5.1).
 * Supports Server-to-Server OAuth (recommended) or legacy API-key JWT app.
 */
@Injectable()
export class ZoomService {
  private readonly logger = new Logger(ZoomService.name);
  private readonly baseUrl = 'https://api.zoom.us/v2';

  constructor(
    private readonly config: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  isConfigured(): boolean {
    const oauth = this.config.get<string>('ZOOM_CLIENT_ID') && this.config.get<string>('ZOOM_CLIENT_SECRET');
    const legacy = this.config.get<string>('ZOOM_API_KEY') && this.config.get<string>('ZOOM_API_SECRET');
    return Boolean(oauth || legacy);
  }

  private async getAccessToken(): Promise<string> {
    const accountId = this.config.get<string>('ZOOM_ACCOUNT_ID');
    const clientId = this.config.get<string>('ZOOM_CLIENT_ID');
    const clientSecret = this.config.get<string>('ZOOM_CLIENT_SECRET');

    if (accountId && clientId && clientSecret) {
      // Server-to-Server OAuth
      const res = await fetchFn('https://zoom.us/oauth/token', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `grant_type=account_credentials&account_id=${accountId}`,
      });
      if (!res.ok) {
        throw new BadRequestException(`Zoom OAuth failed: ${res.status} ${await res.text()}`);
      }
      const json = await res.json();
      return json.access_token;
    }

    // Legacy JWT (api key / secret)
    const apiKey = this.config.get<string>('ZOOM_API_KEY');
    const apiSecret = this.config.get<string>('ZOOM_API_SECRET');
    if (!apiKey || !apiSecret) {
      throw new BadRequestException('Zoom is not configured. Set ZOOM_ACCOUNT_ID/ZOOM_CLIENT_ID/ZOOM_CLIENT_SECRET or ZOOM_API_KEY/ZOOM_API_SECRET.');
    }
    return this.jwtService.sign(
      { iss: apiKey, exp: Math.floor(Date.now() / 1000) + 3600 },
      { secret: apiSecret },
    );
  }

  private async request(method: string, path: string, body?: any): Promise<any> {
    const token = await this.getAccessToken();
    const res = await fetchFn(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    if (!res.ok) {
      throw new BadRequestException(`Zoom API error ${res.status}: ${text}`);
    }
    return text ? JSON.parse(text) : {};
  }

  /** Auto-create a meeting when an online session is scheduled (SRS 5.1). */
  async createMeeting(input: { topic: string; startTime: string; duration: number }): Promise<ZoomMeetingResult> {
    const data = await this.request('POST', '/users/me/meetings', {
      topic: input.topic,
      type: 2, // scheduled meeting
      start_time: input.startTime,
      duration: input.duration,
      timezone: this.config.get<string>('APP_TIMEZONE', 'Africa/Cairo'),
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: false,
        auto_recording: 'cloud',
      },
    });
    this.logger.log(`Zoom meeting created: ${data.id}`);
    return {
      meeting_id: String(data.id),
      join_url: data.join_url,
      password: data.password ?? null,
      start_url: data.start_url ?? null,
    };
  }

  /** Pull the recording URL into the session record (SRS 5.1). */
  async getRecordingUrl(meetingId: string): Promise<string | null> {
    try {
      const data = await this.request('GET', `/meetings/${meetingId}/recordings`);
      const file = (data.recording_files ?? []).find((f: any) => f.file_type === 'MP4') ?? data.recording_files?.[0];
      return file?.share_url ?? file?.play_url ?? null;
    } catch (err) {
      this.logger.warn(`Could not fetch recording for meeting ${meetingId}: ${(err as Error).message}`);
      return null;
    }
  }

  /** Verify a Zoom webhook (shared-secret style check). */
  verifyWebhook(authorization: string | undefined): boolean {
    const secret = this.config.get<string>('ZOOM_WEBHOOK_SECRET');
    if (!secret) return true; // not enforcing
    return authorization === secret;
  }
}
