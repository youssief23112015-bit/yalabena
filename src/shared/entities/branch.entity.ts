import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Classroom } from './classroom.entity';
import { InventoryItem } from './inventory-item.entity'; // تأكد إن مسار الاستيراد مظبوط حسب مكان الملف
import { UserStatus } from '../../common/enums/user-status.enum';

@Entity('branches')
export class Branch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'text' })
  address: string;

  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'uuid', nullable: true })
  manager_id: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'manager_id' })
  manager: User;

  @Column({ type: 'int', default: 0 })
  classroom_count: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  logo_url: string;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @OneToMany(() => Classroom, (c) => c.branch)
  classrooms: Classroom[];

  // أضفنا العلاقة دي هنا عشان الـ Inventory تتصل بالـ Branch صح بدون أخطاء
  @OneToMany(() => InventoryItem, (item) => item.branch)
  inventoryItems: InventoryItem[];
}