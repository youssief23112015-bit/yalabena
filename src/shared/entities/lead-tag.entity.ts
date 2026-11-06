import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { LeadTagPivot } from './lead-tag-pivot.entity';
import { OneToMany } from 'typeorm';

@Entity('lead_tags')
export class LeadTag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column({ type: 'varchar', length: 7, default: '#000000' })
  color: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @OneToMany(() => LeadTagPivot, (ltp) => ltp.tag)
  lead_pivots: LeadTagPivot[];
}
