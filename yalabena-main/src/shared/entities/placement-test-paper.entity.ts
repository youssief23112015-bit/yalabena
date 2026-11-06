import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { PlacementTest } from './placement-test.entity';

/**
 * The frozen written paper for one placement test: which questions, in which
 * order. Question content is read from the bank; only the selection is stored.
 */
@Entity('placement_test_papers')
@Unique('uq_ptp_test', ['test_id'])
export class PlacementTestPaper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  test_id: string;

  @ManyToOne(() => PlacementTest, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'test_id' })
  test: PlacementTest;

  @Column({ type: 'varchar', length: 10 })
  level: string;

  /** Ordered question ids exactly as shown to the candidate. */
  @Column({ type: 'jsonb' })
  question_ids: string[];

  @CreateDateColumn({ type: 'timestamptz' })
  generated_at: Date;
}