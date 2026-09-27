export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
  path: string;
}

export interface ApiError {
  success: false;
  statusCode: number;
  message: string | string[];
  errors?: Record<string, string[]>;
  timestamp: string;
  path: string;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  branch_id?: string;
  language: string;
  avatar_url?: string;
  phone?: string;
  status?: string;
  role?: string;
  roles?: string[];
  permissions?: string[];
  role_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  email?: string;
  manager_id?: string;
  manager?: User;
  classroom_count: number;
  classrooms?: Classroom[];
  logo_url?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Classroom {
  id: string;
  name: string;
  branch_id: string;
  capacity: number;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface Role {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_custom: boolean;
  is_system: boolean;
  created_at: string;
  permissions: Permission[];
}

export interface Permission {
  id: string;
  name: string;
  slug: string;
  description?: string;
  module: string;
  action: string;
}

export interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  national_id?: string;
  source: string;
  status: string;
  level_interest?: string;
  notes?: string;
  assigned_to?: string;
  assigned_to_user?: User;
  branch_id?: string;
  branch?: Branch;
  converted_to_student_id?: string;
  converted_at?: string;
  tags?: string[];
  activities?: LeadActivity[];
  follow_up_date?: string;
  created_at: string;
  updated_at: string;
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  type: 'call' | 'note' | 'follow_up' | 'status_change' | 'email' | 'visit';
  description: string;
  created_by?: string;
  created_by_user?: User;
  created_at: string;
}

export interface Course {
  id: string;
  name: string;
  code?: string;
  level: string;
  duration_hours: number;
  syllabus?: string;
  description?: string;
  default_price: number;
  min_age?: number;
  max_age?: number;
  status: string;
  prerequisites?: Course[];
  materials?: CourseMaterial[];
  branch_pricing?: CourseBranchPricing[];
  created_at: string;
  updated_at: string;
}

export interface CourseMaterial {
  id: string;
  course_id: string;
  inventory_item_id: string;
  inventory_item?: InventoryItem;
  quantity: number;
  required: boolean;
}

export interface CourseBranchPricing {
  id: string;
  course_id: string;
  branch_id: string;
  branch?: Branch;
  price: number;
  currency: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  description?: string;
  unit_cost: number;
  status: string;
}

export interface Group {
  id: string;
  name: string;
  courseId?: string;
  course?: Course;
  branchId?: string;
  branch?: Branch;
  teacherId?: string;
  teacher?: User;
  substitute_teacher_id?: string;
  substitute_teacher?: User;
  classroomId?: string;
  classroom?: Classroom;
  capacity?: number;
  mode?: 'in_person' | 'online' | 'hybrid';
  meeting_link?: string;
  recording_link?: string;
  schedule?: GroupSchedule[];
  start_date?: string;
  end_date?: string;
  status?: 'upcoming' | 'active' | 'completed' | 'cancelled';
  students?: Student[];
  student_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface GroupSchedule {
  id: string;
  group_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room_id?: string;
  room?: Classroom;
}

export interface SessionItem {
  id: string;
  groupId?: string;
  group?: Group;
  title: string;
  topic?: string;
  notes?: string;
  session_type: string;
  meeting_link?: string;
  recording_link?: string;
  classroomId?: string;
  classroom?: Classroom;
  start_time?: string;
  end_time?: string;
  status?: string;
  attendance?: Attendance[];
  attendance_locked?: boolean;
  attendance_deadline?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Attendance {
  id: string;
  session_id: string;
  student_id: string;
  student?: Student;
  status: 'present' | 'absent' | 'late' | 'excused';
  check_in_method?: 'manual' | 'qr' | 'self';
  check_in_time?: string;
  notes?: string;
  recorded_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Student {
  id: string;
  user_id: string;
  student_number: string;

  user?: User;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;

  branch_id?: string;
  branch?: Branch;

  current_level?: string;
  status?: string;

  enrollment_date?: string;
  placement_test_id?: string;

  profile?: {
    id: string;
    student_id: string;
    photo_url?: string | null;
    date_of_birth?: string | null;
    gender?: string | null;
    address?: string | null;
    national_id?: string | null;
    education_level?: string | null;
    emergency_contact_name?: string | null;
    emergency_contact_phone?: string | null;
    emergency_contact_relation?: string | null;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
  } | null;

  level_history?: LevelHistory[];
  payment_history?: Payment[];
  attendance_summary?: AttendanceSummary;
  certificates?: Certificate[];
  enrolled_groups?: Group[];

  created_at?: string;
  updated_at?: string;
}

export interface LevelHistory {
  id: string;
  student_id: string;
  level: string;
  assigned_date: string;
  assigned_by?: string;
  reason?: string;
}

export interface Payment {
  id: string;
  student_id: string;
  invoice_id: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  paid_at?: string;
  created_at?: string;
}

export interface AttendanceSummary {
  total_sessions: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendance_rate: number;
}

export interface Certificate {
  id: string;
  student_id: string;
  course_id: string;
  template_id: string;
  verification_code: string;
  issued_at: string;
  status: string;
}

export interface DashboardStats {
  total_leads: number;
  total_students: number;
  total_courses: number;
  total_branches: number;
  total_groups: number;
  total_sessions: number;
  revenue_today: number;
  revenue_month: number;
  revenue_year: number;
  outstanding_payments: number;
  conversion_rate: number;
  teacher_utilization: number;
  group_fill_rate: number;
  recent_leads: Lead[];
  recent_payments: Payment[];
  upcoming_sessions: SessionItem[];
  attendance_summary: {
    present: number;
    absent: number;
    late: number;
  };
}

export interface LoginDto {
  email: string;
  password: string;
  ip?: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  branch_id?: string;
  role_slug?: string;
  language?: string;
}

// ─── Two-Factor Authentication (SRS 7.2) ───

/** Returned by /auth/login instead of AuthResponse when the account has 2FA enabled. */
export interface TwoFactorChallenge {
  requires_2fa: true;
  temp_token: string;
}

export interface TwoFactorSetup {
  secret: string;
  otpauth_url: string;
  qr_code_data_url: string;
}

// ─── Notifications (SRS 4.18) ───

export interface AppNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
  action_url?: string | null;
  read_at?: string | null;
  created_at: string;
}

export interface PaginatedNotifications {
  items: AppNotification[];
  total: number;
  page: number;
  limit: number;
  unread_count: number;
}

// ─── Audit logs (SRS 7.2) ───

export interface AuditLog {
  id: string;
  actor_id?: string | null;
  actor_type?: string;
  action: string;
  module?: string;
  target_type?: string | null;
  target_id?: string | null;
  before_state?: unknown;
  after_state?: unknown;
  description?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
}

export interface PaginatedAuditLogs {
  items: AuditLog[];
  total: number;
  page: number;
  limit: number;
}

export interface StoredFileInfo {
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  kind: string;
}

