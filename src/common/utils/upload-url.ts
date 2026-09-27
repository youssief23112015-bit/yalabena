import { BadRequestException } from '@nestjs/common';

/**
 * SRS 7.2 — any file reference stored in the database must point at a file
 * that went through POST /files/upload (MIME + size validated, UUID-renamed).
 * External URLs are rejected. Pass `field` for a clear error message.
 */
export function assertInternalUploadUrl(
  url: string | null | undefined,
  field = 'file_url',
): void {
  if (url && !url.startsWith('/uploads/')) {
    throw new BadRequestException(
      `${field} must reference an uploaded file (starts with /uploads/)`,
    );
  }
}
