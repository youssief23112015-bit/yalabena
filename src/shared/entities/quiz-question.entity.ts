import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Quiz } from './quiz.entity';
import { TestQuestion } from './test-question.entity';
import { QuestionType } from '../../common/enums/question-type.enum';

@Entity('quiz_questions')
export class QuizQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  quiz_id: string;

  @ManyToOne(() => Quiz, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quiz_id' })
  quiz: Quiz;

  @Column({ type: 'uuid', nullable: true })
  bank_question_id: string;

  @ManyToOne(() => TestQuestion, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'bank_question_id' })
  bank_question: TestQuestion;

  @Column({ type: 'text' })
  question_text: string;

  @Column({ type: 'enum', enum: QuestionType })
  type: QuestionType;

  @Column({ type: 'jsonb', nullable: true })
  options: any;

  @Column({ type: 'jsonb' })
  correct_answer: any;

  @Column({ type: 'int', default: 1 })
  points: number;

  @Column({ type: 'int', name: 'order' })
  order: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  media_url: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
