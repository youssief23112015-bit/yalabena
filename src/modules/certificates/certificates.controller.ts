import { Controller, Get, Post, Put, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CertificatesService } from './certificates.service';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { CreateTemplateDto } from './dto/create-template.dto';

@ApiTags('Certificates')
@ApiBearerAuth('JWT')
@Controller('certificates')
export class CertificatesController {
  constructor(private readonly service: CertificatesService) {}

  @Post('templates')
  @Roles('super_admin', 'academic')
  @ApiOperation({ summary: 'Create certificate template' })
  createTemplate(@Body() dto: CreateTemplateDto, @CurrentUser() user: any) {
    return this.service.createTemplate(dto, user.userId);
  }

  @Get('templates')
  @Roles('super_admin', 'academic', 'branch_manager')
  @ApiOperation({ summary: 'List templates' })
  findTemplates(@Query() query: any) {
    return this.service.findTemplates(query);
  }

  @Post()
  @Roles('super_admin', 'academic', 'branch_manager')
  @ApiOperation({ summary: 'Issue certificate' })
  issue(@Body() dto: CreateCertificateDto, @CurrentUser() user: any) {
    return this.service.issue(dto, user.userId);
  }

  @Post('bulk-issue')
  @Roles('super_admin', 'academic')
  @ApiOperation({ summary: 'Bulk issue for group' })
  bulkIssue(
    @Body('group_id', ParseUUIDPipe) groupId: string,
    @Body('template_id', ParseUUIDPipe) templateId: string,
    @CurrentUser() user: any,
  ) {
    return this.service.bulkIssue(groupId, templateId, user.userId);
  }

  @Get()
  @Roles('super_admin', 'academic', 'branch_manager', 'finance')
  @ApiOperation({ summary: 'List certificates' })
  findAll(@Query() query: any, @CurrentUser() user: any) {
    return this.service.findAll(query, user);
  }

  @Get(':id')
  @Roles('super_admin', 'academic', 'branch_manager')
  @ApiOperation({ summary: 'Get certificate' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Public()
  @Get('verify/:code')
  @ApiOperation({ summary: 'Public certificate verification' })
  verify(@Param('code') code: string) {
    return this.service.verify(code);
  }

  @Put(':id/revoke')
  @Roles('super_admin', 'academic')
  @ApiOperation({ summary: 'Revoke certificate' })
  revoke(@Param('id', ParseUUIDPipe) id: string, @Body('reason') reason: string) {
    return this.service.revoke(id, reason);
  }
}
