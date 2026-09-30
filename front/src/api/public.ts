import apiClient from "./client";
import type { Course, Branch } from "@/types";

/* ── Public website API (no auth required) ─────────────────────────── */

export interface PublicLeadInput {
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  level_interest?: string;
  notes?: string;
  branch_id?: string;
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
  branch_id: string;
  branch?: Branch;
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
  branch_id: string;
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

/* ── Branches ────────────────────────────────────────────────────────── */

export async function fetchPublicBranches(): Promise<Branch[]> {
  const { data } = await apiClient.get<Branch[]>("/branches");
  return Array.isArray(data) ? data : [];
}

/* ── Lead capture ────────────────────────────────────────────────────── */

export async function capturePublicLead(input: PublicLeadInput): Promise<{ id: string }> {
  const { data } = await apiClient.post("/public/leads", input);
  return data;
}

/* ── Placement test booking ──────────────────────────────────────────── */

export async function fetchPublicTestSlots(branchId?: string): Promise<PublicTestSlot[]> {
  const { data } = await apiClient.get<PublicTestSlot[]>("/public/placement-slots", {
    params: branchId ? { branch_id: branchId } : {},
  });
  return Array.isArray(data) ? data : [];
}

export async function bookPublicPlacementTest(
  input: PublicPlacementBookingInput,
): Promise<{ test_id: string; message: string }> {
  const { data } = await apiClient.post("/public/placement-bookings", input);
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