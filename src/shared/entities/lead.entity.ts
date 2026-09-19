import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Branch } from './branch.entity';
import { LeadStatus } from '../../common/enums/lead-status.enum';
import { LeadSource } from '../../common/enums/lead-source.enum';
import { LeadActivity } from './lead-activity.entity';
import { LeadTagPivot } from './lead-tag-pivot.entity';
import { FollowUp } from './follow-up.entity';

@Entity('leads')
export class Lead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  first_name: string;

  @Column({ type: 'varchar', length: 100 })
  last_name: string;

  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  national_id: string;

  @Column({ type: 'enum', enum: LeadSource })
  source: LeadSource;

  @Column({ type: 'enum', enum: LeadStatus, default: LeadStatus.NEW })
  status: LeadStatus;

  @Column({ type: 'varchar', length: 10, nullable: true })
  level_interest: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'uuid', nullable: true })
  assigned_to: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'assigned_to' })
  assigned_agent: User;

  @Column({ type: 'uuid', nullable: true })
  branch_id: string;

  @ManyToOne(() => Branch, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ type: 'uuid', nullable: true })
  converted_to_student_id: string;

  @Column({ type: 'timestamptz', nullable: true })
  converted_at: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @OneToMany(() => LeadActivity, (la) => la.lead)
  activities: LeadActivity[];

  @OneToMany(() => FollowUp, (fu) => fu.lead)
  follow_ups: FollowUp[];

  @OneToMany(() => LeadTagPivot, (ltp) => ltp.lead)
  tag_pivots: LeadTagPivot[];
}
