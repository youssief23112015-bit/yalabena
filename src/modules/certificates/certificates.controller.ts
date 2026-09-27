import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { CertificatesService } from './certificates.service';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { CreateTemplateDto } from './dto/create-template.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/utils/branch-scope';

@Controller('certificates')
export class CertificatesController {
  constructor(private readonly service: CertificatesService) {}

  // ---- Templates ----
  @Post('templates')
  @Roles('super_admin', 'branch_manager', 'academic')
  createTemplate(@Body() dto: CreateTemplateDto, @CurrentUser() user: AuthUser) {
    return this.service.createTemplate(dto, user);
  }

  @Get('templates')
  @Roles('super_admin', 'branch_manager', 'academic', 'teacher')
  listTemplates(@Query('course_id') course_id?: string) {
    return this.service.listTemplates(course_id);
  }

  @Post('templates/:id')
  @Roles('super_admin', 'branch_manager', 'academic')
  updateTemplate(@Param('id', ParseUUIDPipe) id: string, @Body() dto: Partial<CreateTemplateDto>) {
    return this.service.updateTemplate(id, dto);
  }

  // ---- Issue / revoke ----
  @Post()
  @Roles('super_admin', 'branch_manager', 'academic') // admin-level only => "manual issue with approval"
  issue(@Body() dto: CreateCertificateDto, @CurrentUser() user: AuthUser) {
    return this.service.issue(dto, user, false);
  }

  @Post('auto-issue/:groupId')
  @Roles('super_admin', 'branch_manager', 'academic')
  autoIssue(@Param('groupId', ParseUUIDPipe) groupId: string, @CurrentUser() user: AuthUser) {
    return this.service.autoIssueForGroup(groupId, user);
  }

  @Post(':id/revoke')
  @Roles('super_admin', 'branch_manager')
  revoke(@Param('id', ParseUUIDPipe) id: string, @Body('reason') reason: string, @CurrentUser() user: AuthUser) {
    return this.service.revoke(id, reason, user);
  }

  // ---- Read ----
  @Get()
  @Roles('super_admin', 'branch_manager', 'academic', 'finance', 'teacher')
  list(
    @CurrentUser() user: AuthUser,
    @Query('student_id') student_id?: string,
    @Query('course_id') course_id?: string,
    @Query('group_id') group_id?: string,
    @Query('status') status?: string,
    @Query('branch_id') branch_id?: string,
  ) {
    return this.service.list(user, { student_id, course_id, group_id, status, branch_id });
  }

  @Get(':id')
  @Roles('super_admin', 'branch_manager', 'academic', 'finance', 'teacher')
  getOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.service.getOne(id, user);
  }

  @Get(':id/pdf')
  @Roles('super_admin', 'branch_manager', 'academic', 'teacher')
  async pdf(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser, @Res() res: Response) {
    const buf = await this.service.generatePdf(id, user);
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="certificate-${id}.pdf"` });
    res.send(buf);
  }

  /** Public no-login verification (SRS 4.9). */
  @Public()
  @Get('verify/:code')
  verify(@Param('code') code: string) {
    return this.service.verify(code);
  }
}
