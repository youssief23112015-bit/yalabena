import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Certificate } from '../../shared/entities/certificate.entity';
import { CertificateTemplate } from '../../shared/entities/certificate-template.entity';
import { Student } from '../../shared/entities/student.entity';
import { Group } from '../../shared/entities/group.entity';
import { CertStatus } from '../../common/enums/cert-status.enum';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { CreateTemplateDto } from './dto/create-template.dto';

@Injectable()
export class CertificatesService {
  constructor(
    @InjectRepository(Certificate) private certRepo: Repository<Certificate>,
    @InjectRepository(CertificateTemplate) private templateRepo: Repository<CertificateTemplate>,
    @InjectRepository(Student) private studentRepo: Repository<Student>,
    @InjectRepository(Group) private groupRepo: Repository<Group>,
  ) {}

  // Templates
  async createTemplate(dto: CreateTemplateDto, userId: string) {
    const template = this.templateRepo.create({ ...dto, created_by: userId });
    return this.templateRepo.save(template);
  }

  async findTemplates(query: any) {
    return this.templateRepo.find({
      where: { status: query.status || 'active' },
      relations: ['course'],
    });
  }

  // Certificates
  async issue(dto: CreateCertificateDto, userId: string) {
    const student = await this.studentRepo.findOne({ where: { id: dto.student_id } });
    if (!student) throw new NotFoundException('Student not found');

    const group = await this.groupRepo.findOne({ where: { id: dto.group_id } });
    if (!group) throw new NotFoundException('Group not found');

    const code = `CERT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const cert = this.certRepo.create({
      ...dto,
      code,
      issue_date: new Date(),
      issued_by: userId,
      status: CertStatus.ACTIVE,
    });
    return this.certRepo.save(cert);
  }

  async bulkIssue(groupId: string, templateId: string, userId: string) {
    const groupStudents = await this.groupRepo.createQueryBuilder('g')
      .leftJoinAndSelect('g.group_students', 'gs')
      .leftJoinAndSelect('gs.student', 's')
      .where('g.id = :gid', { gid: groupId })
      .andWhere('gs.status = :status', { status: 'active' })
      .getOne();

    if (!groupStudents) throw new NotFoundException('Group not found');

    const certificates = [];
    for (const gs of groupStudents.group_students || []) {
      const code = `CERT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const cert = this.certRepo.create({
        student_id: gs.student_id,
        course_id: groupStudents.course_id,
        group_id: groupId,
        template_id: templateId,
        code,
        issue_date: new Date(),
        issued_by: userId,
        status: CertStatus.ACTIVE,
        is_auto_issued: true,
      });
      certificates.push(cert);
    }
    return this.certRepo.save(certificates);
  }

  async findAll(query: any, user: any) {
    const qb = this.certRepo.createQueryBuilder('c')
      .leftJoinAndSelect('c.student', 'student')
      .leftJoinAndSelect('student.user', 'user')
      .leftJoinAndSelect('c.course', 'course')
      .orderBy('c.created_at', 'DESC');

    if (!user.roles?.includes('super_admin')) {
      qb.andWhere('c.branch_id = :branchId', { branchId: user.branchId });
    }
    if (query.student_id) qb.andWhere('c.student_id = :sid', { sid: query.student_id });
    if (query.status) qb.andWhere('c.status = :status', { status: query.status });

    return qb.getMany();
  }

  async findOne(id: string) {
    const cert = await this.certRepo.findOne({
      where: { id },
      relations: ['student', 'student.user', 'course', 'group', 'template'],
    });
    if (!cert) throw new NotFoundException('Certificate not found');
    return cert;
  }

  async verify(code: string) {
    const cert = await this.certRepo.findOne({
      where: { code, status: CertStatus.ACTIVE },
      relations: ['student', 'student.user', 'course'],
    });
    if (!cert) return { valid: false };
    return {
      valid: true,
      student_name: `${cert.student.user.first_name} ${cert.student.user.last_name}`,
      course: cert.course?.name,
      issue_date: cert.issue_date,
    };
  }

  async revoke(id: string, reason: string) {
    const cert = await this.certRepo.findOne({ where: { id } });
    if (!cert) throw new NotFoundException('Certificate not found');
    cert.status = CertStatus.REVOKED;
    cert.revoked_at = new Date();
    cert.revoke_reason = reason;
    return this.certRepo.save(cert);
  }
}
