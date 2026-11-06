import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Student } from './student.entity';
import { Course } from './course.entity';
import { Group } from './group.entity';
import { CertificateTemplate } from './certificate-template.entity';
import { User } from './user.entity';
import { CertStatus } from '../../common/enums/cert-status.enum';

@Entity('certificates')
export class Certificate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  student_id: string;

  @ManyToOne(() => Student, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ type: 'uuid' })
  course_id: string;

  @ManyToOne(() => Course, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Column({ type: 'uuid' })
  group_id: string;

  @ManyToOne(() => Group, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @Column({ type: 'uuid', nullable: true })
  template_id: string;

  @ManyToOne(() => CertificateTemplate, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'template_id' })
  template: CertificateTemplate;

  @Column({ type: 'varchar', length: 100, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  pdf_url: string;

  @Column({ type: 'date' })
  issue_date: Date;

  @Column({ type: 'date', nullable: true })
  expiry_date: Date;

  @Column({ type: 'enum', enum: CertStatus, default: CertStatus.ACTIVE })
  status: CertStatus;

  @Column({ type: 'timestamptz', nullable: true })
  revoked_at: Date;

  @Column({ type: 'text', nullable: true })
  revoke_reason: string;

  @Column({ type: 'uuid', nullable: true })
  issued_by: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'issued_by' })
  issuer: User;

  @Column({ type: 'boolean', default: false })
  is_auto_issued: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
