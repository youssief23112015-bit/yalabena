import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Student } from '../../shared/entities/student.entity';
import { Payment } from '../../shared/entities/payment.entity';

import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private readonly repo: Repository<Student>,

    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
  ) {}

  async create(
    createStudentDto: CreateStudentDto,
  ): Promise<Student> {
    const student = this.repo.create(createStudentDto);
    return this.repo.save(student);
  }

  /**
   * Backfill safety net (Task 2): users who hold the student role but have
   * no `students`-table row — historical data written before role-assignment
   * sync existed — are materialised here so they appear in /students and the
   * /enrollments picker. Single INSERT..SELECT; ON CONFLICT protects against
   * the UNIQUE(user_id) race, and the 'trg_students_number' trigger fills
   * student_number. No-ops instantly when there are no orphans.
   */
  async syncMissingStudentProfiles(): Promise<number> {
    const result = await this.repo.query(
      `INSERT INTO students (user_id, branch_id, enrollment_date, status)
       SELECT u.id, u.branch_id, CURRENT_DATE, 'active'
       FROM users u
       INNER JOIN user_roles ur ON ur.user_id = u.id
       INNER JOIN roles r ON r.id = ur.role_id AND r.slug = 'student'
       WHERE u.status = 'active'
         AND NOT EXISTS (SELECT 1 FROM students s WHERE s.user_id = u.id)
       ON CONFLICT (user_id) DO NOTHING`,
    );
    return result?.rowCount ?? 0;
  }

  async findAll(filters: {
    search?: string;
    branchId?: string;
    status?: string;
  }): Promise<Student[]> {
    // Heal any role/user drift before listing so every student-role holder
    // is guaranteed a row (registration and role assignment already sync;
    // this only ever touches legacy orphans).
    await this.syncMissingStudentProfiles();

    const query = this.repo
      .createQueryBuilder('student')
      .leftJoinAndSelect(
        'student.branch',
        'branch',
      )
      .leftJoinAndSelect(
        'student.user',
        'user',
      )
      .leftJoinAndSelect(
        'student.profile',
        'profile',
      )
      // Option B safety net (on top of the role-change soft-deactivate):
      // only surface students whose linked user STILL holds the student
      // role and whose account is still active. This hides any legacy or
      // drifted row regardless of its students.status value, and is what
      // keeps /students and the /enrollments picker in sync with
      // user_roles at read time.
      .andWhere('user.status = :activeUserStatus', {
        activeUserStatus: 'active',
      })
      .andWhere((qb) => {
        const sub = qb
          .subQuery()
          .select('1')
          .from('user_roles', 'ur')
          .innerJoin('roles', 'r', "r.id = ur.role_id AND r.slug = 'student'")
          .where('ur.user_id = student.user_id')
          .getQuery();
        return `EXISTS ${sub}`;
      });

    if (filters.search) {
      query.andWhere(
        '(user.first_name ILIKE :search OR ' +
          'user.last_name ILIKE :search OR ' +
          'user.email ILIKE :search OR ' +
          'student.student_number ILIKE :search)',
        {
          search: `%${filters.search}%`,
        },
      );
    }

    if (filters.branchId) {
      query.andWhere(
        'branch.id = :branchId',
        {
          branchId: filters.branchId,
        },
      );
    }

    if (filters.status) {
      query.andWhere(
        'student.status = :status',
        {
          status: filters.status,
        },
      );
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Student> {
    const student = await this.repo.findOne({
      where: { id },
      relations: [
        'user',
        'branch',
        'profile',
        'level_history',
      ],
    });

    if (!student) {
      throw new NotFoundException(
        `Student with ID ${id} not found`,
      );
    }

    return student;
  }

  async update(
    id: string,
    updateStudentDto: UpdateStudentDto,
  ): Promise<Student> {
    const student = await this.findOne(id);

    Object.assign(
      student,
      updateStudentDto,
    );

    return this.repo.save(student);
  }

  async remove(id: string): Promise<void> {
    const student = await this.findOne(id);
    await this.repo.remove(student);
  }

  // -------------------------------------------------------
  // Sub-resources
  // -------------------------------------------------------

  async getGroups(id: string) {
    const student = await this.repo.findOne({
      where: { id },
      relations: [
        'groups',
        'groups.course',
        'groups.branch',
      ],
    });

    return student?.groups ?? [];
  }

  async getAttendance(id: string) {
    const student = await this.repo.findOne({
      where: { id },
      relations: ['attendances'],
    });

    return student?.attendances ?? [];
  }

  async getCertificates(id: string) {
    const student = await this.repo.findOne({
      where: { id },
      relations: ['certificates'],
    });

    return student?.certificates ?? [];
  }

  /**
   * Payments are related to students through invoices:
   *
   * Student
   *   ↓
   * Invoice.student_id
   *   ↓
   * Payment.invoice_id
   */
  async getPayments(id: string) {
    const student = await this.repo.findOne({
      where: { id },
    });

    if (!student) {
      throw new NotFoundException(
        `Student with ID ${id} not found`,
      );
    }

    return this.paymentRepo
      .createQueryBuilder('payment')
      .leftJoinAndSelect(
        'payment.invoice',
        'invoice',
      )
      .leftJoinAndSelect(
        'payment.recorder',
        'recorder',
      )
      .where(
        'invoice.student_id = :studentId',
        {
          studentId: id,
        },
      )
      .orderBy(
        'payment.paid_at',
        'DESC',
      )
      .getMany();
  }

  async getLevelHistory(id: string) {
    const student = await this.repo.findOne({
      where: { id },
      relations: ['level_history'],
    });

    return student?.level_history ?? [];
  }
}