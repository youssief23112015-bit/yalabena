import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KbCategory } from '../../shared/entities/kb-category.entity';
import { KbArticle } from '../../shared/entities/kb-article.entity';
import { KbArticleVersion } from '../../shared/entities/kb-article-version.entity';

@Injectable()
export class KbService {
  constructor(
    @InjectRepository(KbCategory) private catRepo: Repository<KbCategory>,
    @InjectRepository(KbArticle) private articleRepo: Repository<KbArticle>,
    @InjectRepository(KbArticleVersion) private versionRepo: Repository<KbArticleVersion>,
  ) {}

  // Categories
  async createCategory(dto: any) {
    return this.catRepo.save(this.catRepo.create(dto));
  }

  async findCategories(query: any) {
    return this.catRepo.find({
      where: query.parent_id ? { parent_id: query.parent_id } : { parent_id: null },
      relations: ['children'],
      order: { sort_order: 'ASC' },
    });
  }

  // Articles
  async createArticle(dto: any, userId: string) {
    const article = this.articleRepo.create({ ...dto, created_by: userId });
    return this.articleRepo.save(article);
  }

  async findArticles(query: any) {
    const qb = this.articleRepo.createQueryBuilder('a')
      .leftJoinAndSelect('a.category', 'category')
      .leftJoinAndSelect('a.creator', 'creator');
    if (query.category_id) qb.andWhere('a.category_id = :cid', { cid: query.category_id });
    if (query.visibility) qb.andWhere('a.visibility = :vis', { vis: query.visibility });
    if (query.search) {
      qb.andWhere('(a.title ILIKE :search OR a.body ILIKE :search)', { search: `%${query.search}%` });
    }
    return qb.orderBy('a.is_pinned', 'DESC').addOrderBy('a.created_at', 'DESC').getMany();
  }

  async findOneArticle(id: string) {
    const article = await this.articleRepo.findOne({
      where: { id },
      relations: ['category', 'creator', 'versions'],
    });
    if (!article) throw new NotFoundException('Article not found');
    article.view_count += 1;
    await this.articleRepo.save(article);
    return article;
  }

  async updateArticle(id: string, dto: any, userId: string) {
    const article = await this.findOneArticle(id);
    // Save version before update
    await this.versionRepo.save(this.versionRepo.create({
      article_id: id,
      body: article.body,
      version_number: article.version,
      created_by: userId,
    }));
    article.version += 1;
    Object.assign(article, dto);
    article.updated_by = userId;
    return this.articleRepo.save(article);
  }
}
