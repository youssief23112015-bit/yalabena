import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { KbArticle } from './kb-article.entity';
import { User } from './user.entity';

@Entity('kb_article_versions')
export class KbArticleVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  article_id: string;

  @ManyToOne(() => KbArticle, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'article_id' })
  article: KbArticle;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'int' })
  version_number: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  change_note: string;

  @Column({ type: 'uuid', nullable: true })
  created_by: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
