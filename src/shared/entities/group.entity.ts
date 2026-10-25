import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Course } from './course.entity';
import { User } from './user.entity';
import { Branch } from './branch.entity';
import { GroupMode } from '../../common/enums/group-mode.enum';
import { GroupStatus } from '../../common/enums/group-status.enum';
import { GroupSchedule } from './group-schedule.entity';
import { GroupStudent } from './group-student.entity';
import { Session } from './session.entity';
import { ChatRoom } from './chat-room.entity';

@Entity('groups')
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'uuid' })
  course_id: string;

  @ManyToOne(() => Course, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Column({ type: 'uuid' })
  teacher_id: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'teacher_id' })
  teacher: User;

  @Column({ type: 'uuid', nullable: true })
  substitute_teacher_id: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'substitute_teacher_id' })
  substitute_teacher: User;

  @Column({ type: 'uuid' })
  branch_id: string;

  @ManyToOne(() => Branch, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ type: 'int' })
  capacity: number;

  @Column({ type: 'enum', enum: GroupMode, default: GroupMode.IN_PERSON })
  mode: GroupMode;

  @Column({ type: 'varchar', length: 100, nullable: true })
  zoom_meeting_id: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  zoom_link: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  onmeet_link: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  onmeet_meeting_id: string;

  @Column({ type: 'date' })
  start_date: Date;

  @Column({ type: 'date' })
  end_date: Date;

  @Column({ type: 'enum', enum: GroupStatus, default: GroupStatus.UPCOMING })
  status: GroupStatus;

  @Column({ type: 'uuid', nullable: true })
  created_by: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @OneToMany(() => GroupSchedule, (gs) => gs.group)
  schedules: GroupSchedule[];

  @OneToMany(() => GroupStudent, (gs) => gs.group)
  group_students: GroupStudent[];

  @OneToMany(() => Session, (s) => s.group)
  sessions: Session[];

  @OneToMany(() => ChatRoom, (cr) => cr.group)
  chat_rooms: ChatRoom[];
}
