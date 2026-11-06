import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ChatRoom } from './chat-room.entity';
import { User } from './user.entity';

@Entity('chat_room_members')
export class ChatRoomMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  room_id: string;

  @ManyToOne(() => ChatRoom, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: ChatRoom;

  @Column({ type: 'uuid' })
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 20, default: 'member' })
  role: string;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  joined_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  last_read_at: Date;

  @Column({ type: 'boolean', default: false })
  is_muted: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  muted_until: Date;

  @Column({ type: 'boolean', default: false })
  is_banned: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  banned_until: Date;

  @Column({ type: 'text', nullable: true })
  ban_reason: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
