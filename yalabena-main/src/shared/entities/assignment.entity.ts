import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Group } from './group.entity';
import { User } from './user.entity';
import { AssignmentType } from '../../common/enums/assignment-type.enum';
import { Submission } from './submission.entity';

@Entity('assignments')
export class Assignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  group_id: string;

  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: AssignmentType, default: AssignmentType.FILE_UPLOAD })
  type: AssignmentType;

  @Column({ type: 'timestamptz' })
  due_at: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 100 })
  max_grade: number;

  @Column({ type: 'boolean', default: false })
  allow_late_submission: boolean;

  @Column({ type: 'int', default: 0 })
  late_penalty_percent: number;

  @Column({ type: 'boolean', default: false })
  is_published: boolean;

  @Column({ type: 'uuid', nullable: true })
  created_by: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @OneToMany(() => Submission, (s) => s.assignment)
  submissions: Submission[];
}
