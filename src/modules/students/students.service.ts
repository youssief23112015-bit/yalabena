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

  async findAll(filters: {
    search?: string;
    branchId?: string;
    status?: string;
  }): Promise<Student[]> {
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
      );

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