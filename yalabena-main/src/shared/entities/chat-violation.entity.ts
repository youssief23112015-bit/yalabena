import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ViolationAction } from '../../common/enums/violation-action.enum';
import { ChatMessage } from './chat-message.entity';
import { ChatRoom } from './chat-room.entity';
import { User } from './user.entity';

@Entity('chat_violations')
export class ChatViolation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

 @Column({ type: 'uuid', nullable: true })
message_id?: string;

@ManyToOne(() => ChatMessage, { onDelete: 'CASCADE', nullable: true })
@JoinColumn({ name: 'message_id' })
message?: ChatMessage;

  @Column({ type: 'uuid' })
  room_id: string;

  @ManyToOne(() => ChatRoom, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: ChatRoom;

  @Column({ type: 'uuid' })
  sender_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @Column({ type: 'varchar', length: 100 })
  rule_matched: string;

  @Column({ type: 'text' })
  original_message: string;

  @Column({ type: 'enum', enum: ViolationAction })
  action_taken: ViolationAction;

  @Column({ type: 'uuid', nullable: true })
  moderator_id: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'moderator_id' })
  moderator: User;

  @Column({ type: 'text', nullable: true })
  moderator_note: string;

  @Column({ type: 'timestamptz', nullable: true })
  resolved_at: Date;

  @Column({ type: 'boolean', default: false })
  is_false_positive: boolean;

  @Column({ type: 'varchar', length: 50, default: 'text_regex' })
  detection_method: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
