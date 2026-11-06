import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { KbCategory } from './kb-category.entity';
import { KbVisibility } from '../../common/enums/kb-visibility.enum';
import { KbArticleVersion } from './kb-article-version.entity';

@Entity('kb_articles')
export class KbArticle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  category_id: string;

  @ManyToOne(() => KbCategory, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  category: KbCategory;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  slug: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  excerpt: string;

  @Column({ type: 'jsonb', nullable: true })
  tags: any;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ type: 'enum', enum: KbVisibility, default: KbVisibility.STAFF })
  visibility: KbVisibility;

  @Column({ type: 'boolean', default: false })
  is_pinned: boolean;

  @Column({ type: 'int', default: 0 })
  view_count: number;

  @Column({ type: 'uuid', nullable: true })
  created_by: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @Column({ type: 'uuid', nullable: true })
  updated_by: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updater: User;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @OneToMany(() => KbArticleVersion, (kav) => kav.article)
  versions: KbArticleVersion[];
}
