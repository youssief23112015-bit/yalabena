import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { KbVisibility } from '../../common/enums/kb-visibility.enum';
import { KbArticle } from './kb-article.entity';

@Entity('kb_categories')
export class KbCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 150, unique: true, nullable: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'uuid', nullable: true })
  parent_id: string;

  @ManyToOne(() => KbCategory, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: KbCategory;

  @OneToMany(() => KbCategory, (kc) => kc.parent)
  children: KbCategory[];

  @Column({ type: 'enum', enum: KbVisibility, default: KbVisibility.STAFF })
  visibility: KbVisibility;

  @Column({ type: 'int', default: 0 })
  sort_order: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @OneToMany(() => KbArticle, (ka) => ka.category)
  articles: KbArticle[];
}
