import { Controller, Get, Post, Put, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiParam, ApiResponse } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { KbService } from './kb.service';

@ApiTags('Knowledge Base')
@ApiBearerAuth('JWT')
@Controller('kb')
export class KbController {
  constructor(private readonly service: KbService) {}

  @Post('categories')
  @Roles('super_admin', 'hr', 'branch_manager')
  @ApiOperation({ summary: 'Create KB category' })
  @ApiBody({ 
    description: 'KB category creation payload',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Teaching Guidelines' },
        description: { type: 'string', example: 'Standard procedures and guidelines for teachers.' },
      },
      required: ['name']
    }
  })
  @ApiResponse({ status: 201, description: 'KB category created successfully.' })
  createCategory(@Body() dto: any) {
    return this.service.createCategory(dto);
  }

  @Get('categories')
  @Roles('super_admin', 'hr', 'branch_manager', 'teacher', 'sales', 'finance')
  @ApiOperation({ summary: 'List KB categories' })
  @ApiResponse({ status: 200, description: 'Returns KB categories list.' })
  findCategories(@Query() query: any) {
    return this.service.findCategories(query);
  }

  @Post('articles')
  @Roles('super_admin', 'hr', 'branch_manager', 'teacher')
  @ApiOperation({ summary: 'Create KB article' })
  @ApiBody({ 
    description: 'KB article creation payload',
    schema: {
      type: 'object',
      properties: {
        categoryId: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174000' },
        title: { type: 'string', example: 'How to use Zoom in virtual classrooms' },
        content: { type: 'string', example: 'Step-by-step guide on setting up online meetings...' },
      },
      required: ['categoryId', 'title', 'content']
    }
  })
  @ApiResponse({ status: 201, description: 'KB article created successfully.' })
  createArticle(@Body() dto: any, @CurrentUser() user: any) {
    return this.service.createArticle(dto, user.userId);
  }

  @Get('articles')
  @Roles('super_admin', 'hr', 'branch_manager', 'teacher', 'sales', 'finance')
  @ApiOperation({ summary: 'List KB articles' })
  @ApiResponse({ status: 200, description: 'Returns KB articles list.' })
  findArticles(@Query() query: any) {
    return this.service.findArticles(query);
  }

  @Get('articles/:id')
  @Roles('super_admin', 'hr', 'branch_manager', 'teacher', 'sales', 'finance')
  @ApiOperation({ summary: 'Get KB article' })
  @ApiParam({ name: 'id', description: 'KB Article UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Returns KB article details.' })
  @ApiResponse({ status: 404, description: 'KB article not found.' })
  findOneArticle(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOneArticle(id);
  }

  @Put('articles/:id')
  @Roles('super_admin', 'hr', 'branch_manager', 'teacher')
  @ApiOperation({ summary: 'Update KB article' })
  @ApiParam({ name: 'id', description: 'KB Article UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiBody({ 
    description: 'KB article update payload',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Updated: How to use Zoom in virtual classrooms' },
        content: { type: 'string', example: 'Updated content and instructions...' },
      },
    }
  })
  @ApiResponse({ status: 200, description: 'KB article updated successfully.' })
  @ApiResponse({ status: 404, description: 'KB article not found.' })
  updateArticle(@Param('id', ParseUUIDPipe) id: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.service.updateArticle(id, dto, user.userId);
  }
}