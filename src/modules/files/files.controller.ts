import {
  Controller,
  Post,
  Query,
  BadRequestException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger';
import { FilesService, UploadKind, UploadedMulterFile } from './files.service';

const VALID_KINDS: UploadKind[] = [
  'chat',
  'lms',
  'submission',
  'hr',
  'avatar',
  'activity',
  'general',
];

@ApiTags('Files')
@ApiBearerAuth('JWT')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @ApiOperation({
    summary:
      'Upload a file (returns file_url to attach to chat messages, LMS resources, submissions, HR docs)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiQuery({
    name: 'kind',
    required: false,
    enum: VALID_KINDS,
    description:
      'Upload context: chat (settings max_chat_file_mb), lms, submission, hr, avatar (images only), activity (images only), general',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  // Hard ceiling 30MB at the transport layer; per-kind limits enforced in the service
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 30 * 1024 * 1024 } }))
  async upload(
    @UploadedFile() file: UploadedMulterFile,
    @Query('kind') kind: string = 'general',
  ) {
    const resolved = (VALID_KINDS as string[]).includes(kind)
      ? (kind as UploadKind)
      : (() => {
          throw new BadRequestException(
            `Invalid kind "${kind}". Allowed: ${VALID_KINDS.join(', ')}`,
          );
        })();
    return this.filesService.saveUpload(file, resolved);
  }
}
