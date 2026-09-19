import { Controller, Get, Post, Put, Delete, Param, Body, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiBody, ApiParam } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { Session } from '../../shared/entities/session.entity';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Sessions')
@ApiBearerAuth('JWT')
@Controller('sessions')
export class SessionsController {
  constructor(private readonly service: SessionsService) {}

  @Post()
  @Roles('super_admin', 'academic', 'branch_manager', 'teacher')
  @ApiOperation({ summary: 'Create a new session (in_person, online, or hybrid with meeting links)' })
  @ApiBody({ 
    description: 'Session creation payload',
    schema: {
      type: 'object',
      properties: {
        groupId: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
        title: { type: 'string', example: 'Introduction to Grammar' },
        session_type: { type: 'string', enum: ['in_person', 'online', 'hybrid'], example: 'online' },
        meeting_link: { type: 'string', example: 'https://zoom.us/j/123456789' },
        classroomId: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
        start_time: { type: 'string', format: 'date-time', example: '2026-09-01T10:00:00Z' },
        end_time: { type: 'string', format: 'date-time', example: '2026-09-01T12:00:00Z' },
      },
      required: ['groupId', 'title', 'session_type']
    }
  })
  @ApiResponse({ status: 201, description: 'Session created successfully.' })
  async create(@Body() createData: Partial<Session>) {
    return this.service.create(createData);
  }

  @Get()
  @Roles('super_admin', 'academic', 'branch_manager', 'teacher')
  @ApiOperation({ summary: 'Get all sessions with optional group filter' })
  @ApiQuery({ name: 'groupId', required: false, description: 'Filter sessions by group' })
  async findAll(@Query('groupId') groupId?: string) {
    return this.service.findAll(groupId);
  }

  @Get(':id')
  @Roles('super_admin', 'academic', 'branch_manager', 'teacher')
  @ApiOperation({ summary: 'Get session details by id including attendance records' })
  @ApiParam({ name: 'id', description: 'Session UUID or ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Returns session details.' })
  @ApiResponse({ status: 404, description: 'Session not found.' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/attendance')
  @Roles('super_admin', 'academic', 'branch_manager', 'teacher')
  @ApiOperation({ summary: 'Get attendance records for a specific session' })
  @ApiParam({ name: 'id', description: 'Session UUID or ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Returns list of attendance records.' })
  @ApiResponse({ status: 404, description: 'Session not found.' })
  async getAttendance(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getAttendance(id);
  }

  @Put(':id')
  @Roles('super_admin', 'academic', 'branch_manager', 'teacher')
  @ApiOperation({ summary: 'Update session details or mark attendance' })
  @ApiParam({ name: 'id', description: 'Session UUID or ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiBody({ 
    description: 'Session update payload',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Advanced Grammar - Updated' },
        session_type: { type: 'string', enum: ['in_person', 'online', 'hybrid'], example: 'hybrid' },
        meeting_link: { type: 'string', example: 'https://zoom.us/j/987654321' },
        status: { type: 'string', example: 'scheduled' },
      },
    }
  })
  @ApiResponse({ status: 200, description: 'Session updated successfully.' })
  @ApiResponse({ status: 404, description: 'Session not found.' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() updateData: Partial<Session>) {
    return this.service.update(id, updateData);
  }

  @Delete(':id')
  @Roles('super_admin', 'academic', 'branch_manager', 'teacher')
  @ApiOperation({ summary: 'Delete a session' })
  @ApiParam({ name: 'id', description: 'Session UUID or ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Session deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Session not found.' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}