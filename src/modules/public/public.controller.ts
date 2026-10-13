import { Controller, Get, Post, Param, Query, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { PublicService } from './public.service';
import { PublicLeadDto } from './dto/public-lead.dto';
import { PublicPlacementBookingDto } from './dto/public-placement-booking.dto';
import { PublicRegistrationDto } from './dto/public-registration.dto';
import { TrackPageViewDto } from './dto/track-page-view.dto';

@ApiTags('Public')
@Controller('public')
export class PublicController {
  constructor(private readonly service: PublicService) {}

  // ─── Blogs ───────────────────────────────────────────────────

  @Public()
  @Get('blogs')
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

  @Public()
  @Get('blogs/:slug')
  @ApiOperation({ summary: 'Get single blog post details by slug for public reading' })
  @ApiResponse({ status: 200, description: 'Blog post details retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Blog post not found.' })
  async findOne(@Param('slug') slug: string) {
    return this.service.findOneBySlug(slug);
  }

  // ─── Public course catalog ─────────────────────────────────────

  @Public()
  @Get('courses')
  @ApiOperation({ summary: 'Active courses for the public catalog' })
  @ApiQuery({ name: 'level', required: false, type: String })
  listCourses(@Query('level') level?: string) {
    return this.service.listCourses(level);
  }

  // ─── Lead capture (SRS 4.14) ─────────────────────────────────

  @Public()
  @Post('leads')
  @ApiOperation({ summary: 'Capture an anonymous lead from the public website' })
  @ApiResponse({ status: 201, description: 'Lead captured (deduped by phone).' })
  captureLead(@Body() dto: PublicLeadDto) {
    return this.service.captureLead(dto);
  }

  // ─── Placement-test self-booking (SRS 4.3) ───────────────────

  @Public()
  @Get('placement-slots')
  @ApiOperation({ summary: 'Open placement-test slots for self-booking' })
  @ApiQuery({ name: 'branch_id', required: false, type: String })
  listPlacementSlots(@Query('branch_id') branchId?: string) {
    return this.service.listPlacementSlots(branchId);
  }

  @Public()
  @Post('placement-bookings')
  @ApiOperation({ summary: 'Book yourself into a placement-test slot' })
  @ApiResponse({ status: 201, description: 'Booking confirmed.' })
  bookPlacement(@Body() dto: PublicPlacementBookingDto) {
    return this.service.bookPlacementTest(dto);
  }

  // ─── Online registration (SRS 4.14) ──────────────────────────

  @Public()
  @Post('registrations')
  @ApiOperation({ summary: 'Anonymous online course registration' })
  @ApiResponse({ status: 201, description: 'Registration received.' })
  registerStudent(@Body() dto: PublicRegistrationDto) {
    return this.service.registerStudent(dto);
  }

  // ─── Testimonials + analytics ────────────────────────────────

  @Public()
  @Get('testimonials')
  @ApiOperation({ summary: 'Approved student testimonials for the landing page' })
  listTestimonials() {
    return this.service.listTestimonials();
  }

  @Public()
  @Post('page-views')
  @ApiOperation({ summary: 'Track a public page view (self-hosted analytics)' })
  trackPageView(@Body() dto: TrackPageViewDto, @Req() req: Request) {
    return this.service.trackPageView(
      dto,
      req.ip,
      typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined,
    );
  }
}