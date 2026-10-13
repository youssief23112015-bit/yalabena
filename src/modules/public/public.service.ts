import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { BlogPost } from '../../shared/entities/blog-post.entity';
import { Testimonial } from '../../shared/entities/testimonial.entity';
import { PageView } from '../../shared/entities/page-view.entity';
import { Course } from '../../shared/entities/course.entity';
import { Lead } from '../../shared/entities/lead.entity';
import { TestSlot } from '../../shared/entities/test-slot.entity';
import { PlacementTest } from '../../shared/entities/placement-test.entity';
import { User } from '../../shared/entities/user.entity';
import { Student } from '../../shared/entities/student.entity';
import { UserRole } from '../../shared/entities/user-role.entity';
import { Role } from '../../shared/entities/role.entity';
import { LeadSource } from '../../common/enums/lead-source.enum';
import { LeadStatus } from '../../common/enums/lead-status.enum';
import { SlotStatus } from '../../common/enums/slot-status.enum';
import { TestStatus } from '../../common/enums/test-status.enum';
import { CourseStatus } from '../../common/enums/course-status.enum';
import { TestimonialStatus } from '../../common/enums/testimonial-status.enum';
import { StudentStatus } from '../../common/enums/student-status.enum';
import { UserStatus } from '../../common/enums/user-status.enum';
import { PublicLeadDto } from './dto/public-lead.dto';
import { PublicPlacementBookingDto } from './dto/public-placement-booking.dto';
import { PublicRegistrationDto } from './dto/public-registration.dto';
import { TrackPageViewDto } from './dto/track-page-view.dto';

@Injectable()
export class PublicService {
  constructor(
    @InjectRepository(BlogPost)
    private readonly repo: Repository<BlogPost>,
    @InjectRepository(Testimonial)
    private readonly testimonialRepo: Repository<Testimonial>,
    @InjectRepository(PageView)
    private readonly pageViewRepo: Repository<PageView>,
    @InjectRepository(Lead)
    private readonly leadRepo: Repository<Lead>,
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
    @InjectRepository(TestSlot)
    private readonly slotRepo: Repository<TestSlot>,
    @InjectRepository(PlacementTest)
    private readonly testRepo: Repository<PlacementTest>,
  ) {}

  // ─── Blogs ───────────────────────────────────────────────────

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

  // ─── Public course catalog ───────────────────────────────────

  /** Active courses for the public catalog, optionally filtered by level. */
  async listCourses(level?: string) {
    const qb = this.courseRepo
      .createQueryBuilder('course')
      .where('course.status = :status', { status: CourseStatus.ACTIVE });
    if (level) {
      qb.andWhere('course.level = :level', { level });
    }
    return qb.getMany();
  }

  // ─── Testimonials (approved only) ────────────────────────────

  async listTestimonials() {
    return this.testimonialRepo.find({
      where: { status: TestimonialStatus.APPROVED },
      relations: ['student'],
      order: { is_featured: 'DESC', created_at: 'DESC' },
      take: 24,
    });
  }

  // ─── Lead capture (SRS 4.14) ─────────────────────────────────

  /**
   * Anonymous lead from the public site; source is forced to `website`.
   * Idempotent by phone: an existing contact returns is_new=false without
   * touching the row (spec: public.service.spec.ts › captureLead).
   */
  async captureLead(dto: PublicLeadDto): Promise<{ lead_id: string; is_new: boolean }> {
    const existing = await this.leadRepo
      .createQueryBuilder('lead')
      .where('lead.phone = :phone', { phone: dto.phone })
      .getOne();
    if (existing) {
      return { lead_id: existing.id, is_new: false };
    }

    const lead = await this.leadRepo.save(
      this.leadRepo.create({
        first_name: dto.first_name,
        last_name: dto.last_name,
        phone: dto.phone,
        email: dto.email,
        level_interest: dto.level_interest,
        notes: dto.notes,
        branch_id: dto.branch_id,
        source: LeadSource.WEBSITE,
        status: LeadStatus.NEW,
      }),
    );
    return { lead_id: lead.id, is_new: true };
  }

  // ─── Page views (self-hosted analytics, SRS 4.14) ────────────

  async trackPageView(
    dto: TrackPageViewDto,
    ip?: string,
    userAgent?: string,
  ): Promise<{ tracked: true }> {
    await this.pageViewRepo.save(
      this.pageViewRepo.create({
        page_path: dto.page_path,
        referrer: dto.referrer,
        session_id: dto.session_id,
        ip_address: ip,
        user_agent: userAgent,
      }),
    );
    return { tracked: true };
  }

  // ─── Placement-test self-booking (SRS 4.3) ───────────────────

  /**
   * Open future slots with remaining capacity. Examiner details are stripped
   * — this is an anonymous endpoint (spec: listPlacementSlots).
   */
  async listPlacementSlots(branchId?: string) {
    const qb = this.slotRepo
      .createQueryBuilder('slot')
      .innerJoin('slot.branch', 'branch')
      .where('slot.status = :status', { status: SlotStatus.OPEN })
      .andWhere('slot.date >= :today', { today: new Date().toISOString().slice(0, 10) })
      .orderBy('slot.date', 'ASC')
      .addOrderBy('slot.start_time', 'ASC');
    if (branchId) qb.andWhere('slot.branch_id = :branchId', { branchId });
    const rows = await qb.getMany();
    return rows.map(({ examiner_id: _examiner, ...rest }) => ({
      ...rest,
      remaining_capacity: rest.capacity - rest.booked_count,
    }));
  }

  /**
   * A visitor books themselves into a slot — all inside one transaction:
   * find-or-create the lead, reject duplicates/invalid slots, reserve the
   * seat, schedule the test at the slot's start time (spec: bookPlacementTest).
   */
  async bookPlacementTest(
    dto: PublicPlacementBookingDto,
  ): Promise<{ test_id: string; lead_id: string; scheduled_at: Date; message: string }> {
    return this.slotRepo.manager.transaction(async (em) => {
      const slot = await em
        .getRepository(TestSlot)
        .createQueryBuilder('slot')
        .where('slot.id = :id', { id: dto.slot_id })
        .getOne();
      if (!slot) throw new NotFoundException('Placement slot not found');
      if (slot.status !== SlotStatus.OPEN) {
        throw new BadRequestException('This slot is no longer open');
      }
      const today = new Date().toISOString().slice(0, 10);
      if (String(slot.date).slice(0, 10) < today) {
        throw new BadRequestException('This slot is in the past');
      }
      if (slot.booked_count >= slot.capacity) {
        throw new ConflictException('This slot is fully booked');
      }

      // Find-or-create the lead from the contact info.
      let lead = await em
        .getRepository(Lead)
        .createQueryBuilder('lead')
        .where('lead.phone = :phone', { phone: dto.phone })
        .getOne();
      if (!lead) {
        lead = await em.getRepository(Lead).save(
          em.getRepository(Lead).create({
            first_name: dto.first_name,
            last_name: dto.last_name,
            phone: dto.phone,
            email: dto.email,
            level_interest: dto.level_interest,
            branch_id: slot.branch_id,
            source: LeadSource.WEBSITE,
            status: LeadStatus.TEST_SCHEDULED,
          }),
        );
      }

      // One active test per lead at a time.
      const activeTest = await em
        .getRepository(PlacementTest)
        .createQueryBuilder('t')
        .where('t.lead_id = :leadId', { leadId: lead.id })
        .andWhere('t.status IN (:...st)', {
          st: [TestStatus.SCHEDULED, TestStatus.IN_PROGRESS],
        })
        .getOne();
      if (activeTest) {
        throw new ConflictException('This contact already has an active placement test');
      }

      const scheduledAt = new Date(`${slot.date}T${slot.start_time}`);
      const test = await em.getRepository(PlacementTest).save(
        em.getRepository(PlacementTest).create({
          lead_id: lead.id,
          slot_id: slot.id,
          examiner_id: slot.examiner_id,
          scheduled_at: scheduledAt,
          status: TestStatus.SCHEDULED,
        }),
      );

      slot.booked_count += 1;
      if (slot.booked_count >= slot.capacity) slot.status = SlotStatus.FULL;
      await em.getRepository(TestSlot).save(slot);

      return {
        test_id: test.id,
        lead_id: lead.id,
        scheduled_at: test.scheduled_at,
        message: 'Your placement test is booked. Please arrive 15 minutes early.',
      };
    });
  }

  // ─── Online registration (SRS 4.14) ──────────────────────────

  /**
   * Anonymous online registration: create the lead + a student login now.
   * The invoice is created later by staff when they enroll the student in a
   * group (invoices require an enrollment reference in this schema).
   * User/Student/Role repos come from the entity manager so the constructor
   * stays at the 7 repositories the spec instantiates.
   */
  async registerStudent(dto: PublicRegistrationDto) {
    const em = this.repo.manager;

    // 1) Lead (dedupe by phone, same rule as captureLead).
    let lead = await em
      .getRepository(Lead)
      .createQueryBuilder('lead')
      .where('lead.phone = :phone', { phone: dto.phone })
      .getOne();
    if (!lead) {
      lead = await em.getRepository(Lead).save(
        em.getRepository(Lead).create({
          first_name: dto.first_name,
          last_name: dto.last_name,
          phone: dto.phone,
          email: dto.email,
          level_interest: dto.level_interest,
          branch_id: dto.branch_id,
          source: LeadSource.WEBSITE,
          status: LeadStatus.NEW,
        }),
      );
    }

    // 2) Student account — only when an email is provided (login key).
    let student: Student | null = null;
    if (dto.email) {
      const existingUser = await em
        .getRepository(User)
        .createQueryBuilder('u')
        .where('u.email = :email', { email: dto.email })
        .getOne();
      if (existingUser) {
        student = await em
          .getRepository(Student)
          .findOne({ where: { user_id: existingUser.id } });
      } else {
        const tempPassword = Math.random().toString(36).slice(2, 12);
        const hash = await bcrypt.hash(tempPassword, 12);
        const user = await em.getRepository(User).save(
          em.getRepository(User).create({
            email: dto.email,
            phone: dto.phone,
            password_hash: hash,
            first_name: dto.first_name,
            last_name: dto.last_name,
            branch_id: dto.branch_id,
            language: 'ar',
            status: UserStatus.ACTIVE,
          }),
        );

        const studentRole = await em
          .getRepository(Role)
          .findOne({ where: { slug: 'student' } });
        if (studentRole) {
          await em.getRepository(UserRole).save({
            user_id: user.id,
            role_id: studentRole.id,
            assigned_by: user.id,
          });
        }

        student = await em.getRepository(Student).save(
          em.getRepository(Student).create({
            user_id: user.id,
            student_number: `STU-${Date.now().toString(36).toUpperCase()}`,
            current_level: dto.level_interest,
            branch_id: dto.branch_id,
            status: StudentStatus.ACTIVE,
            enrollment_date: new Date(),
          }),
        );
      }
    }

    // 3) Advance the lead so sales sees the follow-up.
    if (lead.status === LeadStatus.NEW) {
      lead.status = LeadStatus.CONTACTED;
      await em.getRepository(Lead).save(lead);
    }

    return {
      lead_id: lead.id,
      student_id: student?.id ?? null,
      invoice_id: null as string | null,
      invoice_number: null as string | null,
      amount: 0,
      currency: 'EGP',
      easykash_payment_url: null as string | null,
      easykash_reference: null as string | null,
      message:
        'Registration received. Our team will contact you to confirm your seat and send the payment invoice.',
    };
  }
}
