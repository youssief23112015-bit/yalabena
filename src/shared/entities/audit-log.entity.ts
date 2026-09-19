import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { ActorType } from '../../common/enums/actor-type.enum';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  actor_id: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'actor_id' })
  actor: User;

  @Column({ type: 'enum', enum: ActorType, default: ActorType.USER })
  actor_type: ActorType;

  @Column({ type: 'varchar', length: 100 })
  action: string;

  @Column({ type: 'varchar', length: 50 })
  module: string;

  @Column({ type: 'varchar', length: 50 })
  target_type: string;

  @Column({ type: 'uuid' })
  target_id: string;

  @Column({ type: 'jsonb', nullable: true })
  before_state: any;

  @Column({ type: 'jsonb', nullable: true })
  after_state: any;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ip_address: string;

  @Column({ type: 'text', nullable: true })
  user_agent: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  session_id: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
