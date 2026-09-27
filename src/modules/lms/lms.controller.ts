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
  UseGuards,
  Res,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';

// ✅ Guards
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { EnrollmentGuard } from './guards/enrollment.guard';

// ✅ Decorators
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

// ✅ Service
import { LmsService } from './lms.service';
import type { UploadedMulterFile } from '../files/files.service';

// ✅ DTOs
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { CreateResourceDto } from './dto/create-resource.dto';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { SubmitAssignmentDto } from './dto/submit-assignment.dto';
import { GradeSubmissionDto } from './dto/grade-submission.dto';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';
import { CreateGradebookCategoryDto } from './dto/create-gradebook-category.dto';
import { CreateGradebookEntryDto } from './dto/create-gradebook-entry.dto';
import { ReorderModulesDto } from './dto/reorder-modules.dto';
import { PullQuestionsDto } from './dto/pull-questions.dto';
import { SetReleaseModeDto } from './dto/set-release-mode.dto';

@ApiTags('LMS')
@ApiBearerAuth('JWT')
@Controller('lms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LmsController {
  constructor(private readonly lmsService: LmsService) {}

  // ═══════════════════════════════════════════════════
  // GROUPS / COHORTS
  // ═══════════════════════════════════════════════════

  @Get('groups')
  @Roles('super_admin', 'academic', 'teacher', 'student')
  @ApiOperation({ summary: 'List enrolled or available groups for current user' })
  findGroups(@CurrentUser() user: any) {
    const userId = user?.id ?? user?.userId;
    const roles = user?.roles ?? [];
    return this.lmsService.findGroupsForUser(userId, roles);
  }

  // RESTful aliases for nested group routes
  @Get('groups/:groupId/modules')
  @Roles('super_admin', 'academic', 'teacher', 'student')
  @ApiOperation({ summary: 'List modules for group (Nested Path)' })
  findModulesByGroupPath(@Param('groupId') groupId: string) {
    return this.lmsService.findModules(groupId);
  }

  @Get('groups/:groupId/assignments')
  @Roles('super_admin', 'academic', 'teacher', 'student')
  @ApiOperation({ summary: 'List assignments for group (Nested Path)' })
  findAssignmentsByGroupPath(@Param('groupId') groupId: string) {
    return this.lmsService.findAssignments(groupId);
  }

  @Get('groups/:groupId/quizzes')
  @Roles('super_admin', 'academic', 'teacher', 'student')
  @ApiOperation({ summary: 'List quizzes for group (Nested Path)' })
  findQuizzesByGroupPath(@Param('groupId') groupId: string) {
    return this.lmsService.findQuizzes(groupId);
  }

  @Get('groups/:groupId/grades')
  @Roles('super_admin', 'academic', 'teacher', 'student')
  @ApiOperation({ summary: 'Get gradebook entries for group (Nested Path)' })
  getGradebookByGroupPath(@Param('groupId') groupId: string) {
    return this.lmsService.getGradebook(groupId);
  }

  @Get('groups/:groupId/evaluations')
  @Roles('super_admin', 'academic', 'teacher', 'student')
  @ApiOperation({ summary: 'Get evaluations for group (Nested Path)' })
  findEvaluationsByGroupPath(
    @Param('groupId') groupId: string,
    @Query('studentId') studentId?: string,
  ) {
    return this.lmsService.getEvaluations(groupId, studentId);
  }

  // ═══════════════════════════════════════════════════
  // MODULES
  // ═══════════════════════════════════════════════════

  @Post('modules')
  @Roles('super_admin', 'academic', 'teacher')
  @ApiOperation({ summary: 'Create module' })
  @ApiBody({ type: CreateModuleDto })
  createModule(@Body() dto: CreateModuleDto, @CurrentUser() user: any) {
    return this.lmsService.createModule(dto, user?.userId ?? user?.id);
  }

  @Get('modules')
  @Roles('super_admin', 'academic', 'teacher', 'student')
  @ApiOperation({ summary: 'List modules for group' })
  findModules(
    @Query('group_id') groupIdParam1?: string,
    @Query('groupId') groupIdParam2?: string,
  ) {
    const groupId = groupIdParam1 || groupIdParam2;
    return this.lmsService.findModules(groupId || '');
  }

  @Put('modules/reorder')
  @Roles('super_admin', 'academic', 'teacher')
  @ApiOperation({ summary: 'Reorder modules within a group' })
  @ApiBody({ type: ReorderModulesDto })
  reorderModules(@Body() dto: ReorderModulesDto) {
    return this.lmsService.reorderModules(dto.group_id, dto.ordered_ids);
  }

  @Put('modules/:id')
  @Roles('super_admin', 'academic', 'teacher')
  @ApiOperation({ summary: 'Update module' })
  @ApiBody({ type: UpdateModuleDto })
  updateModule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateModuleDto,
  ) {
    return this.lmsService.updateModule(id, dto);
  }

  @Delete('modules/:id')
  @Roles('super_admin', 'academic', 'teacher')
  @ApiOperation({ summary: 'Delete module' })
  deleteModule(@Param('id', ParseUUIDPipe) id: string) {
    return this.lmsService.deleteModule(id);
  }

  // ═══════════════════════════════════════════════════
  // LESSONS
  // ═══════════════════════════════════════════════════

  @Post('lessons')
  @Roles('super_admin', 'academic', 'teacher')
  @ApiOperation({ summary: 'Create lesson' })
  @ApiBody({ type: CreateLessonDto })
  createLesson(@Body() dto: CreateLessonDto) {
    return this.lmsService.createLesson(dto);
  }

  @Get('lessons')
  @Roles('super_admin', 'academic', 'teacher', 'student')
  @ApiOperation({ summary: 'List lessons for module' })
  findLessons(
    @Query('module_id') moduleId1?: string,
    @Query('moduleId') moduleId2?: string,
  ) {
    const moduleId = moduleId1 || moduleId2;
    return this.lmsService.findLessons(moduleId || '');
  }

  @Put('lessons/:id')
  @Roles('super_admin', 'academic', 'teacher')
  @ApiOperation({ summary: 'Update lesson' })
  @ApiBody({ type: UpdateLessonDto })
  updateLesson(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLessonDto,
  ) {
    return this.lmsService.updateLesson(id, dto);
  }

  @Delete('lessons/:id')
  @Roles('super_admin', 'academic', 'teacher')
  @ApiOperation({ summary: 'Delete lesson' })
  deleteLesson(@Param('id', ParseUUIDPipe) id: string) {
    return this.lmsService.deleteLesson(id);
  }

  // ═══════════════════════════════════════════════════
  // RESOURCES
  // ═══════════════════════════════════════════════════

  @Post('resources')
  @Roles('super_admin', 'academic', 'teacher')
  @ApiOperation({ summary: 'Add resource to lesson' })
  @ApiBody({ type: CreateResourceDto })
  createResource(@Body() dto: CreateResourceDto) {
    return this.lmsService.createResource(dto);
  }

  @Post('resources/upload')
  @Roles('super_admin', 'academic', 'teacher')
  @ApiOperation({ summary: 'Upload resource file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'lesson_id', 'title', 'type'],
      properties: {
        file: { type: 'string', format: 'binary' },
        lesson_id: { type: 'string', format: 'uuid' },
        title: { type: 'string' },
        type: { type: 'string', enum: ['file', 'video', 'audio', 'pdf'] },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadResource(
    @UploadedFile() file: UploadedMulterFile & { filename?: string; path?: string; destination?: string },
    @Body() dto: { lesson_id: string; title: string; type: string },
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const fileUrl = `/uploads/${file.filename}`;
    return this.lmsService.createResource({
      lesson_id: dto.lesson_id,
      title: dto.title,
      type: dto.type as CreateResourceDto['type'],
      file_url: fileUrl,
    });
  }

  @Get('resources/:id/download')
  @Roles('super_admin', 'academic', 'teacher', 'student')
  @UseGuards(EnrollmentGuard)
  @ApiOperation({ summary: 'Download resource (enrollment required)' })
  async downloadResource(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const resource = await this.lmsService.getResourceForDownload(id);
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${resource.title}"`,
    });
    res.send(resource.fileBuffer);
  }

  @Get('resources/:id/watermarked-pdf')
  @Roles('student')
  @UseGuards(EnrollmentGuard)
  @ApiOperation({ summary: 'Download PDF with dynamic student watermark' })
  async getWatermarkedPdf(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const userId = user?.id ?? user?.userId;
    const pdfBuffer = await this.lmsService.getWatermarkedPdf(id, userId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="watermarked-${id}.pdf"`,
    });
    res.send(pdfBuffer);
  }

  // ═══════════════════════════════════════════════════
  // ASSIGNMENTS
  // ═══════════════════════════════════════════════════

  @Post('assignments')
  @Roles('super_admin', 'academic', 'teacher')
  @ApiOperation({ summary: 'Create assignment' })
  @ApiBody({ type: CreateAssignmentDto })
  createAssignment(
    @Body() dto: CreateAssignmentDto,
    @CurrentUser() user: any,
  ) {
    return this.lmsService.createAssignment(dto, user?.userId ?? user?.id);
  }

  @Get('assignments')
  @Roles('super_admin', 'academic', 'teacher', 'student')
  @ApiOperation({ summary: 'List assignments for group' })
  findAssignments(
    @Query('group_id') groupId1?: string,
    @Query('groupId') groupId2?: string,
  ) {
    const groupId = groupId1 || groupId2;
    return this.lmsService.findAssignments(groupId || '');
  }

  @Put('assignments/:id')
  @Roles('super_admin', 'academic', 'teacher')
  @ApiOperation({ summary: 'Update assignment' })
  @ApiBody({ type: UpdateAssignmentDto })
  updateAssignment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAssignmentDto,
  ) {
    return this.lmsService.updateAssignment(id, dto);
  }

  @Delete('assignments/:id')
  @Roles('super_admin', 'academic', 'teacher')
  @ApiOperation({ summary: 'Delete assignment' })
  deleteAssignment(@Param('id', ParseUUIDPipe) id: string) {
    return this.lmsService.deleteAssignment(id);
  }

  // ═══════════════════════════════════════════════════
  // SUBMISSIONS & GRADING
  // ═══════════════════════════════════════════════════

  @Post('submissions')
  @Roles('student')
  @ApiOperation({ summary: 'Submit assignment' })
  @ApiBody({ type: SubmitAssignmentDto })
  submitAssignment(@Body() dto: SubmitAssignmentDto, @CurrentUser() user: any) {
    return this.lmsService.submitAssignment(dto, user?.userId ?? user?.id);
  }

  @Get('submissions')
  @Roles('super_admin', 'academic', 'teacher')
  @ApiOperation({ summary: 'List submissions for assignment' })
  findSubmissions(
    @Query('assignment_id') assignmentId1?: string,
    @Query('assignmentId') assignmentId2?: string,
  ) {
    const assignmentId = assignmentId1 || assignmentId2;
    return this.lmsService.findSubmissions(assignmentId || '');
  }

  @Put('submissions/:id/grade')
  @Roles('super_admin', 'academic', 'teacher')
  @ApiOperation({ summary: 'Grade submission' })
  @ApiBody({ type: GradeSubmissionDto })
  gradeSubmission(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: GradeSubmissionDto,
    @CurrentUser() user: any,
  ) {
    return this.lmsService.gradeSubmission(id, dto, user?.userId ?? user?.id);
  }

  // ═══════════════════════════════════════════════════
  // QUIZZES
  // ═══════════════════════════════════════════════════

  @Post('quizzes')
  @Roles('super_admin', 'academic', 'teacher')
  @ApiOperation({ summary: 'Create quiz' })
  @ApiBody({ type: CreateQuizDto })
  createQuiz(@Body() dto: CreateQuizDto, @CurrentUser() user: any) {
    return this.lmsService.createQuiz(dto, user?.userId ?? user?.id);
  }

  @Get('quizzes')
  @Roles('super_admin', 'academic', 'teacher', 'student')
  @ApiOperation({ summary: 'List quizzes for group' })
  findQuizzes(
    @Query('group_id') groupId1?: string,
    @Query('groupId') groupId2?: string,
  ) {
    const groupId = groupId1 || groupId2;
    return this.lmsService.findQuizzes(groupId || '');
  }

  // ═══════════════════════════════════════════════════
  // QUESTION BANK
  // ═══════════════════════════════════════════════════

  @Post('questions')
  @Roles('super_admin', 'academic', 'teacher')
  @ApiOperation({ summary: 'Create question in bank' })
  @ApiBody({ type: CreateQuestionDto })
  createQuestion(@Body() dto: CreateQuestionDto) {
    return this.lmsService.createQuestion(dto);
  }

  @Get('questions/bank')
  @Roles('super_admin', 'academic', 'teacher')
  @ApiOperation({ summary: 'List question bank' })
  getQuestionBank(
    @Query('topic_tag') topicTag?: string,
    @Query('difficulty') difficulty?: string,
  ) {
    return this.lmsService.getQuestionBank({
      topic_tag: topicTag,
      difficulty,
    });
  }

  @Post('quizzes/:id/pull-questions')
  @Roles('super_admin', 'academic', 'teacher')
  @ApiOperation({ summary: 'Pull questions from bank into quiz' })
  @ApiBody({ type: PullQuestionsDto })
  pullQuestions(
    @Param('id', ParseUUIDPipe) quizId: string,
    @Body() dto: PullQuestionsDto,
  ) {
    return this.lmsService.pullQuestionsFromBank(quizId, dto);
  }

  // ═══════════════════════════════════════════════════
  // QUIZ ATTEMPTS & RESULTS
  // ═══════════════════════════════════════════════════

  @Post('quizzes/:id/start')
  @Roles('student')
  @ApiOperation({ summary: 'Start quiz attempt' })
  startAttempt(
    @Param('id', ParseUUIDPipe) quizId: string,
    @CurrentUser() user: any,
  ) {
    return this.lmsService.startAttempt(quizId, user?.userId ?? user?.id);
  }

  @Put('attempts/:id/submit')
  @Roles('student')
  @ApiOperation({ summary: 'Submit quiz attempt' })
  @ApiBody({ type: SubmitAttemptDto })
  submitAttempt(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitAttemptDto,
  ) {
    return this.lmsService.submitAttempt(id, dto.answers, dto.time_spent_seconds);
  }

  @Put('quizzes/:id/release-mode')
  @Roles('super_admin', 'academic', 'teacher')
  @ApiOperation({ summary: 'Set quiz result release mode' })
  @ApiBody({ type: SetReleaseModeDto })
  setReleaseMode(
    @Param('id', ParseUUIDPipe) quizId: string,
    @Body() dto: SetReleaseModeDto,
  ) {
    return this.lmsService.setQuizReleaseMode(quizId, dto.release_mode);
  }

  @Get('attempts/:id/results')
  @Roles('student')
  @ApiOperation({ summary: 'Get attempt results (respects release mode)' })
  getAttemptResults(
    @Param('id', ParseUUIDPipe) attemptId: string,
    @CurrentUser() user: any,
  ) {
    return this.lmsService.getAttemptResultsForStudent(attemptId, user?.userId ?? user?.id);
  }

  @Put('attempts/:id/release')
  @Roles('super_admin', 'academic', 'teacher')
  @ApiOperation({ summary: 'Release held attempt results' })
  releaseAttempt(@Param('id', ParseUUIDPipe) attemptId: string) {
    return this.lmsService.releaseAttemptResults(attemptId);
  }

  // ═══════════════════════════════════════════════════
  // GRADEBOOK
  // ═══════════════════════════════════════════════════

  @Post('gradebook/categories')
  @Roles('super_admin', 'academic', 'teacher')
  @ApiOperation({ summary: 'Create gradebook category' })
  @ApiBody({ type: CreateGradebookCategoryDto })
  createCategory(
    @Body() dto: CreateGradebookCategoryDto,
    @CurrentUser() user: any,
  ) {
    return this.lmsService.createCategory(dto, user?.userId ?? user?.id);
  }

  @Post('gradebook/entries')
  @Roles('super_admin', 'academic', 'teacher')
  @ApiOperation({ summary: 'Add gradebook entry' })
  @ApiBody({ type: CreateGradebookEntryDto })
  addEntry(
    @Body() dto: CreateGradebookEntryDto,
    @CurrentUser() user: any,
  ) {
    return this.lmsService.addEntry(dto, user?.userId ?? user?.id);
  }

  @Get('gradebook')
  @Roles('super_admin', 'academic', 'teacher', 'student')
  @ApiOperation({ summary: 'Get gradebook entries for group' })
  getGradebook(
    @Query('group_id') groupId1?: string,
    @Query('groupId') groupId2?: string,
  ) {
    const groupId = groupId1 || groupId2;
    return this.lmsService.getGradebook(groupId || '');
  }

  @Get('gradebook/calculate')
  @Roles('super_admin', 'academic', 'teacher', 'student')
  @ApiOperation({ summary: 'Calculate weighted overall grade' })
  calculateWeighted(
    @Query('group_id') groupId1?: string,
    @Query('groupId') groupId2?: string,
    @Query('student_id') studentId1?: string,
    @Query('studentId') studentId2?: string,
  ) {
    const groupId = groupId1 || groupId2 || '';
    const studentId = studentId1 || studentId2 || '';
    return this.lmsService.calculateWeightedGrade(groupId, studentId);
  }

  // ═══════════════════════════════════════════════════
  // EVALUATIONS & SURVEYS
  // ═══════════════════════════════════════════════════

  @Post('evaluations')
  @Roles('super_admin', 'academic', 'teacher')
  @ApiOperation({ summary: 'Create teacher evaluation' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['teacher_id', 'group_id', 'rating'],
      properties: {
        teacher_id: { type: 'string', format: 'uuid' },
        group_id: { type: 'string', format: 'uuid' },
        rating: { type: 'number', example: 5 },
        comments: { type: 'string' },
      },
    },
  })
  createEvaluation(@Body() dto: any) {
    return this.lmsService.createEvaluation(dto);
  }

  @Post('surveys')
  @Roles('student')
  @ApiOperation({ summary: 'Submit student course survey' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['group_id', 'feedback'],
      properties: {
        group_id: { type: 'string', format: 'uuid' },
        satisfaction_score: { type: 'number', example: 4 },
        feedback: { type: 'string' },
      },
    },
  })
  createSurvey(@Body() dto: any) {
    return this.lmsService.createSurvey(dto);
  }
}