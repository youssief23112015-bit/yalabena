import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Certificate } from '../../shared/entities/certificate.entity';
import { CertificateTemplate } from '../../shared/entities/certificate-template.entity';
import { Student } from '../../shared/entities/student.entity';
import { Group } from '../../shared/entities/group.entity';
import { CertificatesController } from './certificates.controller';
import { CertificatesService } from './certificates.service';

@Module({
  imports: [TypeOrmModule.forFeature([Certificate, CertificateTemplate, Student, Group])],
  controllers: [CertificatesController],
  providers: [CertificatesService],
  exports: [CertificatesService],
})
export class CertificatesModule {}
