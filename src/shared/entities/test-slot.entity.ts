import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Branch } from './branch.entity';
import { User } from './user.entity';
import { SlotStatus } from '../../common/enums/slot-status.enum';
import { GroupMode } from '../../common/enums/group-mode.enum';

@Entity('test_slots')
export class TestSlot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  branch_id: string;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ type: 'uuid' })
  examiner_id: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'examiner_id' })
  examiner: User;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'time' })
  start_time: string;

  @Column({ type: 'time' })
  end_time: string;

  @Column({ type: 'enum', enum: GroupMode, default: GroupMode.IN_PERSON })
  mode: GroupMode;

  @Column({ type: 'int', default: 1 })
  capacity: number;

  @Column({ type: 'int', default: 0 })
  booked_count: number;

  @Column({ type: 'enum', enum: SlotStatus, default: SlotStatus.OPEN })
  status: SlotStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
