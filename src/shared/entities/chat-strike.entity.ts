import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { StrikeAction } from '../../common/enums/strike-action.enum';
import { User } from './user.entity';
import { ChatViolation } from './chat-violation.entity';

@Entity('chat_strikes')
export class ChatStrike {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid' })
  violation_id: string;

  @ManyToOne(() => ChatViolation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'violation_id' })
  violation: ChatViolation;

  @Column({ type: 'int' })
  strike_number: number;

  @Column({ type: 'enum', enum: StrikeAction })
  action: StrikeAction;

  @Column({ type: 'timestamptz', nullable: true })
  expires_at: Date;

  @Column({ type: 'uuid', nullable: true })
  applied_by: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'applied_by' })
  applied_by_user: User;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  applied_at: Date;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;
}
