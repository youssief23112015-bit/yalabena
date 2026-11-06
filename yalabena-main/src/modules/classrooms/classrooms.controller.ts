import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiBody, ApiParam } from '@nestjs/swagger';
import { ClassroomsService } from './classrooms.service';
import { Classroom } from '../../shared/entities/classroom.entity';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Classrooms')
@ApiBearerAuth('JWT')
@Controller('classrooms')
export class ClassroomsController {
  constructor(private readonly service: ClassroomsService) {}

  @Post()
  @Roles('super_admin', 'branch_manager', 'academic')
  @ApiOperation({ summary: 'Create a new classroom' })
  @ApiBody({ 
    description: 'Classroom creation payload',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Room A1' },
        capacity: { type: 'number', example: 20 },
        branchId: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
        room_type: { type: 'string', example: 'Physical' }, // أو Online حسب الـ Entity عندك
      },
      required: ['name', 'capacity']
    }
  })
  @ApiResponse({ status: 201, description: 'Classroom created successfully.' })
  async create(@Body() createData: Partial<Classroom>) {
    return this.service.create(createData);
  }

  @Get()
  @Roles('super_admin', 'branch_manager', 'academic', 'teacher')
  @ApiOperation({ summary: 'Get all classrooms with optional branch filter' })
  @ApiQuery({ name: 'branchId', required: false, description: 'Filter classrooms by branch' })
  async findAll(@Query('branchId') branchId?: string) {
    return this.service.findAll(branchId);
  }

  @Get(':id')
  @Roles('super_admin', 'branch_manager', 'academic', 'teacher')
  @ApiOperation({ summary: 'Get classroom details by id' })
  @ApiParam({ name: 'id', description: 'Classroom UUID or ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Returns classroom details.' })
  @ApiResponse({ status: 404, description: 'Classroom not found.' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @Roles('super_admin', 'branch_manager', 'academic')
  @ApiOperation({ summary: 'Update classroom details' })
  @ApiParam({ name: 'id', description: 'Classroom UUID or ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiBody({ 
    description: 'Classroom update payload',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Room A1 - Updated' },
        capacity: { type: 'number', example: 25 },
        branchId: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
      },
    }
  })
  @ApiResponse({ status: 200, description: 'Classroom updated successfully.' })
  @ApiResponse({ status: 404, description: 'Classroom not found.' })
  async update(@Param('id') id: string, @Body() updateData: Partial<Classroom>) {
    return this.service.update(id, updateData);
  }

  @Delete(':id')
  @Roles('super_admin', 'branch_manager', 'academic')
  @ApiOperation({ summary: 'Delete a classroom' })
  @ApiParam({ name: 'id', description: 'Classroom UUID or ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Classroom deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Classroom not found.' })
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}