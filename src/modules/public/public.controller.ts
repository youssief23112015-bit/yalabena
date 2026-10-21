import { Controller, Get, Post, Param, Query, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { PublicService } from './public.service';
import { PlacementTestsService } from '../placement-tests/placement-tests.service';
import { PublicLeadDto } from './dto/public-lead.dto';
import { PublicPlacementBookingDto } from './dto/public-placement-booking.dto';
import { PublicRegistrationDto } from './dto/public-registration.dto';
import { TrackPageViewDto } from './dto/track-page-view.dto';
import { InstantPlacementBookingDto } from '../placement-tests/dto/instant-placement-booking.dto';
import { SubmitWrittenDto } from '../placement-tests/dto/submit-written.dto';

@ApiTags('Public')
@Controller('public')
export class PublicController {
  constructor(
    private readonly service: PublicService,
    // Guest placement sessions (instant booking, paper, submit) live on the
    // placement-tests service — the testId acts as the capability token.
    private readonly placementTests: PlacementTestsService,
  ) {}

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
  listPlacementSlots() {
    return this.service.listPlacementSlots();
  }

  @Public()
  @Post('placement-bookings')
  @ApiOperation({ summary: 'Book yourself into a placement-test slot' })
  @ApiResponse({ status: 201, description: 'Booking confirmed.' })
  bookPlacement(@Body() dto: PublicPlacementBookingDto) {
    return this.service.bookPlacementTest(dto);
  }

  // ─── Instant guest test (frictionless onboarding, Path A) ────

  @Public()
  @Post('placement-bookings/instant')
  @ApiOperation({
    summary:
      'Take the instant online placement test now — upserts the Lead (TEST_SCHEDULED) ' +
      'and returns a testId for password-free execution at /placement-test?testId=…',
  })
  @ApiResponse({ status: 201, description: '{ success, testId, leadId }' })
  bookInstant(@Body() dto: InstantPlacementBookingDto) {
    return this.placementTests.bookInstant(dto);
  }

  // ─── Guest test execution (testId = capability token) ─────────

  @Public()
  @Get('placement-tests/:id')
  @ApiOperation({ summary: 'Guest placement-test session info (validates the testId link)' })
  getGuestSession(@Param('id') id: string) {
    return this.placementTests.getGuestSession(id);
  }

  @Public()
  @Post('placement-tests/:id/paper')
  @ApiOperation({ summary: 'Generate the written paper for a guest session' })
  guestPaper(@Param('id') id: string, @Body() body: { level?: string; count?: number; categories?: string[]; seed?: number }) {
    return this.placementTests.getGuestPaper(id, body);
  }

  @Public()
  @Post('placement-tests/:id/submit')
  @ApiOperation({
    summary:
      'Submit a guest session — auto-scores it and syncs score + CEFR level ' +
      'to the Lead (status → test_completed)',
  })
  guestSubmit(@Param('id') id: string, @Body() dto: SubmitWrittenDto) {
    return this.placementTests.submitGuest(id, dto);
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