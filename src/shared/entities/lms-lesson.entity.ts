import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { LmsModule } from './lms-module.entity';
import { LessonType } from '../../common/enums/lesson-type.enum';
import { LmsResource } from './lms-resource.entity';

@Entity('lms_lessons')
export class LmsLesson {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  module_id: string;

  @ManyToOne(() => LmsModule, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'module_id' })
  module: LmsModule;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ type: 'enum', enum: LessonType, default: LessonType.CONTENT })
  type: LessonType;

  @Column({ type: 'int', nullable: true })
  duration_minutes: number;

  @Column({ type: 'int', name: 'order' })
  order: number;

  @Column({ type: 'boolean', default: false })
  is_published: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @OneToMany(() => LmsResource, (lr) => lr.lesson)
  resources: LmsResource[];
}
