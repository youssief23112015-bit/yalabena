import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { User } from './user.entity';

@Entity('sales_targets')
@Unique(['agent_id', 'month', 'year'])
export class SalesTarget {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  agent_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agent_id' })
  agent: User;

  @Column({ type: 'int' })
  month: number;

  @Column({ type: 'int' })
  year: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  target_amount: number;

  @Column({ type: 'int', default: 0 })
  target_conversions: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  achieved_amount: number;

  @Column({ type: 'int', default: 0 })
  achieved_conversions: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
