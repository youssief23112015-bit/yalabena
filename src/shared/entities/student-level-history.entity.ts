import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Student } from './student.entity';
import { User } from './user.entity';

@Entity('student_level_history')
export class StudentLevelHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  student_id: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ type: 'varchar', length: 10 })
  old_level: string;

  @Column({ type: 'varchar', length: 10 })
  new_level: string;

  @Column({ type: 'varchar', length: 50 })
  reason: string;

  @Column({ type: 'uuid', nullable: true })
  reference_id: string;

  @Column({ type: 'uuid', nullable: true })
  changed_by: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'changed_by' })
  changer: User;

  @CreateDateColumn({ type: 'timestamptz' })
  changed_at: Date;
}
