import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesService } from './roles.service';

@ApiTags('Roles')
@ApiBearerAuth('JWT')
@Controller('roles')
export class RolesController {
  constructor(private readonly service: RolesService) {}

  @Get()
  @Roles('super_admin', 'branch_manager')
  @ApiOperation({ summary: 'Get all RBAC roles' })
  @ApiResponse({ status: 200, description: 'Return all roles with their permissions.' })
  async findAll() {
    return this.service.findAll();
  }

  @Get('permissions')
  @Roles('super_admin', 'branch_manager')
  @ApiOperation({ summary: 'Get all permissions' })
  async findPermissions() {
    return this.service.findPermissions();
  }

  @Get(':id/users')
  @Roles('super_admin', 'branch_manager')
  @ApiOperation({ summary: 'Get users assigned to a role' })
  async findRoleUsers(@Param('id') id: string) {
    return this.service.findRoleUsers(id);
  }

  @Get(':id')
  @Roles('super_admin', 'branch_manager')
  @ApiOperation({ summary: 'Get role by id with permissions' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('super_admin')
  @ApiOperation({ summary: 'Create a custom role' })
  async create(@Body() dto: { name: string; slug: string; description?: string; permission_ids?: string[] }) {
    return this.service.create(dto);
  }

  @Put(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Update a role and synchronize permissions' })
  async update(
    @Param('id') id: string,
    @Body() dto: { name?: string; description?: string; permission_ids?: string[] },
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Delete a custom role' })
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
