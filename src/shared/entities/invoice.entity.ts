import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Enrollment } from './enrollment.entity';
import { Student } from './student.entity';
import { Branch } from './branch.entity';
import { User } from './user.entity';
import { InvoiceStatus } from '../../common/enums/invoice-status.enum';
import { Payment } from './payment.entity';
import { Installment } from './installment.entity';
import { InvoiceItem } from './invoice-item.entity';

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  invoice_number: string;

  @Column({ type: 'uuid' })
  enrollment_id: string;

  @ManyToOne(() => Enrollment, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'enrollment_id' })
  enrollment: Enrollment;

  @Column({ type: 'uuid' })
  student_id: string;

  @ManyToOne(() => Student, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ type: 'uuid' })
  branch_id: string;

  @ManyToOne(() => Branch, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  discount_amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  tax_amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total_amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  paid_amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  balance_due: number;

  @Column({ type: 'enum', enum: InvoiceStatus, default: InvoiceStatus.UNPAID })
  status: InvoiceStatus;

  @Column({ type: 'date' })
  due_date: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'boolean', default: false })
  is_e_invoice: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  e_invoice_reference: string;

  @Column({ type: 'uuid', nullable: true })
  created_by: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @OneToMany(() => Payment, (p) => p.invoice)
  payments: Payment[];

  @OneToMany(() => Installment, (i) => i.invoice)
  installments: Installment[];

  @OneToMany(() => InvoiceItem, (ii) => ii.invoice)
  items: InvoiceItem[];
}
