import { Controller, Get, Post, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { BranchsService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';

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
}