import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Group } from './group.entity';
import { Student } from './student.entity';
import { User } from './user.entity';

@Entity('student_surveys')
export class StudentSurvey {
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

  @Column({ type: 'uuid' })
  teacher_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teacher_id' })
  teacher: User;

  @Column({ type: 'varchar', length: 50 })
  term: string;

  @Column({ type: 'jsonb' })
  responses: any;

  @Column({ type: 'int', nullable: true })
  overall_rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ type: 'boolean', default: true })
  is_anonymous: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
