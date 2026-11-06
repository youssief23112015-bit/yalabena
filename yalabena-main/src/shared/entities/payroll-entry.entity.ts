import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { PayrollPeriod } from './payroll-period.entity';
import { Employee } from './employee.entity';
import { PayrollEntryStatus } from '../../common/enums/payroll-entry-status.enum';

@Entity('payroll_entries')
@Unique(['payroll_period_id', 'employee_id'])
export class PayrollEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  payroll_period_id: string;

  @ManyToOne(() => PayrollPeriod, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'payroll_period_id' })
  payroll_period: PayrollPeriod;

  @Column({ type: 'uuid' })
  employee_id: string;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  base_amount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  hours_worked: number;

  @Column({ type: 'int', default: 0 })
  classes_taught: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  bonus: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  deductions: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  hourly_rate: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total_amount: number;

  @Column({ type: 'enum', enum: PayrollEntryStatus, default: PayrollEntryStatus.DRAFT })
  status: PayrollEntryStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
