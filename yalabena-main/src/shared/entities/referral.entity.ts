import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Student } from './student.entity';
import { Lead } from './lead.entity';

@Entity('referrals')
export class Referral {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  referrer_student_id: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'referrer_student_id' })
  referrer_student: Student;

  @Column({ type: 'uuid', nullable: true })
  referred_lead_id: string;

  @ManyToOne(() => Lead, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'referred_lead_id' })
  referred_lead: Lead;

  @Column({ type: 'uuid', nullable: true })
  referred_student_id: string;

  @ManyToOne(() => Student, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'referred_student_id' })
  referred_student: Student;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  credit_amount: number;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
