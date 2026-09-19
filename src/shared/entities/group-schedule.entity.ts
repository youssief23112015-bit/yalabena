import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Group } from './group.entity';
import { Classroom } from './classroom.entity';

@Entity('group_schedules')
export class GroupSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  group_id: string;

  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @Column({ type: 'int' })
  day_of_week: number;

  @Column({ type: 'time' })
  start_time: string;

  @Column({ type: 'time' })
  end_time: string;

  @Column({ type: 'uuid', nullable: true })
  classroom_id: string;

  @ManyToOne(() => Classroom, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'classroom_id' })
  classroom: Classroom;

  @Column({ type: 'boolean', default: true })
  is_recurring: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
