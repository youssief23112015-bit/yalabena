import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { BlogPost } from '../../shared/entities/blog-post.entity';

@Injectable()
export class PublicService {
  constructor(
    @InjectRepository(BlogPost)
    private readonly repo: Repository<BlogPost>,
  ) {}

  async findAllPublished(page: number, limit: number, search?: string) {
    const skip = (page - 1) * limit;
    
    const query = this.repo.createQueryBuilder('blog')
      .where('blog.isPublished = :isPublished', { isPublished: true });

    if (search) {
      query.andWhere('(blog.title ILIKE :search OR blog.content ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    query.orderBy('blog.publishedAt', 'DESC')
         .skip(skip)
         .take(limit);

    const [items, total] = await query.getManyAndCount();

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOneBySlug(slug: string): Promise<BlogPost> {
    const post = await this.repo.createQueryBuilder('blog')
      .where('blog.slug = :slug', { slug })
      .andWhere('blog.isPublished = :isPublished', { isPublished: true })
      .getOne();

    if (!post) {
      throw new NotFoundException(`Blog post with slug ${slug} not found`);
    }

    return post;
  }
}