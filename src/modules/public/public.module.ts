import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlogPost } from '../../shared/entities/blog-post.entity';
import { Testimonial } from '../../shared/entities/testimonial.entity';
import { PageView } from '../../shared/entities/page-view.entity';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';

@Module({
  imports: [TypeOrmModule.forFeature([BlogPost, Testimonial, PageView])],
  controllers: [PublicController],
  providers: [PublicService],
  exports: [PublicService],
})
export class PublicModule {}
