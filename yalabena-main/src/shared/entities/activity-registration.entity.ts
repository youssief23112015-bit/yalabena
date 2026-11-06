import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { RegistrationStatus } from '../../common/enums/registration-status.enum';
import { Activity } from './activity.entity';
import { Student } from './student.entity';

@Entity('activity_registrations')
@Unique(['activity_id', 'student_id'])
export class ActivityRegistration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  activity_id: string;

  @ManyToOne(() => Activity, (a) => a.registrations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'activity_id' })
  activity: Activity;

  @Index()
  @Column({ type: 'uuid' })
  student_id: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ type: 'enum', enum: RegistrationStatus, default: RegistrationStatus.REGISTERED })
  status: RegistrationStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  paid_amount: number;

  @Column({ type: 'uuid', nullable: true })
  payment_id: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  registered_at: Date;
}