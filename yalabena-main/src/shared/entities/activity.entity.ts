import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ActivityEventType } from '../../common/enums/activity-event-type.enum';
import { ActivityStatus } from '../../common/enums/activity-status.enum';
import { Branch } from './branch.entity';
import { ActivityRegistration } from './activity-registration.entity';
import { ActivityPhoto } from './activity-photo.entity';

@Entity('activities')
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

@Column({ name: 'name', type: 'varchar', length: 200 })
  title: string;
  
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: ActivityEventType })
  type: ActivityEventType;

  @Index()
  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'varchar', length: 5, nullable: true })
  start_time: string | null;

  @Column({ type: 'varchar', length: 5, nullable: true })
  end_time: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string | null;

  @Index()
  @Column({ type: 'uuid' })
  branch_id: string;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ type: 'int' })
  capacity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  fee: number;

  @Column({ type: 'jsonb', nullable: true })
  target_levels: string[] | null;

  @Column({ type: 'jsonb', nullable: true })
  target_groups: string[] | null;

  @Column({ type: 'boolean', default: false })
  is_open_to_all: boolean;

  @Column({ type: 'enum', enum: ActivityStatus, default: ActivityStatus.UPCOMING })
  status: ActivityStatus;

  @Column({ type: 'uuid', nullable: true })
  created_by: string | null;

  @OneToMany(() => ActivityRegistration, (r) => r.activity, { cascade: true })
  registrations: ActivityRegistration[];

  @OneToMany(() => ActivityPhoto, (p) => p.activity, { cascade: true })
  photos: ActivityPhoto[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
