import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Session } from './session.entity';
import { Student } from './student.entity';
import { User } from './user.entity';
import { AttendanceStatus } from '../../common/enums/attendance-status.enum';
import { CheckInMethod } from '../../common/enums/check-in-method.enum';

@Entity('attendances')
@Unique(['session_id', 'student_id'])
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  session_id: string;

  @ManyToOne(() => Session, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session: Session;

  @Column({ type: 'uuid' })
  student_id: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ type: 'enum', enum: AttendanceStatus })
  status: AttendanceStatus;

  @Column({ type: 'enum', enum: CheckInMethod, default: CheckInMethod.MANUAL })
  check_in_method: CheckInMethod;

  @Column({ type: 'timestamptz', nullable: true })
  check_in_time: Date;

  @Column({ type: 'int', default: 0 })
  minutes_late: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'uuid', nullable: true })
  created_by: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
