import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlogPost } from '../../shared/entities/blog-post.entity';
import { Testimonial } from '../../shared/entities/testimonial.entity';
import { PageView } from '../../shared/entities/page-view.entity';
import { Course } from '../../shared/entities/course.entity';
import { Lead } from '../../shared/entities/lead.entity';
import { TestSlot } from '../../shared/entities/test-slot.entity';
import { PlacementTest } from '../../shared/entities/placement-test.entity';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BlogPost,
      Testimonial,
      PageView,
      Course,
      Lead,
      TestSlot,
      PlacementTest,
    ]),
  ],
  controllers: [PublicController],
  providers: [PublicService],
  exports: [PublicService],
})
export class PublicModule {}
