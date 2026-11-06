import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Lead } from './lead.entity';
import { Student } from './student.entity';
import { TestSlot } from './test-slot.entity';
import { User } from './user.entity';
import { TestStatus } from '../../common/enums/test-status.enum';

@Entity('placement_tests')
export class PlacementTest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  lead_id: string;

  @ManyToOne(() => Lead, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'lead_id' })
  lead: Lead;

  @Column({ type: 'uuid', nullable: true })
  student_id: string;

  @ManyToOne(() => Student, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  /** Nullable: guest instant sessions (public onboarding) have no slot. */
  @Column({ type: 'uuid', nullable: true })
  slot_id: string | null;

  @ManyToOne(() => TestSlot, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'slot_id' })
  slot: TestSlot;

  /** Nullable: guest instant sessions have no assigned examiner. */
  @Column({ type: 'uuid', nullable: true })
  examiner_id: string | null;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'examiner_id' })
  examiner: User;

  @Column({ type: 'timestamptz' })
  scheduled_at: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  written_score: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 100 })
  written_max: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  oral_score: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 100 })
  oral_max: number;

  @Column({ type: 'varchar', length: 10, nullable: true })
  suggested_level: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  final_level: string;

  @Column({ type: 'text', nullable: true })
  override_reason: string;

  @Column({ type: 'text', nullable: true })
  examiner_notes: string;

  @Column({ type: 'enum', enum: TestStatus, default: TestStatus.SCHEDULED })
  status: TestStatus;

  @Column({ type: 'timestamptz', nullable: true })
  result_sent_at: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
