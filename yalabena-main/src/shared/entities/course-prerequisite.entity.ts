import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Course } from './course.entity';

@Entity('course_prerequisites')
export class CoursePrerequisite {
  @PrimaryColumn({ type: 'uuid' })
  course_id: string;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @PrimaryColumn({ type: 'uuid' })
  prerequisite_course_id: string;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'prerequisite_course_id' })
  prerequisite_course: Course;

  @Column({ type: 'boolean', default: true })
  is_strict: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
