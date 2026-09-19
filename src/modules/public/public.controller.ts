import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { PublicService } from './public.service';

@ApiTags('Public')
@Controller('public/blogs')
export class PublicController {
  constructor(private readonly service: PublicService) {}

  @Get()
  @ApiOperation({ summary: 'Get all published blog posts for the public website with pagination and search' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of blog posts retrieved successfully.' })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
  ) {
    return this.service.findAllPublished(page, limit, search);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get single blog post details by slug for public reading' })
  @ApiResponse({ status: 200, description: 'Blog post details retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Blog post not found.' })
  async findOne(@Param('slug') slug: string) {
    return this.service.findOneBySlug(slug);
  }
}