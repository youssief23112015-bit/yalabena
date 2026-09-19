import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { InventoryCategory } from '../../common/enums/inventory-category.enum';
import { InventoryStatus } from '../../common/enums/inventory-status.enum';
import { Branch } from './branch.entity'; // تأكد من مسار الـ Branch entity عندك

@Entity('inventory_items')
export class InventoryItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true, nullable: true })
  sku: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: InventoryCategory })
  category: InventoryCategory;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  unit_cost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  unit_price: number; // أو sale_price حسب اللي شغال عندك

  @Column({ type: 'varchar', length: 20, default: 'piece' })
  unit_of_measure: string;

  @Column({ type: 'int', default: 10 })
  reorder_level: number;

  @Column({ type: 'uuid', name: 'branch_id' })
  branch_id: string;

  @ManyToOne(() => Branch, (branch) => branch.inventoryItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ type: 'enum', enum: InventoryStatus, default: InventoryStatus.ACTIVE })
  status: InventoryStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}