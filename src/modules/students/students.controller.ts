import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseUUIDPipe } from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { StudentQueryDto } from './dto/student-query.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/utils/branch-scope';

@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @Roles('super_admin', 'branch_manager', 'hr', 'sales')
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(createStudentDto);
  }

  /**
   * The logged-in student's own profile (incl. current_level) — powers the
   * level-eligibility check in the "Book this Course" flow. MUST be declared
   * before '/:id' so the literal 'me' path wins over the parameter route.
   */
  @Get('me')
  @Roles('student')
  async findMe(@CurrentUser() user: AuthUser) {
    return this.studentsService.findByUserId(user?.id ?? user?.userId);
  }

  @Get()
  @Roles('super_admin', 'branch_manager', 'sales', 'finance', 'academic', 'teacher')
  findAll(@Query() query: StudentQueryDto) {
    return this.studentsService.findAll(query);
  }

  @Get(':id')
  @Roles('super_admin', 'branch_manager', 'sales', 'finance', 'academic', 'teacher')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.studentsService.findOne(id);
  }

  @Patch(':id')
  @Roles('super_admin', 'branch_manager', 'hr')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateStudentDto: UpdateStudentDto) {
    return this.studentsService.update(id, updateStudentDto);
  }

  @Delete(':id')
  @Roles('super_admin', 'branch_manager', 'hr')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.studentsService.remove(id);
  }

  // --- Sub-resources Endpoints ---

  @Get(':id/groups')
  @Roles('super_admin', 'branch_manager', 'sales', 'finance', 'academic', 'teacher')
  getGroups(@Param('id', ParseUUIDPipe) id: string) {
    return this.studentsService.getGroups(id);
  }

  @Get(':id/attendance')
  @Roles('super_admin', 'branch_manager', 'sales', 'finance', 'academic', 'teacher')
  getAttendance(@Param('id', ParseUUIDPipe) id: string) {
    return this.studentsService.getAttendance(id);
  }

  @Get(':id/certificates')
  @Roles('super_admin', 'branch_manager', 'sales', 'finance', 'academic', 'teacher')
  getCertificates(@Param('id', ParseUUIDPipe) id: string) {
    return this.studentsService.getCertificates(id);
  }

  @Get(':id/payments')
  @Roles('super_admin', 'branch_manager', 'sales', 'finance', 'academic', 'teacher')
  getPayments(@Param('id', ParseUUIDPipe) id: string) {
    return this.studentsService.getPayments(id);
  }

  @Get(':id/level-history')
  @Roles('super_admin', 'branch_manager', 'sales', 'finance', 'academic', 'teacher')
  getLevelHistory(@Param('id', ParseUUIDPipe) id: string) {
    return this.studentsService.getLevelHistory(id);
  }
}