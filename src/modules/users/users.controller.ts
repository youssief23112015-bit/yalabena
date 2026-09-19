import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

interface AuthUser {
  userId: string;
  email: string;
  branchId: string;
  roles: string[];
  permissions: string[];
}

@ApiTags('Users')
@ApiBearerAuth('JWT')
@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  /**
   * Branch-scoped rule: super_admin can create users in ANY branch.
   * branch_manager / hr can only create users inside their OWN branch.
   */
  @Post()
  @Roles('super_admin', 'branch_manager', 'hr')
  @Permissions('users:create')
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden: cross-branch creation.' })
  async create(@Body() dto: CreateUserDto, @CurrentUser() user: AuthUser) {
    if (!user.roles.includes('super_admin') && dto.branch_id !== user.branchId) {
      throw new ForbiddenException(
        'You can only create users in your own branch',
      );
    }
    return this.service.create(dto, user.userId);
  }

  @Get()
  @Roles('super_admin', 'branch_manager', 'hr')
  @Permissions('users:read')
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Return all users.' })
  async findAll(@CurrentUser() user: AuthUser) {
    // Non-super-admins see only their own branch's users.
    if (!user.roles.includes('super_admin')) {
      return this.service.findAll({ branchId: user.branchId });
    }
    return this.service.findAll();
  }

  @Get(':id')
  @Roles('super_admin', 'branch_manager', 'hr')
  @Permissions('users:read')
  @ApiOperation({ summary: 'Get user by id' })
  @ApiResponse({ status: 200, description: 'Return user details.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const target = await this.service.findOne(id);
    if (!user.roles.includes('super_admin') && target.branch_id !== user.branchId) {
      throw new ForbiddenException('User belongs to a different branch');
    }
    return target;
  }

  @Patch(':id/role')
  @Roles('super_admin') // only super_admin may grant/revoke roles
  @Permissions('users:assign_role')
  @ApiOperation({ summary: 'Update user role' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        role_id: { type: 'string', format: 'uuid', example: 'd52909fe-be17-4620-9f73-abd4dc51132d' },
      },
      required: ['role_id'],
    },
  })
  @ApiResponse({ status: 200, description: 'User role updated successfully.' })
  @ApiResponse({ status: 404, description: 'User or Role not found.' })
  async updateRole(
    @Param('id') id: string,
    @Body('role_id') roleId: string,
    @CurrentUser() currentUser: AuthUser,
  ) {
    return this.service.updateRole(id, roleId, currentUser.userId);
  }
}