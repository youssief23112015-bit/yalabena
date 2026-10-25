import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Branch } from './branch.entity';
import { Invoice } from './invoice.entity';
import { Payment } from './payment.entity';
import { Refund } from './refund.entity';
import { User } from './user.entity';
import { FinancialTransactionType } from '../../common/enums/financial-transaction-type.enum';
import { TransactionDirection } from '../../common/enums/transaction-direction.enum';

@Entity('financial_transactions')
export class FinancialTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  branch_id: string;

  @ManyToOne(() => Branch, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ type: 'uuid', nullable: true })
  invoice_id: string;

  @ManyToOne(() => Invoice, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;

  @Column({ type: 'uuid', nullable: true })
  payment_id: string;

  @ManyToOne(() => Payment, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'payment_id' })
  payment: Payment;

  @Column({ type: 'uuid', nullable: true })
  refund_id: string;

  @ManyToOne(() => Refund, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'refund_id' })
  refund: Refund;

  @Column({ type: 'enum', enum: FinancialTransactionType })
  transaction_type: FinancialTransactionType;

  @Column({ type: 'enum', enum: TransactionDirection })
  direction: TransactionDirection;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  transaction_date: Date;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'uuid', nullable: true })
  created_by: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
