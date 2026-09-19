import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { PlacementTest } from './placement-test.entity';
import { TestQuestion } from './test-question.entity';

@Entity('placement_test_answers')
@Unique(['test_id', 'question_id'])
export class PlacementTestAnswer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  test_id: string;

  @ManyToOne(() => PlacementTest, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'test_id' })
  test: PlacementTest;

  @Column({ type: 'uuid' })
  question_id: string;

  @ManyToOne(() => TestQuestion, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'question_id' })
  question: TestQuestion;

  @Column({ type: 'jsonb' })
  answer: any;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  score: number;

  @Column({ type: 'boolean', nullable: true })
  is_correct: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
