import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KbCategory } from '../../shared/entities/kb-category.entity';
import { KbArticle } from '../../shared/entities/kb-article.entity';
import { KbArticleVersion } from '../../shared/entities/kb-article-version.entity';
import { KbController } from './kb.controller';
import { KbService } from './kb.service';

@Module({
  imports: [TypeOrmModule.forFeature([KbCategory, KbArticle, KbArticleVersion])],
  controllers: [KbController],
  providers: [KbService],
  exports: [KbService],
})
export class KbModule {}
