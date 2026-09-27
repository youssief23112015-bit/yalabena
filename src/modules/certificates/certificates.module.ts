import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CertificatesController } from './certificates.controller';
import { CertificatesService } from './certificates.service';
import { Certificate } from '../../shared/entities/certificate.entity';
import { CertificateTemplate } from '../../shared/entities/certificate-template.entity';
import { Student } from '../../shared/entities/student.entity';
import { Course } from '../../shared/entities/course.entity';
import { Group } from '../../shared/entities/group.entity';
import { GroupStudent } from '../../shared/entities/group-student.entity';
import { GradebookCategory } from '../../shared/entities/gradebook-category.entity';
import { GradebookEntry } from '../../shared/entities/gradebook-entry.entity';
import { Setting } from '../../shared/entities/setting.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Certificate, CertificateTemplate, Student, Course, Group, GroupStudent,
      GradebookCategory, GradebookEntry, Setting,
    ]),
  ],
  controllers: [CertificatesController],
  providers: [CertificatesService],
  exports: [CertificatesService],
})
export class CertificatesModule {}
