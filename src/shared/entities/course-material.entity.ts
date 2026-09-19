import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Course } from './course.entity';
import { InventoryItem } from './inventory-item.entity';

@Entity('course_materials')
export class CourseMaterial {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  course_id: string;

  @ManyToOne(() => Course, (course) => course.materials, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Column({ type: 'uuid' })
  inventory_item_id: string;

  @ManyToOne(() => InventoryItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'inventory_item_id' })
  inventory_item: InventoryItem;

  @Column({ type: 'boolean', default: true })
  is_required: boolean;

  @Column({ type: 'int', default: 1 })
  quantity_per_student: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}