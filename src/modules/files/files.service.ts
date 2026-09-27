import {
  Injectable,
  BadRequestException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import { join, extname } from 'path';
import { Setting } from '../../shared/entities/setting.entity';

export type UploadKind =
  | 'chat'
  | 'lms'
  | 'submission'
  | 'hr'
  | 'avatar'
  | 'activity'
  | 'general';

// Minimal structural type for a multer file (avoids depending on the
// global Express.Multer namespace, which is not emitted by @types/multer 2.x
// alongside @types/express 5.x).
export interface UploadedMulterFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface StoredFileInfo {
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  kind: UploadKind;
}

// ── MIME whitelist (SRS 7.2 — executables / scripts are never allowed) ──
const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const DOC_MIMES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
];
const AUDIO_MIMES = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'];

// Trusted extension derived from the validated MIME type — we NEVER trust
// the client-supplied filename extension for the stored file.
const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/vnd.ms-powerpoint': '.ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
  'text/plain': '.txt',
  'text/csv': '.csv',
  'audio/mpeg': '.mp3',
  'audio/wav': '.wav',
  'audio/ogg': '.ogg',
  'audio/mp4': '.m4a',
};

const MB = 1024 * 1024;

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(Setting) private settingRepo: Repository<Setting>,
  ) {}

  private uploadRoot(): string {
    return join(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
  }

  private maxBytesFor(kind: UploadKind, chatLimitMb: number): number {
    const envDefault = (parseInt(process.env.MAX_UPLOAD_MB || '10', 10) || 10) * MB;
    switch (kind) {
      case 'chat':
        return chatLimitMb * MB; // SRS: admin-configurable via settings.max_chat_file_mb
      case 'avatar':
        return 5 * MB;
      case 'lms':
        return (parseInt(process.env.MAX_LMS_UPLOAD_MB || '25', 10) || 25) * MB;
      default:
        return envDefault;
    }
  }

  private allowedMimesFor(kind: UploadKind): string[] {
    switch (kind) {
      case 'avatar':
      case 'activity':
        return IMAGE_MIMES;
      case 'lms':
        return [...IMAGE_MIMES, ...DOC_MIMES, ...AUDIO_MIMES];
      case 'chat':
      case 'submission':
      case 'hr':
      case 'general':
      default:
        return [...IMAGE_MIMES, ...DOC_MIMES];
    }
  }

  private async chatLimitMb(): Promise<number> {
    try {
      const row = await this.settingRepo.findOne({ where: { key: 'max_chat_file_mb' } });
      const val = parseInt(row?.value || '', 10);
      if (val > 0) return val;
    } catch {
      /* fall through to env/default */
    }
    return parseInt(process.env.MAX_CHAT_FILE_MB || '5', 10) || 5;
  }

  /**
   * Validate + persist an uploaded file under uploads/<kind>/<yyyy>/<mm>/<uuid>.<ext>
   * and return the public URL + display metadata (SRS 7.2 upload hardening).
   */
  async saveUpload(file: UploadedMulterFile, kind: UploadKind): Promise<StoredFileInfo> {
    if (!file || !file.buffer?.length) {
      throw new BadRequestException('No file uploaded');
    }

    const allowed = this.allowedMimesFor(kind);
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type "${file.mimetype}" is not allowed for "${kind}" uploads`,
      );
    }

    const chatLimit = kind === 'chat' ? await this.chatLimitMb() : 0;
    const maxBytes = this.maxBytesFor(kind, chatLimit || 5);
    if (file.size > maxBytes) {
      throw new PayloadTooLargeException(
        `File too large. Maximum for "${kind}" is ${Math.round(maxBytes / MB)} MB`,
      );
    }

    const ext = MIME_TO_EXT[file.mimetype] || '.bin';
    const now = new Date();
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const relPath = join(kind, yyyy, mm, `${randomUUID()}${ext}`);
    const absPath = join(this.uploadRoot(), relPath);

    await fs.mkdir(join(this.uploadRoot(), kind, yyyy, mm), { recursive: true });
    await fs.writeFile(absPath, file.buffer);

    return {
      // URL uses forward slashes regardless of platform
      file_url: `/uploads/${relPath.split('\\').join('/')}`,
      file_name: (file.originalname || `file${ext}`).slice(0, 255),
      file_size: file.size,
      mime_type: file.mimetype,
      kind,
    };
  }
}
