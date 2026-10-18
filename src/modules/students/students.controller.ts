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
  findAll(@Query() query: StudentQueryDto) {
    return this.studentsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.studentsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateStudentDto: UpdateStudentDto) {
    return this.studentsService.update(id, updateStudentDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.studentsService.remove(id);
  }

  // --- Sub-resources Endpoints ---

  @Get(':id/groups')
  getGroups(@Param('id', ParseUUIDPipe) id: string) {
    return this.studentsService.getGroups(id);
  }

  @Get(':id/attendance')
  getAttendance(@Param('id', ParseUUIDPipe) id: string) {
    return this.studentsService.getAttendance(id);
  }

  @Get(':id/certificates')
  getCertificates(@Param('id', ParseUUIDPipe) id: string) {
    return this.studentsService.getCertificates(id);
  }

  @Get(':id/payments')
  getPayments(@Param('id', ParseUUIDPipe) id: string) {
    return this.studentsService.getPayments(id);
  }

  @Get(':id/level-history')
  getLevelHistory(@Param('id', ParseUUIDPipe) id: string) {
    return this.studentsService.getLevelHistory(id);
  }
}