import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Student } from './student.entity';
import { TestimonialStatus } from '../../common/enums/testimonial-status.enum';

@Entity('testimonials')
export class Testimonial {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  student_id: string;

  @ManyToOne(() => Student, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  photo_url: string;

  @Column({ type: 'int', default: 5 })
  rating: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  course_name: string;

  @Column({ type: 'boolean', default: false })
  is_featured: boolean;

  @Column({ type: 'enum', enum: TestimonialStatus, default: TestimonialStatus.PENDING })
  status: TestimonialStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
