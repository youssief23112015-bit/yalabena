import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseUUIDPipe } from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { StudentQueryDto } from './dto/student-query.dto';

@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(createStudentDto);
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