import { Controller, Get, Post, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiParam, ApiResponse } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ActivitiesService } from './activities.service';

@ApiTags('Activities')
@ApiBearerAuth('JWT')
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly service: ActivitiesService) {}

  @Post()
  @Roles('super_admin', 'branch_manager')
  @ApiOperation({ summary: 'Create activity' })
  @ApiBody({ 
    description: 'Activity creation payload',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'English Speaking Club' },
        description: { type: 'string', example: 'An interactive session to practice conversational English.' },
        branchId: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174000' },
        event_date: { type: 'string', format: 'date-time', example: '2026-09-15T15:00:00Z' },
        capacity: { type: 'number', example: 30 },
      },
      required: ['title', 'branchId', 'event_date']
    }
  })
  @ApiResponse({ status: 201, description: 'Activity created successfully.' })
  create(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.create(dto, user.userId);
  }

  @Get()
  @Roles('super_admin', 'branch_manager', 'teacher', 'student')
  @ApiOperation({ summary: 'List activities' })
  @ApiResponse({ status: 200, description: 'Returns activities list.' })
  findAll(@Query() query: any, @CurrentUser() user: any) {
    return this.service.findAll(query, user);
  }

  @Get(':id')
  @Roles('super_admin', 'branch_manager', 'teacher', 'student')
  @ApiOperation({ summary: 'Get activity' })
  @ApiParam({ name: 'id', description: 'Activity UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Returns activity details.' })
  @ApiResponse({ status: 404, description: 'Activity not found.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post('registrations')
  @Roles('student', 'super_admin', 'branch_manager', 'sales')
  @ApiOperation({ summary: 'Register for activity' })
  @ApiBody({ 
    description: 'Activity registration payload',
    schema: {
      type: 'object',
      properties: {
        activityId: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174000' },
        studentId: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174000' },
      },
      required: ['activityId', 'studentId']
    }
  })
  @ApiResponse({ status: 201, description: 'Registered for activity successfully.' })
  register(@Body() dto: any) {
    return this.service.register(dto);
  }

  @Post('photos')
  @Roles('super_admin', 'branch_manager', 'teacher')
  @ApiOperation({ summary: 'Add activity photo' })
  @ApiBody({ 
    description: 'Activity photo payload',
    schema: {
      type: 'object',
      properties: {
        activityId: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174000' },
        photo_url: { type: 'string', example: 'https://storage.example.com/photos/activity-1.jpg' },
        caption: { type: 'string', example: 'Students participating in speaking club' },
      },
      required: ['activityId', 'photo_url']
    }
  })
  @ApiResponse({ status: 201, description: 'Photo added successfully.' })
  addPhoto(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.addPhoto(dto, user.userId);
  }
}