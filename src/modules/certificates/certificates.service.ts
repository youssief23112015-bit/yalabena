import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import * as fs from 'fs';
import { Certificate } from '../../shared/entities/certificate.entity';
import { CertificateTemplate } from '../../shared/entities/certificate-template.entity';
import { Student } from '../../shared/entities/student.entity';
import { Course } from '../../shared/entities/course.entity';
import { Group } from '../../shared/entities/group.entity';
import { GroupStudent } from '../../shared/entities/group-student.entity';
import { GradebookCategory } from '../../shared/entities/gradebook-category.entity';
import { GradebookEntry } from '../../shared/entities/gradebook-entry.entity';
import { Setting } from '../../shared/entities/setting.entity';
import { AuthUser, effectiveBranchFilter } from '../../common/utils/branch-scope';
import { buildPdf, resolveUploadPath } from '../../common/utils/pdf.helper';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { CreateTemplateDto } from './dto/create-template.dto';

@Injectable()
export class CertificatesService {
  constructor(
    @InjectRepository(Certificate) private readonly certs: Repository<Certificate>,
    @InjectRepository(CertificateTemplate) private readonly templates: Repository<CertificateTemplate>,
    @InjectRepository(Student) private readonly students: Repository<Student>,
    @InjectRepository(Course) private readonly courses: Repository<Course>,
    @InjectRepository(Group) private readonly groups: Repository<Group>,
    @InjectRepository(GroupStudent) private readonly groupStudents: Repository<GroupStudent>,
    @InjectRepository(GradebookCategory) private readonly categories: Repository<GradebookCategory>,
    @InjectRepository(GradebookEntry) private readonly entries: Repository<GradebookEntry>,
    @InjectRepository(Setting) private readonly settings: Repository<Setting>,
  ) {}

  // ---------- Templates ----------
  createTemplate(dto: CreateTemplateDto, user: AuthUser) {
    return this.templates.save(
      this.templates.create({
        name: dto.name,
        course_id: dto.course_id ?? null,
        html_template: dto.html_template,
        placeholders: dto.placeholders ?? {},
        background_url: dto.background_url ?? null,
        is_default: dto.is_default ?? false,
        created_by: user.id,
      }),
    );
  }

  listTemplates(course_id?: string) {
    return this.templates.find({ where: course_id ? { course_id } : {}, order: { created_at: 'DESC' } });
  }

  async updateTemplate(id: string, dto: Partial<CreateTemplateDto>) {
    const t = await this.templates.findOne({ where: { id } });
    if (!t) throw new NotFoundException('Template not found');
    Object.assign(t, dto);
    return this.templates.save(t);
  }

  private async pickTemplate(courseId: string, templateId?: string) {
    if (templateId) {
      const t = await this.templates.findOne({ where: { id: templateId } });
      if (t) return t;
    }
    return (
      (await this.templates.findOne({ where: { course_id: courseId, is_default: true } })) ??
      (await this.templates.findOne({ where: { course_id: courseId } })) ??
      (await this.templates.findOne({ where: { is_default: true } })) ??
      (await this.templates.findOne({ where: {} }))
    );
  }

  // ---------- Issuance ----------
  private async genCode(): Promise<string> {
    for (let i = 0; i < 5; i++) {
      const code = 'SU-' + randomBytes(5).toString('hex').toUpperCase();
      if (!(await this.certs.findOne({ where: { code } }))) return code;
    }
    throw new BadRequestException('Could not generate unique certificate code');
  }

  async issue(dto: CreateCertificateDto, user: AuthUser, isAuto = false) {
    const student = await this.students.findOne({ where: { id: dto.student_id }, relations: ['user'] });
    if (!student) throw new NotFoundException('Student not found');
    const course = await this.courses.findOne({ where: { id: dto.course_id } });
    if (!course) throw new NotFoundException('Course not found');

    const dup = await this.certs.findOne({
      where: { student_id: dto.student_id, course_id: dto.course_id, status: 'ACTIVE' as any },
    });
    if (dup) throw new BadRequestException(`Certificate already issued (code ${dup.code})`);

    const template = await this.pickTemplate(dto.course_id, dto.template_id);
    return this.certs.save(
      this.certs.create({
        student_id: dto.student_id,
        course_id: dto.course_id,
        group_id: dto.group_id,
        template_id: template?.id ?? null,
        code: await this.genCode(),
        issue_date: new Date(),
        status: 'ACTIVE' as any,
        issued_by: user?.id ?? null,
        is_auto_issued: isAuto,
      }),
    );
  }

  /** Weighted gradebook percentage for one student in one group. Null = no entries. */
  private async studentScore(groupId: string, studentId: string): Promise<number | null> {
    const [cats, ents] = await Promise.all([
      this.categories.find({ where: { group_id: groupId } }),
      this.entries.find({ where: { group_id: groupId, student_id: studentId } }),
    ]);
    if (!ents.length) return null;
    if (cats.length) {
      const weight = new Map(cats.map((c) => [c.id, Number(c.weight)]));
      const totalW = cats.reduce((s, c) => s + Number(c.weight), 0);
      if (totalW > 0) {
        const sum = ents.reduce((s, e) => s + Number(e.percentage) * (weight.get(e.category_id) ?? 0), 0);
        return Math.round((sum / totalW) * 100) / 100;
      }
    }
    const avg = ents.reduce((s, e) => s + Number(e.percentage), 0) / ents.length;
    return Math.round(avg * 100) / 100;
  }

  async autoIssueForGroup(groupId: string, user: AuthUser) {
    const group = await this.groups.findOne({ where: { id: groupId }, relations: ['course'] });
    if (!group) throw new NotFoundException('Group not found');

    const thresholdSetting = await this.settings.findOne({ where: { key: 'certificate_passing_score' } });
    const threshold = Number(thresholdSetting?.value ?? 60);

    const members = await this.groupStudents.find({ where: { group_id: groupId, status: 'active' }, relations: ['student', 'student.user'] });
    const results: any[] = [];

    for (const m of members) {
      const score = await this.studentScore(groupId, m.student_id);
      const name = m.student?.user ? `${m.student.user.first_name} ${m.student.user.last_name}` : m.student_id;
      if (score === null) {
        results.push({ student_id: m.student_id, name, score: null, issued: false, reason: 'no graded work' });
        continue;
      }
      if (score < threshold) {
        results.push({ student_id: m.student_id, name, score, issued: false, reason: `below threshold ${threshold}` });
        continue;
      }
      const dup = await this.certs.findOne({
        where: { student_id: m.student_id, course_id: group.course_id, status: 'ACTIVE' as any },
      });
      if (dup) {
        results.push({ student_id: m.student_id, name, score, issued: false, reason: `already issued (${dup.code})` });
        continue;
      }
      const cert = await this.issue(
        { student_id: m.student_id, course_id: group.course_id, group_id: groupId },
        user,
        true,
      );
      results.push({ student_id: m.student_id, name, score, issued: true, code: cert.code });
    }
    return { group_id: groupId, threshold, issued_count: results.filter((r) => r.issued).length, results };
  }

  async revoke(id: string, reason: string, user: AuthUser) {
    const c = await this.getOne(id, user);
    c.status = 'REVOKED' as any;
    c.revoked_at = new Date();
    c.revoke_reason = reason ?? null;
    return this.certs.save(c);
  }

  // ---------- Read ----------
  async list(user: AuthUser, query: { student_id?: string; course_id?: string; group_id?: string; status?: string; branch_id?: string }) {
    const qb = this.certs
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.student', 'st')
      .leftJoinAndSelect('st.user', 'u')
      .leftJoinAndSelect('c.course', 'course')
      .orderBy('c.issue_date', 'DESC');
    if (query.student_id) qb.andWhere('c.student_id = :sid', { sid: query.student_id });
    if (query.course_id) qb.andWhere('c.course_id = :cid', { cid: query.course_id });
    if (query.group_id) qb.andWhere('c.group_id = :gid', { gid: query.group_id });
    if (query.status) qb.andWhere('c.status = :st', { st: query.status });
    const branchFilter = effectiveBranchFilter(user, query.branch_id);
    if (branchFilter) qb.andWhere('st.branch_id = :b', { b: branchFilter });
    return qb.take(300).getMany();
  }

  async getOne(id: string, user: AuthUser) {
    const c = await this.certs.findOne({
      where: { id },
      relations: ['student', 'student.user', 'course', 'group', 'template'],
    });
    if (!c) throw new NotFoundException('Certificate not found');
    const branchFilter = effectiveBranchFilter(user);
    if (branchFilter && c.student?.branch_id !== branchFilter) throw new NotFoundException('Certificate not found');
    return c;
  }

  /** Public no-login verification (revoked or missing => valid:false). */
  async verify(code: string) {
    const c = await this.certs.findOne({
      where: { code: code.trim().toUpperCase() },
      relations: ['student', 'student.user', 'course'],
    });
    if (!c || c.status !== ('ACTIVE' as any)) {
      return { valid: false, code: code.toUpperCase() };
    }
    return {
      valid: true,
      code: c.code,
      student_name: c.student?.user ? `${c.student.user.first_name} ${c.student.user.last_name}` : null,
      course_name: c.course?.name ?? null,
      level: c.course?.level ?? null,
      issue_date: c.issue_date,
    };
  }

  // ---------- PDF ----------
  async generatePdf(id: string, user: AuthUser): Promise<Buffer> {
    const c: any = await this.getOne(id, user);
    const bg = resolveUploadPath(c.template?.background_url);
    const name = c.student?.user ? `${c.student.user.first_name} ${c.student.user.last_name}` : '';
    return buildPdf({
      landscape: true,
      backgroundPath: bg,
      texts: [
        { text: 'Speak Up English Academy', size: 26, y: 70 },
        { text: 'Certificate of Completion', size: 20, y: 130, color: '#333333' },
        { text: 'This certifies that', size: 13, y: 210, color: '#555555' },
        { text: name, size: 34, y: 245 },
        { text: `has successfully completed the course ${c.course?.name ?? ''} — Level ${c.course?.level ?? ''}`, size: 15, y: 320 },
        { text: `Issued on ${new Date(c.issue_date).toLocaleDateString('en-GB')}`, size: 13, y: 380 },
        { text: `Verification code: ${c.code}`, size: 12, y: 460, color: '#666666' },
      ],
    });
  }
}
