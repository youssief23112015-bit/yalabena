import apiClient from "./client";
import type { Course } from "@/types";

/* ── Public website API (no auth required) ─────────────────────────── */

export interface PublicLeadInput {
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  level_interest?: string;
  notes?: string;
}

export interface PublicPlacementBookingInput {
  slot_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  level_interest?: string;
}

export interface PublicTestSlot {
  id: string;
  start_time: string;
  end_time: string;
  mode: string;
  status: string;
  capacity: number;
  booked_count: number;
}

export interface PublicRegistrationInput {
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  course_id: string;
  level_interest?: string;
}

export interface PublicRegistrationResult {
  lead_id: string;
  student_id?: string;
  enrollment_id?: string;
  invoice_id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  easykash_payment_url?: string;
  easykash_reference?: string;
}

export interface CertificateVerificationResult {
  valid: boolean;
  certificate?: {
    id: string;
    verification_code: string;
    student_name: string;
    course_name: string;
    level: string;
    issued_at: string;
    status: string;
  };
}

/* ── Courses ─────────────────────────────────────────────────────────── */

export async function fetchPublicCourses(): Promise<Course[]> {
  const { data } = await apiClient.get<Course[]>("/courses", {
    params: { status: "active" },
  });
  return Array.isArray(data) ? data : [];
}

export async function fetchPublicCourse(id: string): Promise<Course> {
  const { data } = await apiClient.get<Course>(`/courses/${id}`);
  return data;
}

/* ── Lead capture ────────────────────────────────────────────────────── */

export async function capturePublicLead(input: PublicLeadInput): Promise<{ id: string }> {
  const { data } = await apiClient.post("/public/leads", input);
  return data;
}

/* ── Placement test booking ──────────────────────────────────────────── */

export async function fetchPublicTestSlots(): Promise<PublicTestSlot[]> {
  const { data } = await apiClient.get<PublicTestSlot[]>("/public/placement-slots");
  return Array.isArray(data) ? data : [];
}

export async function bookPublicPlacementTest(
  input: PublicPlacementBookingInput,
): Promise<{
  test_id: string;
  lead_id?: string;
  /** ISO datetime of the scheduled session (Business Rule 3 — schedule visibility). */
  scheduled_at?: string;
  message: string;
}> {
  const { data } = await apiClient.post("/public/placement-bookings", input);
  return data;
}

/* ── Instant guest test (frictionless onboarding, Path A) ───────────── */

export interface InstantBookingInput {
  name: string;
  phone: string;
  email?: string;
  /** Course-context target level (e.g. the level of the catalog course). */
  level_interest?: string;
}

export interface InstantBookingResult {
  success: boolean;
  /** Capability token for /placement-test?testId=… — no login required. */
  testId: string;
  leadId: string;
}

export async function bookInstantPlacementTest(
  input: InstantBookingInput,
): Promise<InstantBookingResult> {
  const { data } = await apiClient.post<InstantBookingResult>(
    "/public/placement-bookings/instant",
    input,
  );
  return data;
}

export interface GuestPlacementSession {
  testId: string;
  status: string;
  completed: boolean;
  first_name: string | null;
  result: {
    score: number;
    maxScore: number;
    percentage: number;
    level: string | null;
  } | null;
}

/** Validates the testId link and returns the session (incl. stored result). */
export async function fetchPublicPlacementTest(id: string): Promise<GuestPlacementSession> {
  const { data } = await apiClient.get<GuestPlacementSession>(
    `/public/placement-tests/${encodeURIComponent(id)}`,
  );
  return data;
}

/* ── Online registration ─────────────────────────────────────────────── */

export async function registerPublicStudent(
  input: PublicRegistrationInput,
): Promise<PublicRegistrationResult> {
  const { data } = await apiClient.post("/public/registrations", input);
  return data;
}

/* ── Certificate verification ────────────────────────────────────────── */

export async function verifyCertificatePublic(
  code: string,
): Promise<CertificateVerificationResult> {
  const { data } = await apiClient.get(
    `/certificates/verify/${encodeURIComponent(code)}`,
  );
  return data;
}

/* ── Testimonials (public) ───────────────────────────────────────────── */

export interface PublicTestimonial {
  id: string;
  name: string;
  role?: string;
  content: string;
  rating?: number;
  avatar_url?: string;
}

export async function fetchPublicTestimonials(): Promise<PublicTestimonial[]> {
  try {
    const { data } = await apiClient.get<PublicTestimonial[]>("/public/testimonials");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/* ── Blog (public, SRS 4.14) ─────────────────────────────────────────── */

export interface PublicBlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string | null;
  featured_image?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  published_at?: string | null;
  author?: { id: string; first_name?: string; last_name?: string } | null;
  view_count?: number;
  created_at?: string;
}

export interface PublicBlogListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PublicBlogListResult {
  data: PublicBlogPost[];
  meta: PublicBlogListMeta;
}

export async function fetchPublishedBlogs(params: {
  page?: number;
  limit?: number;
  search?: string;
} = {}): Promise<PublicBlogListResult> {
  const { data } = await apiClient.get<PublicBlogListResult>("/public/blogs", {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 9,
      ...(params.search ? { search: params.search } : {}),
    },
  });
  return {
    data: Array.isArray(data?.data) ? data.data : [],
    meta: data?.meta ?? {
      total: 0,
      page: params.page ?? 1,
      limit: params.limit ?? 9,
      totalPages: 0,
    },
  };
}

export async function fetchBlogPostBySlug(slug: string): Promise<PublicBlogPost> {
  const { data } = await apiClient.get<PublicBlogPost>(
    `/public/blogs/${encodeURIComponent(slug)}`,
  );
  return data;
}