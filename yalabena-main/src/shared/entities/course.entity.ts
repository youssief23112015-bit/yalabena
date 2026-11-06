import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { CourseStatus } from '../../common/enums/course-status.enum';
import { Group } from './group.entity';
import { CourseMaterial } from './course-material.entity';
import { CoursePrerequisite } from './course-prerequisite.entity';

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 50, unique: true, nullable: true })
  code: string;

  @Column({ type: 'varchar', length: 10 })
  level: string;

  @Column({ type: 'int' })
  duration_hours: number;

  @Column({ type: 'text', nullable: true })
  syllabus: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  default_price: number;

  @Column({ type: 'int', nullable: true })
  min_age: number;

  @Column({ type: 'int', nullable: true })
  max_age: number;

  @Column({ type: 'enum', enum: CourseStatus, default: CourseStatus.ACTIVE })
  status: CourseStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @OneToMany(() => Group, (g) => g.course)
  groups: Group[];

  @OneToMany(() => CourseMaterial, (cm) => cm.course)
  materials: CourseMaterial[];

  @OneToMany(() => CoursePrerequisite, (cp) => cp.course)
  prerequisites: CoursePrerequisite[];
}
