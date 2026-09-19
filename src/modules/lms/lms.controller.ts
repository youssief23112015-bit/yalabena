import { Controller, Get, Post, Put, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { LmsService } from './lms.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';

@ApiTags('LMS')
@ApiBearerAuth('JWT')
@Controller('lms')
export class LmsController {
  constructor(private readonly service: LmsService) {}

  // ==========================================
  // MODULES
  // ==========================================

  @Post('modules')
  @Roles('super_admin', 'academic', 'teacher')
  @ApiOperation({ summary: 'Create module' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['title', 'group_id', 'order_index'],
      properties: {
        title: { type: 'string', example: 'Module 1: Basic Grammar' },
        description: { type: 'string', example: 'Introduction to tenses' },
        group_id: { type: 'string', format: 'uuid', example: '3c2ecfa2-aced-460f-9ee4-fa1af3d7161b' },
        order_index: { type: 'number', example: 1 },
      },
    },
  })
  createModule(@Body() dto: CreateModuleDto, @CurrentUser() user: any) {
    return this.service.createModule(dto, user.userId);
  }

  @Get('modules')
  @Roles('super_admin', 'academic', 'teacher', 'student')
  @ApiOperation({ summary: 'List modules for group' })
  findModules(@Query('group_id', ParseUUIDPipe) groupId: string) {
    return this.service.findModules(groupId);
  }

  // ==========================================
  // LESSONS
  // ==========================================

  @Post('lessons')
  @Roles('super_admin', 'academic', 'teacher')
  @ApiOperation({ summary: 'Create lesson' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['module_id', 'title', 'order_index'],
      properties: {
        module_id: { type: 'string', format: 'uuid', example: '3c2ecfa2-aced-460f-9ee4-fa1af3d7161b' },
        title: { type: 'string', example: 'Lesson 1: Present Simple' },
        content: { type: 'string', example: 'Detailed lesson text or HTML here...' },
        order_index: { type: 'number', example: 1 },
      },
    },
  })
  createLesson(@Body() dto: CreateLessonDto) {
    return this.service.createLesson(dto);
  }

  @Get('lessons')
  @Roles('super_admin', 'academic', 'teacher', 'student')
  @ApiOperation({ summary: 'List lessons for module' })
  findLessons(@Query('module_id', ParseUUIDPipe) moduleId: string) {
    return this.service.findLessons(moduleId);
  }

  // ==========================================
  // RESOURCES
  // ==========================================

  @Post('resources')
  @Roles('super_admin', 'academic', 'teacher')
  @ApiOperation({ summary: 'Add resource' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['title', 'file_url', 'lesson_id'],
      properties: {
        lesson_id: { type: 'string', format: 'uuid', example: '3c2ecfa2-aced-460f-9ee4-fa1af3d7161b' },
        title: { type: 'string', example: 'Grammar Worksheets PDF' },
        file_url: { type: 'string', example: 'https://storage.example.com/files/grammar.pdf' },
        type: { type: 'string', example: 'pdf' },
      },
    },
  })
  createResource(@Body() dto: any) {
    return this.service.createResource(dto);
  }

  // ==========================================
  // ASSIGNMENTS
  // ==========================================

  @Post('assignments')
  @Roles('super_admin', 'academic', 'teacher')
  @ApiOperation({ summary: 'Create assignment' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['group_id', 'title', 'max_score'],
      properties: {
        group_id: { type: 'string', format: 'uuid', example: '3c2ecfa2-aced-460f-9ee4-fa1af3d7161b' },
        title: { type: 'string', example: 'Essay 1: Introduce Yourself' },
        instructions: { type: 'string', example: 'Write a 200-word introduction about yourself.' },
        max_score: { type: 'number', example: 100 },
        due_date: { type: 'string', format: 'date-time', example: '2026-09-01T23:59:59.000Z' },
      },
    },
  })
  createAssignment(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createAssignment(dto, user.userId);
  }

  @Get('assignments')
  @Roles('super_admin', 'academic', 'teacher', 'student')
  @ApiOperation({ summary: 'List assignments' })
  findAssignments(@Query('group_id', ParseUUIDPipe) groupId: string) {
    return this.service.findAssignments(groupId);
  }

  @Post('submissions')
  @Roles('student')
  @ApiOperation({ summary: 'Submit assignment' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['assignment_id', 'content'],
      properties: {
        assignment_id: { type: 'string', format: 'uuid', example: '3c2ecfa2-aced-460f-9ee4-fa1af3d7161b' },
        content: { type: 'string', example: 'Here is my submission text.' },
        file_url: { type: 'string', example: 'https://storage.example.com/submissions/essay1.docx' },
      },
    },
  })
  submitAssignment(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.submitAssignment(dto, user.userId);
  }

  @Put('submissions/:id/grade')
  @Roles('super_admin', 'academic', 'teacher')
  @ApiOperation({ summary: 'Grade submission' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['score'],
      properties: {
        score: { type: 'number', example: 85 },
        feedback: { type: 'string', example: 'Great effort! Pay attention to subject-verb agreement.' },
      },
    },
  })
  gradeSubmission(@Param('id', ParseUUIDPipe) id: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.service.gradeSubmission(id, dto, user.userId);
  }

  // ==========================================
  // QUIZZES
  // ==========================================

  @Post('quizzes')
  @Roles('super_admin', 'academic', 'teacher')
  @ApiOperation({ summary: 'Create quiz' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['group_id', 'title'],
      properties: {
        group_id: { type: 'string', format: 'uuid', example: '3c2ecfa2-aced-460f-9ee4-fa1af3d7161b' },
        title: { type: 'string', example: 'Midterm Grammar Test' },
        time_limit_minutes: { type: 'number', example: 30 },
        passing_score: { type: 'number', example: 70 },
      },
    },
  })
  createQuiz(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createQuiz(dto, user.userId);
  }

  @Get('quizzes')
  @Roles('super_admin', 'academic', 'teacher', 'student')
  @ApiOperation({ summary: 'List quizzes' })
  findQuizzes(@Query('group_id', ParseUUIDPipe) groupId: string) {
    return this.service.findQuizzes(groupId);
  }

  @Post('quizzes/:id/start')
  @Roles('student')
  @ApiOperation({ summary: 'Start quiz attempt' })
  startAttempt(@Param('id', ParseUUIDPipe) quizId: string, @CurrentUser() user: any) {
    return this.service.startAttempt(quizId, user.userId);
  }

  @Put('attempts/:id/submit')
  @Roles('student')
  @ApiOperation({ summary: 'Submit quiz attempt' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['answers', 'time_spent_seconds'],
      properties: {
        answers: {
          type: 'object',
          example: { q1: 'A', q2: 'C', q3: 'B' },
        },
        time_spent_seconds: { type: 'number', example: 450 },
      },
    },
  })
  submitAttempt(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { answers: any; time_spent_seconds: number },
  ) {
    return this.service.submitAttempt(id, dto.answers, dto.time_spent_seconds);
  }

  // ==========================================
  // GRADEBOOK
  // ==========================================

  @Post('gradebook/categories')
  @Roles('super_admin', 'academic', 'teacher')
  @ApiOperation({ summary: 'Create gradebook category' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['group_id', 'name', 'weight'],
      properties: {
        group_id: { type: 'string', format: 'uuid', example: '3c2ecfa2-aced-460f-9ee4-fa1af3d7161b' },
        name: { type: 'string', example: 'Homework & Assignments' },
        weight: { type: 'number', example: 30 },
      },
    },
  })
  createCategory(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createCategory(dto, user.userId);
  }

  @Post('gradebook/entries')
  @Roles('super_admin', 'academic', 'teacher')
  @ApiOperation({ summary: 'Add gradebook entry' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['student_id', 'category_id', 'score'],
      properties: {
        student_id: { type: 'string', format: 'uuid', example: '3c2ecfa2-aced-460f-9ee4-fa1af3d7161b' },
        category_id: { type: 'string', format: 'uuid', example: '3c2ecfa2-aced-460f-9ee4-fa1af3d7161b' },
        score: { type: 'number', example: 92 },
        notes: { type: 'string', example: 'Excellent active participation' },
      },
    },
  })
  addEntry(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.addEntry(dto, user.userId);
  }

  @Get('gradebook')
  @Roles('super_admin', 'academic', 'teacher', 'student')
  @ApiOperation({ summary: 'Get gradebook for group' })
  getGradebook(@Query('group_id', ParseUUIDPipe) groupId: string) {
    return this.service.getGradebook(groupId);
  }

  // ==========================================
  // EVALUATIONS & SURVEYS
  // ==========================================

  @Post('evaluations')
  @Roles('super_admin', 'academic', 'teacher')
  @ApiOperation({ summary: 'Create teacher evaluation' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['teacher_id', 'group_id', 'rating'],
      properties: {
        teacher_id: { type: 'string', format: 'uuid', example: '3c2ecfa2-aced-460f-9ee4-fa1af3d7161b' },
        group_id: { type: 'string', format: 'uuid', example: '3c2ecfa2-aced-460f-9ee4-fa1af3d7161b' },
        rating: { type: 'number', example: 5 },
        comments: { type: 'string', example: 'Demonstrates exceptional clarity during lectures.' },
      },
    },
  })
  createEvaluation(@Body() dto: any) {
    return this.service.createEvaluation(dto);
  }

  @Post('surveys')
  @Roles('student')
  @ApiOperation({ summary: 'Submit student survey' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['group_id', 'feedback'],
      properties: {
        group_id: { type: 'string', format: 'uuid', example: '3c2ecfa2-aced-460f-9ee4-fa1af3d7161b' },
        satisfaction_score: { type: 'number', example: 4 },
        feedback: { type: 'string', example: 'Course materials were easy to navigate.' },
      },
    },
  })
  createSurvey(@Body() dto: any) {
    return this.service.createSurvey(dto);
  }
}