import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Group } from './group.entity';
import { User } from './user.entity';
import { ReleaseType } from '../../common/enums/release-type.enum';
import { QuizQuestion } from './quiz-question.entity';

@Entity('quizzes')
export class Quiz {
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

  @Column({ type: 'int', nullable: true })
  time_limit_minutes: number;

  @Column({ type: 'int', default: 1 })
  max_attempts: number;

  @Column({ type: 'boolean', default: false })
  shuffle_questions: boolean;

  @Column({ type: 'boolean', default: false })
  shuffle_options: boolean;

  @Column({ type: 'enum', enum: ReleaseType, default: ReleaseType.INSTANT })
  release_type: ReleaseType;

  @Column({ type: 'timestamptz', nullable: true })
  release_at: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 60 })
  passing_score: number;

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

  @OneToMany(() => QuizQuestion, (qq) => qq.quiz)
  questions: QuizQuestion[];
}
