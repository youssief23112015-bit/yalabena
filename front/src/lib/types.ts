export enum QuestionType {
  MCQ = "MCQ",
  TRUE_FALSE = "TRUE_FALSE",
  MATCHING = "MATCHING",
  ORDERING = "ORDERING",
  SHORT_ANSWER = "SHORT_ANSWER",
}

export enum AttemptStatus {
  IN_PROGRESS = "IN_PROGRESS",
  SUBMITTED = "SUBMITTED",
  PENDING_REVIEW = "PENDING_REVIEW",
  GRADED = "GRADED",
  EXPIRED = "EXPIRED",
  RELEASED = "RELEASED",
}

export enum EnrollmentStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  CANCELLED = "CANCELLED",
}

export enum SubmissionStatus {
  SUBMITTED = "SUBMITTED",
  RESUBMITTED = "RESUBMITTED",
  GRADED = "GRADED",
}

export enum ReleaseMode {
  INSTANT = "INSTANT",
  AFTER_REVIEW = "AFTER_REVIEW",
}

export type Role = "super_admin" | "academic" | "teacher" | "student";

export interface AuthUser {
  userId: string;
  role: Role;
  first_name?: string;
  last_name?: string;
  email?: string;
}

export interface LmsModule {
  id: string;
  name: string;
  description?: string;
  group_id: string;
  order: number;
  lessons?: LmsLesson[];
}

export interface LmsLesson {
  id: string;
  module_id: string;
  name: string;
  content?: string;
  order: number;
  resources?: LmsResource[];
}

export interface LmsResource {
  id: string;
  lesson_id: string;
  name: string;
  type: "file" | "video" | "audio" | "pdf";
  file_url: string;
}

export interface Assignment {
  id: string;
  group_id: string;
  title: string;
  description?: string;
  due_at?: string;
  allow_late_submission: boolean;
  max_grade: number;
  created_at: string;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  content?: string;
  file_url?: string;
  file_name?: string;
  is_late: boolean;
  status: SubmissionStatus;
  score?: number;
  feedback?: string;
  submitted_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id?: string | null;
  points: number;
  type: QuestionType;
  question_text: string;
  correct_answer: unknown;
  options?: string[];
  topic_tag?: string;
  difficulty?: string;
}

export interface Quiz {
  id: string;
  group_id: string;
  title: string;
  description?: string;
  time_limit_minutes?: number;
  passing_score?: number;
  max_attempts?: number;
  release_type: "INSTANT" | "AFTER_REVIEW";
  questions?: QuizQuestion[];
}

export interface GradedAnswer {
  value: unknown;
  correct: boolean | null;
  points: number;
  flagged: boolean;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  student_id: string;
  started_at: string;
  status: AttemptStatus;
  score?: number;
  percentage?: number;
  is_passed?: boolean;
  needs_manual_review?: boolean;
  time_spent_seconds?: number;
  answers?: Record<string, GradedAnswer>;
}

export interface GradebookCategory {
  id: string;
  group_id: string;
  name: string;
  weight: number;
}

export interface GradebookEntry {
  id: string;
  group_id: string;
  student_id: string;
  category_id: string;
  score: number;
  category?: GradebookCategory;
  student?: { id: string; user?: { first_name: string; last_name: string } };
}

export interface WeightedGradeResult {
  overallPercentage: number;
  breakdown: Array<{
    category: string;
    weight: number;
    average: number | null;
    weightedContribution: number;
  }>;
}