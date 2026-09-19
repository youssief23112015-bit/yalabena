import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Lead } from './lead.entity';
import { User } from './user.entity';
import { FollowUpStatus } from '../../common/enums/follow-up-status.enum';

@Entity('follow_ups')
export class FollowUp {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  lead_id: string;

  @ManyToOne(() => Lead, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lead_id' })
  lead: Lead;

  @Column({ type: 'uuid' })
  assigned_to: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assigned_to' })
  assigned_agent: User;

  @Column({ type: 'timestamptz' })
  due_date: Date;

  @Column({ type: 'enum', enum: FollowUpStatus, default: FollowUpStatus.PENDING })
  status: FollowUpStatus;

  @Column({ type: 'text', nullable: true })
  note: string;

  @Column({ type: 'timestamptz', nullable: true })
  completed_at: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
