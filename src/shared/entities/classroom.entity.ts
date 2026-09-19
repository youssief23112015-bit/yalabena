import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Branch } from './branch.entity';
import { UserStatus } from '../../common/enums/user-status.enum';

@Entity('classrooms')
export class Classroom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  branch_id: string;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'int', default: 20 })
  capacity: number;

  @Column({ type: 'varchar', length: 20, default: 'standard' })
  type: string;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
