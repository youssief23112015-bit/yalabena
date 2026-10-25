import { Controller, Get, Post, Put, Delete, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { BranchsService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@ApiTags('Branches')
@ApiBearerAuth('JWT')
@Controller('branches')
export class BranchsController {
  constructor(private readonly service: BranchsService) {}

  @Post()
  @Roles('super_admin')
  @ApiOperation({ summary: 'Create a new branch' })
  @ApiResponse({ status: 201, description: 'Branch created successfully.' })
  async create(@Body() dto: CreateBranchDto) {
    return this.service.create(dto);
  }

  @Public() // public branch list for registration/booking forms (SRS 4.14)
  @Get()
  @Roles('super_admin', 'branch_manager')
  @ApiOperation({ summary: 'Get all branches' })
  @ApiResponse({ status: 200, description: 'Return all branches.' })
  async findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Roles('super_admin', 'branch_manager')
  @ApiOperation({ summary: 'Get branch by id' })
  @ApiResponse({ status: 200, description: 'Return branch details.' })
  @ApiResponse({ status: 404, description: 'Branch not found.' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Update a branch' })
  @ApiResponse({ status: 200, description: 'Branch updated.' })
  @ApiResponse({ status: 404, description: 'Branch not found.' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBranchDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Delete a branch (refused while students are linked)' })
  @ApiResponse({ status: 200, description: 'Branch deleted.' })
  @ApiResponse({ status: 404, description: 'Branch not found.' })
  @ApiResponse({ status: 409, description: 'Branch still has students.' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}