import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
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
      const safeExt = extname(file.originalname).toLowerCase();
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
