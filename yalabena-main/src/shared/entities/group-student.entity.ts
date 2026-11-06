import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Group } from './group.entity';
import { Student } from './student.entity';
import { User } from './user.entity';

@Entity('group_students')
@Unique(['group_id', 'student_id'])
export class GroupStudent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  group_id: string;

  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @Column({ type: 'uuid' })
  student_id: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @CreateDateColumn({ type: 'timestamptz' })
  enrolled_at: Date;

  @Column({ type: 'uuid', nullable: true })
  enrolled_by: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'enrolled_by' })
  enrolled_by_user: User;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: string;

  @Column({ type: 'timestamptz', nullable: true })
  dropped_at: Date;

  @Column({ type: 'text', nullable: true })
  drop_reason: string;
}
