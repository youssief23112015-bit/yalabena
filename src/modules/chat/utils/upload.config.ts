import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { randomUUID } from 'crypto';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

export const CHAT_UPLOAD_DIR = join(process.cwd(), 'uploads', 'chat');
export const CHAT_UPLOAD_URL_PREFIX = '/uploads/chat';
export const CHAT_MAX_FILE_BYTES = 15 * 1024 * 1024; // 15MB — matches MessageComposer.tsx

// Deliberately conservative: images, PDFs, and common office docs. No
// executables, no archives, no raw HTML/JS.
const ALLOWED_MIME_TYPES = new Set([
  'image/png', 'image/jpeg', 'image/webp', 'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'audio/mpeg', 'audio/wav', // classroom recordings; NOT the 'voice' message type from CHAT-BE-06
]);

// Derive the stored extension from the VALIDATED mimetype — NEVER trust the
// client-supplied filename extension (prevents .php/.html masquerading as an image).
const MIME_TO_EXT: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'audio/mpeg': '.mp3',
  'audio/wav': '.wav',
};

function ensureUploadDir() {
  if (!existsSync(CHAT_UPLOAD_DIR)) mkdirSync(CHAT_UPLOAD_DIR, { recursive: true });
}
ensureUploadDir();

export const chatUploadMulterOptions: MulterOptions = {
  storage: diskStorage({
    destination: (_req, _file, cb) => {
      ensureUploadDir();
      cb(null, CHAT_UPLOAD_DIR);
    },
    filename: (_req, file, cb) => {
      // Extension derived from validated mimetype, not client-controlled originalname
      const safeExt = MIME_TO_EXT[file.mimetype] || '.bin';
      cb(null, `${randomUUID()}${safeExt}`);
    },
  }),
  limits: { fileSize: CHAT_MAX_FILE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new BadRequestException(`File type not allowed: ${file.mimetype}`), false);
      return;
    }
    cb(null, true);
  },
};

export function isImageMimetype(mimetype: string): boolean {
  return mimetype.startsWith('image/');
}
