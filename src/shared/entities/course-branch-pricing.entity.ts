import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Course } from './course.entity';
import { Branch } from './branch.entity';

/**
 * Per-branch price override for a course (multi-branch academies charge
 * differently per location). Missing price falls back to Course.default_price.
 */
@Entity('course_branch_pricing')
@Unique(['course_id', 'branch_id'])
export class CourseBranchPricing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  course_id: string;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Column({ type: 'uuid' })
  branch_id: string;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
