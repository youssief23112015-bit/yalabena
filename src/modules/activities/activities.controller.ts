import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiParam, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/utils/branch-scope';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { ActivityQueryDto } from './dto/activity-query.dto';
import { RegisterActivityDto } from './dto/register-activity.dto';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { AddPhotoDto } from './dto/add-photo.dto';
import { PayRegistrationDto } from './dto/pay-registration.dto';

@ApiTags('Activities')
@ApiBearerAuth('JWT')
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly service: ActivitiesService) {}

  // ─── STATIC ROUTES FIRST (before :id) ───

  @Post('registrations/:registrationId/pay')
  @Roles('super_admin', 'branch_manager', 'finance', 'sales')
  @ApiOperation({ summary: 'Collect the optional fee for an activity registration' })
  @ApiParam({ name: 'registrationId', format: 'uuid' })
  payRegistration(
    @Param('registrationId', ParseUUIDPipe) registrationId: string,
    @Body() dto: PayRegistrationDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.payRegistration(registrationId, dto, user);
  }

  @Delete('registrations/:registrationId')
  @Roles('super_admin', 'branch_manager', 'sales', 'academic', 'student')
  @ApiOperation({ summary: 'Cancel an activity registration (frees the seat)' })
  @ApiParam({ name: 'registrationId', format: 'uuid' })
  cancelRegistration(
    @Param('registrationId', ParseUUIDPipe) registrationId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.cancelRegistration(registrationId, user);
  }

  @Delete('photos/:photoId')
  @Roles('super_admin', 'branch_manager', 'teacher')
  @ApiOperation({ summary: 'Remove a photo from an activity gallery' })
  @ApiParam({ name: 'photoId', format: 'uuid' })
  removePhoto(
    @Param('photoId', ParseUUIDPipe) photoId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.removePhoto(photoId, user);
  }

  // ─── ACTIVITIES CRUD ───

  @Post()
  @Roles('super_admin', 'branch_manager', 'academic')
  @ApiOperation({ summary: 'Schedule a new extracurricular activity (SRS 4.11)' })
  @ApiBody({ type: CreateActivityDto })
  @ApiResponse({ status: 201, description: 'Activity created successfully.' })
  @ApiResponse({ status: 403, description: 'Cross-branch creation denied.' })
  create(@Body() dto: CreateActivityDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user);
  }

  @Get()
  @Roles('super_admin', 'branch_manager', 'academic', 'teacher', 'student')
  @ApiOperation({ summary: 'List activities with type/level/branch/status/search filters' })
  @ApiQuery({ name: 'type', required: false, description: 'movie_night | conversation_club | trip | contest | workshop | other' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'level', required: false, description: 'e.g. B1 — includes open-to-all activities' })
  @ApiQuery({ name: 'branch_id', required: false, description: 'UUID branch filter' })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, description: 'Returns activities list with registered_count.' })
  findAll(@Query() query: ActivityQueryDto, @CurrentUser() user: AuthUser) {
    return this.service.findAll(query, user);
  }

  @Get(':id')
  @Roles('super_admin', 'branch_manager', 'academic', 'teacher', 'student')
  @ApiOperation({ summary: 'Get activity details (registrations + photo gallery)' })
  @ApiParam({ name: 'id', description: 'Activity UUID' })
  @ApiResponse({ status: 200, description: 'Returns activity details.' })
  @ApiResponse({ status: 404, description: 'Activity not found.' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.service.findOne(id, user);
  }

  @Put(':id')
  @Roles('super_admin', 'branch_manager', 'academic')
  @ApiOperation({ summary: 'Update an activity (schedule, capacity, fee, targeting)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: UpdateActivityDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateActivityDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  @Roles('super_admin', 'branch_manager')
  @ApiOperation({ summary: 'Delete an activity (cascades registrations/photos)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.service.remove(id, user);
  }

  // ─── REGISTRATION ───

  @Post(':id/registrations')
  @Roles('super_admin', 'branch_manager', 'academic', 'teacher', 'sales', 'student')
  @ApiOperation({ summary: 'Register a student for an activity (level/group targeting enforced)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: RegisterActivityDto })
  @ApiResponse({ status: 201, description: 'Registration created; returns updated activity.' })
  @ApiResponse({ status: 400, description: 'Targeting/capacity/duplicate violation.' })
  register(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RegisterActivityDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.register(id, dto, user);
  }

  // ─── ATTENDANCE ───

  @Get(':id/attendance')
  @Roles('super_admin', 'branch_manager', 'academic', 'teacher')
  @ApiOperation({ summary: 'Get attendance tracking dashboard data for an activity' })
  @ApiParam({ name: 'id', format: 'uuid' })
  getAttendance(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.service.getAttendance(id, user);
  }

  @Post(':id/attendance')
  @Roles('super_admin', 'branch_manager', 'academic', 'teacher')
  @ApiOperation({ summary: 'Mark attendance (single or bulk): registered | attended | no_show' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: MarkAttendanceDto })
  markAttendance(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MarkAttendanceDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.markAttendance(id, dto, user);
  }

  // ─── PHOTO GALLERY ───

  @Post(':id/photos')
  @Roles('super_admin', 'branch_manager', 'academic', 'teacher')
  @ApiOperation({ summary: 'Add a photo to an activity gallery (upload via /files/upload?kind=activity first)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: AddPhotoDto })
  @ApiResponse({ status: 201, description: 'Photo added.' })
  addPhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddPhotoDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.addPhoto(id, dto, user);
  }
}

