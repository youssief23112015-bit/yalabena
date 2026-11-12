import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { SupportTicketReply } from './support-ticket-reply.entity';
import { SupportTicketStatus } from '../../common/enums/support-ticket-status.enum';
import { SupportTicketPriority } from '../../common/enums/support-ticket-priority.enum';

@Entity('support_tickets')
export class SupportTicket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 255 })
  subject: string;

  @Column({ type: 'varchar', length: 100 })
  category: string;

  @Column({ type: 'text' })
  message: string;

  @Column({
    type: 'enum',
    enum: SupportTicketPriority,
    default: SupportTicketPriority.MEDIUM,
  })
  priority: SupportTicketPriority;

  @Column({
    type: 'enum',
    enum: SupportTicketStatus,
    default: SupportTicketStatus.OPEN,
  })
  status: SupportTicketStatus;

  /** Snapshot of the submitter's details taken at ticket creation time. */
  @Column({ type: 'varchar', length: 255, nullable: true })
  user_name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  user_email: string;

  /** Staff member currently assigned to resolve this ticket. */
  @Column({ type: 'uuid', nullable: true })
  assigned_to: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'assigned_to' })
  assignee: User;

  @Column({ type: 'text', nullable: true })
  admin_reply: string;

  @Column({ type: 'uuid', nullable: true })
  replied_by: string;

  @Column({ type: 'timestamptz', nullable: true })
  replied_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  resolved_at: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @OneToMany(() => SupportTicketReply, (reply) => reply.ticket)
  replies: SupportTicketReply[];
}
