import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { QuizQuestion } from './quiz-question.entity';

@Entity('quiz_options')
export class QuizOption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  quiz_question_id: string;

  @ManyToOne(() => QuizQuestion, (q) => q.quizOptions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quiz_question_id' })
  question: QuizQuestion;

  @Column({ type: 'text' })
  option_text: string;

  @Column({ type: 'boolean', default: false })
  is_correct: boolean;

  @Column({ type: 'int', name: 'order', default: 0 })
  order: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
