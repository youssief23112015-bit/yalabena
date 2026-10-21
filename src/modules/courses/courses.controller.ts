import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiParam } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { CoursesService } from './courses.service';
import { Course } from '../../shared/entities/course.entity';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Courses')
@ApiBearerAuth('JWT')
@Controller('courses')
export class CoursesController {
  constructor(private readonly service: CoursesService) {}

  @Post()
  @Roles('super_admin', 'academic')
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

  @Public() // public course catalog (SRS 4.14)
  @Get()
  @ApiOperation({ summary: 'Get course catalog' })
  @ApiResponse({ status: 200, description: 'Returns all courses.' })
  async findAll() {
    return this.service.findAll();
  }

  @Public() // public course detail (SRS 4.14)
  @Get(':id')
  @ApiOperation({ summary: 'Get course details including prerequisites and materials' })
  @ApiParam({ name: 'id', description: 'Course UUID or ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Returns course details.' })
  @ApiResponse({ status: 404, description: 'Course not found.' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @Roles('super_admin', 'academic')
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
  @Roles('super_admin', 'academic')
  @ApiOperation({ summary: 'Delete a course' })
  @ApiParam({ name: 'id', description: 'Course UUID or ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Course deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Course not found.' })
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  // ==================== Prerequisites Endpoints ====================

  @Post(':id/prerequisites')
  @Roles('super_admin', 'academic')
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
  @Roles('super_admin', 'academic')
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

  // ==================== Materials Endpoints ====================

  @Get(':id/materials')
  @ApiOperation({ summary: 'List inventory materials linked to a course' })
  @ApiParam({ name: 'id', description: 'Course UUID' })
  listMaterials(@Param('id') id: string) {
    return this.service.listMaterials(id);
  }

  @Post(':id/materials')
  @Roles('super_admin', 'academic')
  @ApiOperation({ summary: 'Link an inventory item as course material' })
  @ApiParam({ name: 'id', description: 'Course UUID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['inventory_item_id'],
      properties: {
        inventory_item_id: { type: 'string', format: 'uuid' },
        quantity: { type: 'number', example: 1 },
        required: { type: 'boolean', example: true },
      },
    },
  })
  addMaterial(@Param('id') id: string, @Body() body: { inventory_item_id: string; quantity?: number; required?: boolean }) {
    return this.service.addMaterial(id, body);
  }

  @Delete(':id/materials/:materialId')
  @Roles('super_admin', 'academic')
  @ApiOperation({ summary: 'Unlink a material from a course' })
  @ApiParam({ name: 'id', description: 'Course UUID' })
  @ApiParam({ name: 'materialId', description: 'CourseMaterial UUID' })
  removeMaterial(@Param('id') id: string, @Param('materialId') materialId: string) {
    return this.service.removeMaterial(id, materialId);
  }
}