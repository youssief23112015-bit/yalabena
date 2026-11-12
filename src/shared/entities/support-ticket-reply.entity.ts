import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SupportTicket } from './support-ticket.entity';

@Entity('support_ticket_replies')
export class SupportTicketReply {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  ticket_id: string;

  @ManyToOne(() => SupportTicket, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticket_id' })
  ticket: SupportTicket;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'uuid', nullable: true })
  created_by: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  created_by_name: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
