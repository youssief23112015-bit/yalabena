import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { PayrollStatus } from '../../common/enums/payroll-status.enum';

@Entity('payroll_periods')
export class PayrollPeriod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'date' })
  start_date: Date;

  @Column({ type: 'date' })
  end_date: Date;

  @Column({ type: 'enum', enum: PayrollStatus, default: PayrollStatus.OPEN })
  status: PayrollStatus;

  @Column({ type: 'timestamptz', nullable: true })
  closed_at: Date;

  @Column({ type: 'uuid', nullable: true })
  closed_by: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'closed_by' })
  closer: User;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
