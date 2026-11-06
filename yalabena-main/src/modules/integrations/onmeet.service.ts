import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const fetchFn: any = (globalThis as any).fetch;

export interface OnMeetMeetingResult {
  meeting_id: string;
  join_url: string;
  password: string | null;
  start_url: string | null;
}

/**
 * OnMeet integration (SRS 5.2) — same feature parity as Zoom.
 * Base URL and key are configurable because OnMeet's public API surface
 * must be confirmed in Phase 0 (per SRS risk table).
 */
@Injectable()
export class OnMeetService {
  private readonly logger = new Logger(OnMeetService.name);

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.config.get<string>('ONMEET_API_URL') && this.config.get<string>('ONMEET_API_KEY'));
  }

  private async request(method: string, path: string, body?: any): Promise<any> {
    const base = this.config.get<string>('ONMEET_API_URL');
    const key = this.config.get<string>('ONMEET_API_KEY');
    if (!base || !key) {
      throw new BadRequestException('OnMeet is not configured. Set ONMEET_API_URL and ONMEET_API_KEY.');
    }
    const res = await fetchFn(`${base}${path}`, {
      method,
      headers: { 'x-api-key': key, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    if (!res.ok) {
      throw new BadRequestException(`OnMeet API error ${res.status}: ${text}`);
    }
    return text ? JSON.parse(text) : {};
  }

  async createMeeting(input: { topic: string; startTime: string; duration: number }): Promise<OnMeetMeetingResult> {
    const data = await this.request('POST', '/meetings', {
      title: input.topic,
      start_time: input.startTime,
      duration: input.duration,
    });
    this.logger.log(`OnMeet meeting created: ${data.id ?? data.meeting_id}`);
    return {
      meeting_id: String(data.id ?? data.meeting_id),
      join_url: data.join_url ?? data.url,
      password: data.password ?? null,
      start_url: data.start_url ?? null,
    };
  }

  async getRecordingUrl(meetingId: string): Promise<string | null> {
    try {
      const data = await this.request('GET', `/meetings/${meetingId}`);
      return data.recording_url ?? null;
    } catch (err) {
      this.logger.warn(`Could not fetch OnMeet recording ${meetingId}: ${(err as Error).message}`);
      return null;
    }
  }
}
