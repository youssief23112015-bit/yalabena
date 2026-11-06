import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { ChatMessageType } from '../../common/enums/chat-message-type.enum';
import { ChatRoom } from './chat-room.entity';
import { User } from './user.entity';

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @Column({ type: 'text', nullable: true })
  body: string;

  @Column({ type: 'enum', enum: ChatMessageType, default: ChatMessageType.TEXT })
  type: ChatMessageType;

  @Column({ type: 'varchar', length: 500, nullable: true })
  file_url: string;

  @Column({ type: 'bigint', nullable: true })
  file_size: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  file_name: string;

  @Column({ type: 'uuid', nullable: true })
  reply_to_id: string;

  @ManyToOne(() => ChatMessage, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'reply_to_id' })
  reply_to: ChatMessage;

  @OneToMany(() => ChatMessage, (cm) => cm.reply_to)
  replies: ChatMessage[];

  @Column({ type: 'timestamptz', nullable: true })
  edited_at: Date;

  @Column({ type: 'int', default: 0 })
  edited_count: number;

  @Column({ type: 'timestamptz', nullable: true })
  deleted_at: Date;

  @Column({ type: 'boolean', default: false })
  is_flagged: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  flag_reason: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
