import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from '../../shared/entities/course.entity';
import { CourseMaterial } from '../../shared/entities/course-material.entity';
import { CoursePrerequisite } from '../../shared/entities/course-prerequisite.entity';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';

@Module({
  imports: [TypeOrmModule.forFeature([Course, CourseMaterial, CoursePrerequisite])],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}
