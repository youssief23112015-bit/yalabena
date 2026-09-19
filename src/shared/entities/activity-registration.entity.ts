import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Activity } from './activity.entity';
import { Student } from './student.entity';
import { RegistrationStatus } from '../../common/enums/registration-status.enum';

@Entity('activity_registrations')
@Unique(['activity_id', 'student_id'])
export class ActivityRegistration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  activity_id: string;

  @ManyToOne(() => Activity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'activity_id' })
  activity: Activity;

  @Column({ type: 'uuid' })
  student_id: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @CreateDateColumn({ type: 'timestamptz' })
  registered_at: Date;

  @Column({ type: 'enum', enum: RegistrationStatus, default: RegistrationStatus.REGISTERED })
  status: RegistrationStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  paid_amount: number;

  @Column({ type: 'uuid', nullable: true })
  payment_id: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
