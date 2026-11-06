import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * SRS §6.6: "Display chat policy notice on first login... Consent checkbox
 * required before chat [access]." One row per user; presence of the row
 * (or a non-null accepted_at) means the user has consented.
 *
 * Kept as its own table rather than a column on User so this migration
 * doesn't touch the existing users table — safer to review/rollback on its
 * own, and keeps chat-specific concerns inside the chat module's schema.
 */
@Entity('chat_consents')
export class ChatConsent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'timestamptz' })
  accepted_at: Date;

  @Column({ type: 'varchar', length: 20, default: '1.0' })
  policy_version: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
