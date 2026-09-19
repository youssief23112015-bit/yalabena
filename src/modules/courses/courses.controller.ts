import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiParam } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { Course } from '../../shared/entities/course.entity';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Courses')
@ApiBearerAuth('JWT')
@Controller('courses')
export class CoursesController {
  constructor(private readonly service: CoursesService) {}

  @Post()
  @Roles('super_admin', 'academic', 'branch_manager')
  @ApiOperation({ summary: 'Create a new course (with name, level, duration, syllabus, default price)' })
  @ApiResponse({ status: 201, description: 'Course created successfully.' })
  @ApiBody({ 
    description: 'Course creation payload',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'English Level 1' },
        level: { type: 'string', example: 'Beginner' },
        duration_hours: { type: 'number', example: 30 },
        syllabus: { type: 'string', example: 'Basics of English grammar and vocabulary' },
        default_price: { type: 'number', example: 1500 },
      },
      required: ['name', 'level']
    }
  })
  async create(@Body() createData: Partial<Course>) {
    return this.service.create(createData);
  }

  @Get()
  @ApiOperation({ summary: 'Get course catalog' })
  @ApiResponse({ status: 200, description: 'Returns all courses.' })
  async findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get course details including prerequisites and materials' })
  @ApiParam({ name: 'id', description: 'Course UUID or ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Returns course details.' })
  @ApiResponse({ status: 404, description: 'Course not found.' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @Roles('super_admin', 'academic', 'branch_manager')
  @ApiOperation({ summary: 'Update course details' })
  @ApiParam({ name: 'id', description: 'Course UUID or ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiBody({ 
    description: 'Course update payload',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'English Level 1 - Updated' },
        level: { type: 'string', example: 'Beginner' },
        duration_hours: { type: 'number', example: 35 },
        syllabus: { type: 'string', example: 'Updated syllabus details' },
        default_price: { type: 'number', example: 1600 },
      },
    }
  })
  @ApiResponse({ status: 200, description: 'Course updated successfully.' })
  @ApiResponse({ status: 404, description: 'Course not found.' })
  async update(@Param('id') id: string, @Body() updateData: Partial<Course>) {
    return this.service.update(id, updateData);
  }

  @Delete(':id')
  @Roles('super_admin', 'academic', 'branch_manager')
  @ApiOperation({ summary: 'Delete a course' })
  @ApiParam({ name: 'id', description: 'Course UUID or ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Course deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Course not found.' })
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  // ==================== Prerequisites Endpoints ====================

  @Post(':id/prerequisites')
  @Roles('super_admin', 'academic', 'branch_manager')
  @ApiOperation({ summary: 'Add a prerequisite course to a course' })
  @ApiParam({ name: 'id', description: 'Course UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiBody({
    description: 'Prerequisite course payload',
    schema: {
      type: 'object',
      properties: {
        prerequisiteId: { type: 'string', example: '987e6543-e21b-12d3-a456-426614174000' },
      },
      required: ['prerequisiteId'],
    },
  })
  @ApiResponse({ status: 200, description: 'Prerequisite added successfully.' })
  @ApiResponse({ status: 404, description: 'Course or Prerequisite not found.' })
  async addPrerequisite(
    @Param('id') id: string,
    @Body('prerequisiteId') prerequisiteId: string,
  ): Promise<Course> {
    return this.service.addPrerequisite(id, prerequisiteId);
  }

  @Delete(':id/prerequisites/:prerequisiteId')
  @Roles('super_admin', 'academic', 'branch_manager')
  @ApiOperation({ summary: 'Remove a prerequisite course from a course' })
  @ApiParam({ name: 'id', description: 'Course UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiParam({ name: 'prerequisiteId', description: 'Prerequisite Course UUID', example: '987e6543-e21b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Prerequisite removed successfully.' })
  @ApiResponse({ status: 404, description: 'Course not found.' })
  async removePrerequisite(
    @Param('id') id: string,
    @Param('prerequisiteId') prerequisiteId: string,
  ): Promise<Course> {
    return this.service.removePrerequisite(id, prerequisiteId);
  }
}