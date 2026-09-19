import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { LmsLesson } from './lms-lesson.entity';
import { ResourceType } from '../../common/enums/resource-type.enum';
import { ResourceAccess } from '../../common/enums/resource-access.enum';

@Entity('lms_resources')
export class LmsResource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  lesson_id: string;

  @ManyToOne(() => LmsLesson, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lesson_id' })
  lesson: LmsLesson;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'enum', enum: ResourceType })
  type: ResourceType;

  @Column({ type: 'varchar', length: 500, nullable: true })
  file_url: string;

  @Column({ type: 'bigint', nullable: true })
  file_size: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  mime_type: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  external_url: string;

  @Column({ type: 'enum', enum: ResourceAccess, default: ResourceAccess.ENROLLED })
  access_control: ResourceAccess;

  @Column({ type: 'int', default: 0 })
  download_count: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  watermark_text: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
