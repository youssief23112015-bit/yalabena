import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Student } from './student.entity';
import { Group } from './group.entity';
import { User } from './user.entity';
import { EnrollmentStatus } from '../../common/enums/enrollment-status.enum';

@Entity('enrollments')
export class Enrollment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  student_id: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ type: 'uuid' })
  group_id: string;

  @ManyToOne(() => Group, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @Column({ type: 'enum', enum: EnrollmentStatus, default: EnrollmentStatus.PENDING })
  status: EnrollmentStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total_fee: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  discount_amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  final_amount: number;

  @Column({ type: 'uuid', nullable: true })
  promo_code_id: string;

  @CreateDateColumn({ type: 'timestamptz' })
  enrolled_at: Date;

  @Column({ type: 'uuid', nullable: true })
  enrolled_by: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'enrolled_by' })
  enrolled_by_user: User;

  @Column({ type: 'timestamptz', nullable: true })
  dropped_at: Date;

  @Column({ type: 'text', nullable: true })
  drop_reason: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
