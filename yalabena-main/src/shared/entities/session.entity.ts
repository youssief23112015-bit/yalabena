import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Group } from './group.entity';
import { Classroom } from './classroom.entity';
import { GroupMode } from '../../common/enums/group-mode.enum';

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  group_id: string;

  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'time' })
  start_time: string;

  @Column({ type: 'time' })
  end_time: string;

  @Column({ type: 'uuid', nullable: true })
  classroom_id: string;

  @ManyToOne(() => Classroom, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'classroom_id' })
  classroom: Classroom;

  @Column({ type: 'enum', enum: GroupMode })
  mode: GroupMode;

  @Column({ type: 'varchar', length: 100, nullable: true })
  zoom_meeting_id: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  zoom_join_url: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  onmeet_meeting_id: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  recording_url: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  topic: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'boolean', default: false })
  attendance_locked: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  cancelled_at: Date;

  @Column({ type: 'text', nullable: true })
  cancellation_reason: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
