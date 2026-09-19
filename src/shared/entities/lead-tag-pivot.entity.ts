import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Lead } from './lead.entity';
import { LeadTag } from './lead-tag.entity';

@Entity('lead_tag_pivot')
export class LeadTagPivot {
  @PrimaryColumn({ type: 'uuid' })
  lead_id: string;

  @ManyToOne(() => Lead, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lead_id' })
  lead: Lead;

  @PrimaryColumn({ type: 'uuid' })
  tag_id: string;

  @ManyToOne(() => LeadTag, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tag_id' })
  tag: LeadTag;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  created_at: Date;
}
