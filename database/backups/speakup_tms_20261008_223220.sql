--
-- PostgreSQL database dump
--

\restrict s4MyFYpnhKa4nvkZ6btP8B2Xum97EuVfPpMhhX5QDDWm4TIey7GIpBLS3azv2i5

-- Dumped from database version 15.19
-- Dumped by pg_dump version 15.19

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: activities_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.activities_status_enum AS ENUM (
    'upcoming',
    'open',
    'full',
    'completed',
    'cancelled'
);


--
-- Name: activities_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.activities_type_enum AS ENUM (
    'movie_night',
    'conversation_club',
    'trip',
    'contest',
    'workshop',
    'other'
);


--
-- Name: activity_registrations_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.activity_registrations_status_enum AS ENUM (
    'registered',
    'attended',
    'no_show',
    'cancelled'
);


--
-- Name: assignments_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.assignments_type_enum AS ENUM (
    'text',
    'file_upload',
    'mixed'
);


--
-- Name: attendances_check_in_method_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.attendances_check_in_method_enum AS ENUM (
    'manual',
    'qr_code',
    'self_portal',
    'auto'
);


--
-- Name: attendances_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.attendances_status_enum AS ENUM (
    'present',
    'absent',
    'late',
    'excused'
);


--
-- Name: audit_logs_actor_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.audit_logs_actor_type_enum AS ENUM (
    'user',
    'system',
    'api'
);


--
-- Name: blog_posts_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.blog_posts_status_enum AS ENUM (
    'draft',
    'published',
    'archived'
);


--
-- Name: branches_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.branches_status_enum AS ENUM (
    'active',
    'inactive',
    'suspended',
    'pending'
);


--
-- Name: certificates_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.certificates_status_enum AS ENUM (
    'active',
    'revoked',
    'expired'
);


--
-- Name: chat_messages_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.chat_messages_type_enum AS ENUM (
    'text',
    'emoji',
    'image',
    'file',
    'system'
);


--
-- Name: chat_rooms_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.chat_rooms_type_enum AS ENUM (
    'one_on_one',
    'group',
    'announcement'
);


--
-- Name: chat_strikes_action_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.chat_strikes_action_enum AS ENUM (
    'warning',
    'mute_24h',
    'ban_permanent'
);


--
-- Name: chat_violations_action_taken_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.chat_violations_action_taken_enum AS ENUM (
    'blocked',
    'warned',
    'flagged_only'
);


--
-- Name: classrooms_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.classrooms_status_enum AS ENUM (
    'active',
    'inactive',
    'suspended',
    'pending'
);


--
-- Name: courses_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.courses_status_enum AS ENUM (
    'active',
    'inactive',
    'archived'
);


--
-- Name: employee_documents_document_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.employee_documents_document_type_enum AS ENUM (
    'contract',
    'id',
    'certificate',
    'visa',
    'other'
);


--
-- Name: employees_employee_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.employees_employee_type_enum AS ENUM (
    'full_time',
    'part_time',
    'contract',
    'hourly'
);


--
-- Name: employees_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.employees_status_enum AS ENUM (
    'active',
    'on_leave',
    'terminated',
    'suspended'
);


--
-- Name: enrollments_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enrollments_status_enum AS ENUM (
    'pending',
    'active',
    'completed',
    'dropped',
    'transferred'
);


--
-- Name: financial_transactions_direction_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.financial_transactions_direction_enum AS ENUM (
    'in',
    'out'
);


--
-- Name: financial_transactions_transaction_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.financial_transactions_transaction_type_enum AS ENUM (
    'payment',
    'refund',
    'expense',
    'adjustment'
);


--
-- Name: follow_ups_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.follow_ups_status_enum AS ENUM (
    'pending',
    'completed',
    'overdue',
    'cancelled'
);


--
-- Name: groups_mode_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.groups_mode_enum AS ENUM (
    'in_person',
    'online',
    'hybrid'
);


--
-- Name: groups_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.groups_status_enum AS ENUM (
    'upcoming',
    'active',
    'completed',
    'cancelled'
);


--
-- Name: installments_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.installments_status_enum AS ENUM (
    'pending',
    'paid',
    'overdue',
    'partial'
);


--
-- Name: inventory_items_category_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.inventory_items_category_enum AS ENUM (
    'book',
    'workbook',
    'merchandise',
    'stationery',
    'equipment',
    'other'
);


--
-- Name: inventory_items_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.inventory_items_status_enum AS ENUM (
    'active',
    'discontinued',
    'archived'
);


--
-- Name: invoice_items_item_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.invoice_items_item_type_enum AS ENUM (
    'course',
    'registration_fee',
    'book',
    'exam',
    'certificate',
    'other'
);


--
-- Name: invoices_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.invoices_status_enum AS ENUM (
    'unpaid',
    'partial',
    'paid',
    'overdue',
    'cancelled',
    'refunded'
);


--
-- Name: kb_articles_visibility_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.kb_articles_visibility_enum AS ENUM (
    'staff',
    'manager',
    'admin',
    'teacher',
    'public'
);


--
-- Name: kb_categories_visibility_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.kb_categories_visibility_enum AS ENUM (
    'staff',
    'manager',
    'admin',
    'teacher',
    'public'
);


--
-- Name: lead_activities_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.lead_activities_type_enum AS ENUM (
    'call',
    'note',
    'follow_up',
    'status_change',
    'email',
    'visit'
);


--
-- Name: leads_source_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.leads_source_enum AS ENUM (
    'walk_in',
    'website',
    'referral',
    'other'
);


--
-- Name: leads_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.leads_status_enum AS ENUM (
    'new',
    'contacted',
    'interested',
    'test_scheduled',
    'enrolled',
    'lost'
);


--
-- Name: leave_requests_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.leave_requests_status_enum AS ENUM (
    'pending',
    'approved',
    'rejected',
    'cancelled'
);


--
-- Name: leave_requests_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.leave_requests_type_enum AS ENUM (
    'annual',
    'sick',
    'emergency',
    'unpaid',
    'other'
);


--
-- Name: lms_lessons_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.lms_lessons_type_enum AS ENUM (
    'content',
    'video',
    'audio',
    'interactive'
);


--
-- Name: lms_resources_access_control_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.lms_resources_access_control_enum AS ENUM (
    'enrolled',
    'public',
    'restricted'
);


--
-- Name: lms_resources_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.lms_resources_type_enum AS ENUM (
    'file',
    'video',
    'audio',
    'link',
    'pdf'
);


--
-- Name: notification_preferences_channel_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.notification_preferences_channel_enum AS ENUM (
    'in_app',
    'email'
);


--
-- Name: payments_method_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payments_method_enum AS ENUM (
    'cash',
    'bank_transfer',
    'easykash',
    'other'
);


--
-- Name: payments_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payments_status_enum AS ENUM (
    'pending',
    'completed',
    'failed',
    'refunded'
);


--
-- Name: payroll_entries_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payroll_entries_status_enum AS ENUM (
    'draft',
    'approved',
    'paid',
    'disputed'
);


--
-- Name: payroll_periods_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payroll_periods_status_enum AS ENUM (
    'open',
    'processing',
    'closed',
    'exported'
);


--
-- Name: placement_tests_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.placement_tests_status_enum AS ENUM (
    'scheduled',
    'in_progress',
    'completed',
    'no_show',
    'cancelled'
);


--
-- Name: promo_codes_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.promo_codes_type_enum AS ENUM (
    'percentage',
    'fixed_amount'
);


--
-- Name: quiz_attempts_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.quiz_attempts_status_enum AS ENUM (
    'in_progress',
    'submitted',
    'graded',
    'abandoned'
);


--
-- Name: quiz_questions_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.quiz_questions_type_enum AS ENUM (
    'mcq',
    'fill_blank',
    'matching',
    'true_false',
    'ordering',
    'short_answer'
);


--
-- Name: quizzes_release_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.quizzes_release_type_enum AS ENUM (
    'instant',
    'after_review',
    'scheduled'
);


--
-- Name: refunds_reason_code_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.refunds_reason_code_enum AS ENUM (
    'course_cancellation',
    'student_withdrawal',
    'duplicate_payment',
    'error',
    'other'
);


--
-- Name: refunds_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.refunds_status_enum AS ENUM (
    'pending',
    'approved',
    'processed',
    'rejected'
);


--
-- Name: sessions_mode_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.sessions_mode_enum AS ENUM (
    'in_person',
    'online',
    'hybrid'
);


--
-- Name: stock_moves_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.stock_moves_type_enum AS ENUM (
    'in',
    'out',
    'adjustment',
    'return',
    'transfer_in',
    'transfer_out'
);


--
-- Name: student_item_issues_condition_on_return_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.student_item_issues_condition_on_return_enum AS ENUM (
    'good',
    'damaged',
    'lost'
);


--
-- Name: students_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.students_status_enum AS ENUM (
    'active',
    'inactive',
    'graduated',
    'dropped',
    'suspended'
);


--
-- Name: submissions_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.submissions_status_enum AS ENUM (
    'submitted',
    'graded',
    'returned',
    'resubmitted'
);


--
-- Name: test_questions_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.test_questions_type_enum AS ENUM (
    'mcq',
    'fill_blank',
    'matching',
    'true_false',
    'ordering',
    'short_answer'
);


--
-- Name: test_slots_mode_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.test_slots_mode_enum AS ENUM (
    'in_person',
    'online',
    'hybrid'
);


--
-- Name: test_slots_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.test_slots_status_enum AS ENUM (
    'open',
    'full',
    'cancelled',
    'completed'
);


--
-- Name: testimonials_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.testimonials_status_enum AS ENUM (
    'pending',
    'approved',
    'rejected'
);


--
-- Name: users_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.users_status_enum AS ENUM (
    'active',
    'inactive',
    'suspended',
    'pending'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activities (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    type public.activities_type_enum NOT NULL,
    date date NOT NULL,
    start_time time without time zone,
    end_time time without time zone,
    location character varying(255),
    branch_id uuid NOT NULL,
    capacity integer NOT NULL,
    fee numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    target_levels jsonb,
    target_groups jsonb,
    is_open_to_all boolean DEFAULT false NOT NULL,
    status public.activities_status_enum DEFAULT 'upcoming'::public.activities_status_enum NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: activity_photos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activity_photos (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    activity_id uuid NOT NULL,
    file_url character varying(500) NOT NULL,
    caption character varying(255),
    uploaded_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: activity_registrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activity_registrations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    activity_id uuid NOT NULL,
    student_id uuid NOT NULL,
    registered_at timestamp with time zone DEFAULT now() NOT NULL,
    status public.activity_registrations_status_enum DEFAULT 'registered'::public.activity_registrations_status_enum NOT NULL,
    paid_amount numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    payment_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assignments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    group_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    type public.assignments_type_enum DEFAULT 'file_upload'::public.assignments_type_enum NOT NULL,
    due_at timestamp with time zone NOT NULL,
    max_grade numeric(5,2) DEFAULT '100'::numeric NOT NULL,
    allow_late_submission boolean DEFAULT false NOT NULL,
    late_penalty_percent integer DEFAULT 0 NOT NULL,
    is_published boolean DEFAULT false NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: attendances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendances (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    session_id uuid NOT NULL,
    student_id uuid NOT NULL,
    status public.attendances_status_enum NOT NULL,
    check_in_method public.attendances_check_in_method_enum DEFAULT 'manual'::public.attendances_check_in_method_enum NOT NULL,
    check_in_time timestamp with time zone,
    minutes_late integer DEFAULT 0 NOT NULL,
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    actor_id uuid,
    actor_type public.audit_logs_actor_type_enum DEFAULT 'user'::public.audit_logs_actor_type_enum NOT NULL,
    action character varying(100) NOT NULL,
    module character varying(50) NOT NULL,
    target_type character varying(50) NOT NULL,
    target_id uuid,
    before_state jsonb,
    after_state jsonb,
    description text,
    ip_address character varying(45),
    user_agent text,
    session_id character varying(100),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: blog_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blog_posts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying(255) NOT NULL,
    slug character varying(255),
    content text NOT NULL,
    excerpt character varying(500),
    featured_image character varying(500),
    meta_title character varying(255),
    meta_description character varying(500),
    status public.blog_posts_status_enum DEFAULT 'draft'::public.blog_posts_status_enum NOT NULL,
    published_at timestamp with time zone,
    author_id uuid,
    view_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: branches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.branches (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(150) NOT NULL,
    address text NOT NULL,
    phone character varying(20) NOT NULL,
    email character varying(255),
    manager_id uuid,
    classroom_count integer DEFAULT 0 NOT NULL,
    logo_url character varying(500),
    status public.branches_status_enum DEFAULT 'active'::public.branches_status_enum NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: certificate_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.certificate_templates (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(150) NOT NULL,
    course_id uuid,
    html_template text NOT NULL,
    placeholders jsonb NOT NULL,
    background_url character varying(500),
    is_default boolean DEFAULT false NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: certificates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.certificates (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    student_id uuid NOT NULL,
    course_id uuid NOT NULL,
    group_id uuid NOT NULL,
    template_id uuid,
    code character varying(100) NOT NULL,
    pdf_url character varying(500),
    issue_date date NOT NULL,
    expiry_date date,
    status public.certificates_status_enum DEFAULT 'active'::public.certificates_status_enum NOT NULL,
    revoked_at timestamp with time zone,
    revoke_reason text,
    issued_by uuid,
    is_auto_issued boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: chat_consents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_consents (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    accepted_at timestamp with time zone NOT NULL,
    policy_version character varying(20) DEFAULT '1.0'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_messages (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    room_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    body text,
    type public.chat_messages_type_enum DEFAULT 'text'::public.chat_messages_type_enum NOT NULL,
    file_url character varying(500),
    file_size bigint,
    file_name character varying(255),
    reply_to_id uuid,
    edited_at timestamp with time zone,
    edited_count integer DEFAULT 0 NOT NULL,
    deleted_at timestamp with time zone,
    is_flagged boolean DEFAULT false NOT NULL,
    flag_reason character varying(100),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: chat_room_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_room_members (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    room_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role character varying(20) DEFAULT 'member'::character varying NOT NULL,
    joined_at timestamp with time zone DEFAULT now() NOT NULL,
    last_read_at timestamp with time zone,
    is_muted boolean DEFAULT false NOT NULL,
    muted_until timestamp with time zone,
    is_banned boolean DEFAULT false NOT NULL,
    banned_until timestamp with time zone,
    ban_reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: chat_rooms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_rooms (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    type public.chat_rooms_type_enum NOT NULL,
    group_id uuid,
    name character varying(150),
    topic character varying(255),
    is_archived boolean DEFAULT false NOT NULL,
    archived_at timestamp with time zone,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: chat_strikes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_strikes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    violation_id uuid NOT NULL,
    strike_number integer NOT NULL,
    action public.chat_strikes_action_enum NOT NULL,
    expires_at timestamp with time zone,
    applied_by uuid,
    applied_at timestamp with time zone DEFAULT now() NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: chat_violations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_violations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    message_id uuid,
    room_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    rule_matched character varying(100) NOT NULL,
    original_message text NOT NULL,
    action_taken public.chat_violations_action_taken_enum NOT NULL,
    moderator_id uuid,
    moderator_note text,
    resolved_at timestamp with time zone,
    is_false_positive boolean DEFAULT false NOT NULL,
    detection_method character varying(50) DEFAULT 'text_regex'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: classrooms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.classrooms (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    branch_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    capacity integer DEFAULT 20 NOT NULL,
    type character varying(20) DEFAULT 'standard'::character varying NOT NULL,
    status public.classrooms_status_enum DEFAULT 'active'::public.classrooms_status_enum NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: courses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.courses (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(200) NOT NULL,
    code character varying(50),
    level character varying(10) NOT NULL,
    duration_hours integer NOT NULL,
    syllabus text,
    description text,
    default_price numeric(10,2) NOT NULL,
    min_age integer,
    max_age integer,
    status public.courses_status_enum DEFAULT 'active'::public.courses_status_enum NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: employee_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_documents (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    employee_id uuid NOT NULL,
    name character varying(200) NOT NULL,
    file_url character varying(500) NOT NULL,
    document_type public.employee_documents_document_type_enum NOT NULL,
    expiry_date date,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: employees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employees (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    employee_number character varying(50),
    employee_type public.employees_employee_type_enum NOT NULL,
    department character varying(100),
    job_title character varying(100) NOT NULL,
    contract_start date NOT NULL,
    contract_end date,
    salary numeric(12,2),
    hourly_rate numeric(10,2),
    currency character varying(3) DEFAULT 'EGP'::character varying NOT NULL,
    bank_account character varying(100),
    bank_name character varying(100),
    status public.employees_status_enum DEFAULT 'active'::public.employees_status_enum NOT NULL,
    termination_date date,
    termination_reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: enrollments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.enrollments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    student_id uuid NOT NULL,
    group_id uuid NOT NULL,
    status public.enrollments_status_enum DEFAULT 'pending'::public.enrollments_status_enum NOT NULL,
    total_fee numeric(12,2) NOT NULL,
    discount_amount numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    final_amount numeric(12,2) NOT NULL,
    promo_code_id uuid,
    enrolled_at timestamp with time zone DEFAULT now() NOT NULL,
    enrolled_by uuid,
    dropped_at timestamp with time zone,
    drop_reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: financial_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.financial_transactions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    branch_id uuid,
    invoice_id uuid,
    payment_id uuid,
    refund_id uuid,
    transaction_type public.financial_transactions_transaction_type_enum NOT NULL,
    direction public.financial_transactions_direction_enum NOT NULL,
    amount numeric(12,2) NOT NULL,
    transaction_date timestamp with time zone DEFAULT now() NOT NULL,
    description text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: follow_ups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.follow_ups (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    lead_id uuid NOT NULL,
    assigned_to uuid NOT NULL,
    due_date timestamp with time zone NOT NULL,
    status public.follow_ups_status_enum DEFAULT 'pending'::public.follow_ups_status_enum NOT NULL,
    note text,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: gradebook_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gradebook_categories (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    group_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    weight numeric(5,2) NOT NULL,
    "order" integer NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: gradebook_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gradebook_entries (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    group_id uuid NOT NULL,
    student_id uuid NOT NULL,
    category_id uuid NOT NULL,
    score numeric(5,2) NOT NULL,
    max_score numeric(5,2) NOT NULL,
    percentage numeric(5,2) NOT NULL,
    weighted_score numeric(5,2) NOT NULL,
    reference_type character varying(50),
    reference_id uuid,
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: group_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.group_schedules (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    group_id uuid NOT NULL,
    day_of_week integer NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    classroom_id uuid,
    is_recurring boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: group_students; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.group_students (
    group_id uuid NOT NULL,
    student_id uuid NOT NULL,
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    enrolled_at timestamp with time zone DEFAULT now() NOT NULL,
    enrolled_by uuid,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    dropped_at timestamp with time zone,
    drop_reason text
);


--
-- Name: groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.groups (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(150) NOT NULL,
    course_id uuid NOT NULL,
    teacher_id uuid NOT NULL,
    substitute_teacher_id uuid,
    branch_id uuid NOT NULL,
    capacity integer NOT NULL,
    mode public.groups_mode_enum DEFAULT 'in_person'::public.groups_mode_enum NOT NULL,
    zoom_meeting_id character varying(100),
    zoom_link character varying(500),
    onmeet_link character varying(500),
    onmeet_meeting_id character varying(100),
    start_date date NOT NULL,
    end_date date NOT NULL,
    status public.groups_status_enum DEFAULT 'upcoming'::public.groups_status_enum NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: installments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.installments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    invoice_id uuid NOT NULL,
    installment_number integer NOT NULL,
    amount numeric(12,2) NOT NULL,
    due_date date NOT NULL,
    paid_amount numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    paid_at timestamp with time zone,
    status public.installments_status_enum DEFAULT 'pending'::public.installments_status_enum NOT NULL,
    reminder_sent_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: inventory_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    sku character varying(50),
    name character varying(200) NOT NULL,
    description text,
    category public.inventory_items_category_enum NOT NULL,
    unit_cost numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    sale_price numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    unit_of_measure character varying(20) DEFAULT 'piece'::character varying NOT NULL,
    reorder_level integer DEFAULT 10 NOT NULL,
    status public.inventory_items_status_enum DEFAULT 'active'::public.inventory_items_status_enum NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: invoice_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoice_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    invoice_id uuid NOT NULL,
    item_type public.invoice_items_item_type_enum NOT NULL,
    course_id uuid,
    description character varying(255) NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    unit_price numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    discount_amount numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    tax_amount numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    total_amount numeric(12,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    invoice_number character varying(50) NOT NULL,
    enrollment_id uuid NOT NULL,
    student_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    subtotal numeric(12,2) NOT NULL,
    discount_amount numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    tax_amount numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    total_amount numeric(12,2) NOT NULL,
    paid_amount numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    balance_due numeric(12,2) NOT NULL,
    status public.invoices_status_enum DEFAULT 'unpaid'::public.invoices_status_enum NOT NULL,
    due_date date NOT NULL,
    notes text,
    is_e_invoice boolean DEFAULT false NOT NULL,
    e_invoice_reference character varying(100),
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: kb_article_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kb_article_versions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    article_id uuid NOT NULL,
    body text NOT NULL,
    version_number integer NOT NULL,
    change_note character varying(255),
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: kb_articles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kb_articles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    category_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    slug character varying(255),
    body text NOT NULL,
    excerpt character varying(500),
    tags jsonb,
    version integer DEFAULT 1 NOT NULL,
    visibility public.kb_articles_visibility_enum DEFAULT 'staff'::public.kb_articles_visibility_enum NOT NULL,
    is_pinned boolean DEFAULT false NOT NULL,
    view_count integer DEFAULT 0 NOT NULL,
    created_by uuid,
    updated_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: kb_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kb_categories (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(150) NOT NULL,
    slug character varying(150),
    description text,
    parent_id uuid,
    visibility public.kb_categories_visibility_enum DEFAULT 'staff'::public.kb_categories_visibility_enum NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: lead_activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lead_activities (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    lead_id uuid NOT NULL,
    type public.lead_activities_type_enum NOT NULL,
    note text,
    old_status character varying(50),
    new_status character varying(50),
    scheduled_at timestamp with time zone,
    completed_at timestamp with time zone,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: lead_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lead_tags (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(50) NOT NULL,
    color character varying(7) DEFAULT '#000000'::character varying NOT NULL,
    branch_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leads (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    phone character varying(20) NOT NULL,
    email character varying(255),
    national_id character varying(50),
    source public.leads_source_enum NOT NULL,
    status public.leads_status_enum DEFAULT 'new'::public.leads_status_enum NOT NULL,
    level_interest character varying(10),
    notes text,
    assigned_to uuid,
    branch_id uuid,
    converted_to_student_id uuid,
    converted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: leave_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leave_requests (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    employee_id uuid NOT NULL,
    type public.leave_requests_type_enum NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    days_count integer NOT NULL,
    reason text,
    attachment_url character varying(500),
    status public.leave_requests_status_enum DEFAULT 'pending'::public.leave_requests_status_enum NOT NULL,
    approved_by uuid,
    approved_at timestamp with time zone,
    approval_note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: lms_lessons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lms_lessons (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    module_id uuid NOT NULL,
    name character varying(200) NOT NULL,
    content text,
    type public.lms_lessons_type_enum DEFAULT 'content'::public.lms_lessons_type_enum NOT NULL,
    duration_minutes integer,
    "order" integer NOT NULL,
    is_published boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: lms_modules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lms_modules (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    group_id uuid NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    "order" integer NOT NULL,
    is_published boolean DEFAULT false NOT NULL,
    published_at timestamp with time zone,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: lms_resources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lms_resources (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    lesson_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    type public.lms_resources_type_enum NOT NULL,
    file_url character varying(500),
    file_size bigint,
    mime_type character varying(100),
    external_url character varying(500),
    access_control public.lms_resources_access_control_enum DEFAULT 'enrolled'::public.lms_resources_access_control_enum NOT NULL,
    download_count integer DEFAULT 0 NOT NULL,
    watermark_text character varying(100),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    "timestamp" bigint NOT NULL,
    name character varying NOT NULL
);


--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: notification_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_preferences (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    channel public.notification_preferences_channel_enum NOT NULL,
    module character varying(50) NOT NULL,
    event character varying(50) NOT NULL,
    is_enabled boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    type character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    body text NOT NULL,
    data jsonb,
    action_url character varying(500),
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    invoice_id uuid NOT NULL,
    amount numeric(12,2) NOT NULL,
    method public.payments_method_enum NOT NULL,
    reference character varying(255),
    easykash_transaction_id character varying(100),
    easykash_payload jsonb,
    paid_at timestamp with time zone NOT NULL,
    recorded_by uuid,
    status public.payments_status_enum DEFAULT 'completed'::public.payments_status_enum NOT NULL,
    receipt_number character varying(50),
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: payroll_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payroll_entries (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    payroll_period_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    base_amount numeric(12,2) NOT NULL,
    hours_worked numeric(5,2) DEFAULT '0'::numeric NOT NULL,
    classes_taught integer DEFAULT 0 NOT NULL,
    bonus numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    deductions numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    hourly_rate numeric(10,2),
    total_amount numeric(12,2) NOT NULL,
    status public.payroll_entries_status_enum DEFAULT 'draft'::public.payroll_entries_status_enum NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: payroll_periods; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payroll_periods (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    status public.payroll_periods_status_enum DEFAULT 'open'::public.payroll_periods_status_enum NOT NULL,
    closed_at timestamp with time zone,
    closed_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    module character varying(50) NOT NULL,
    action character varying(50) NOT NULL,
    description character varying(255),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: placement_test_answers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.placement_test_answers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    test_id uuid NOT NULL,
    question_id uuid NOT NULL,
    answer jsonb NOT NULL,
    score numeric(5,2) DEFAULT '0'::numeric NOT NULL,
    is_correct boolean,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: placement_test_papers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.placement_test_papers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    test_id uuid NOT NULL,
    level character varying(10) NOT NULL,
    question_ids jsonb NOT NULL,
    generated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: placement_tests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.placement_tests (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    lead_id uuid,
    student_id uuid,
    slot_id uuid NOT NULL,
    examiner_id uuid NOT NULL,
    scheduled_at timestamp with time zone NOT NULL,
    written_score numeric(5,2),
    written_max numeric(5,2) DEFAULT '100'::numeric NOT NULL,
    oral_score numeric(5,2),
    oral_max numeric(5,2) DEFAULT '100'::numeric NOT NULL,
    suggested_level character varying(10),
    final_level character varying(10),
    override_reason text,
    examiner_notes text,
    status public.placement_tests_status_enum DEFAULT 'scheduled'::public.placement_tests_status_enum NOT NULL,
    result_sent_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: promo_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.promo_codes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code character varying(50) NOT NULL,
    type public.promo_codes_type_enum NOT NULL,
    value numeric(10,2) NOT NULL,
    max_discount numeric(10,2),
    expiry_date date NOT NULL,
    usage_limit integer,
    used_count integer DEFAULT 0 NOT NULL,
    applicable_courses jsonb,
    applicable_branches jsonb,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: quiz_attempts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quiz_attempts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    quiz_id uuid NOT NULL,
    student_id uuid NOT NULL,
    attempt_number integer NOT NULL,
    answers jsonb NOT NULL,
    score numeric(5,2),
    percentage numeric(5,2),
    is_passed boolean,
    started_at timestamp with time zone NOT NULL,
    submitted_at timestamp with time zone,
    time_spent_seconds integer,
    status public.quiz_attempts_status_enum DEFAULT 'in_progress'::public.quiz_attempts_status_enum NOT NULL,
    graded_by uuid,
    graded_at timestamp with time zone,
    ip_address character varying(45),
    user_agent text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: quiz_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quiz_questions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    quiz_id uuid NOT NULL,
    bank_question_id uuid,
    question_text text NOT NULL,
    type public.quiz_questions_type_enum NOT NULL,
    options jsonb,
    correct_answer jsonb NOT NULL,
    points integer DEFAULT 1 NOT NULL,
    "order" integer NOT NULL,
    media_url character varying(500),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: quizzes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quizzes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    group_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    time_limit_minutes integer,
    max_attempts integer DEFAULT 1 NOT NULL,
    shuffle_questions boolean DEFAULT false NOT NULL,
    shuffle_options boolean DEFAULT false NOT NULL,
    release_type public.quizzes_release_type_enum DEFAULT 'instant'::public.quizzes_release_type_enum NOT NULL,
    release_at timestamp with time zone,
    passing_score numeric(5,2) DEFAULT '60'::numeric NOT NULL,
    is_published boolean DEFAULT false NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: refunds; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refunds (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    payment_id uuid NOT NULL,
    invoice_id uuid NOT NULL,
    amount numeric(12,2) NOT NULL,
    reason_code public.refunds_reason_code_enum NOT NULL,
    reason_note text,
    status public.refunds_status_enum DEFAULT 'pending'::public.refunds_status_enum NOT NULL,
    approved_by uuid,
    approved_at timestamp with time zone,
    processed_by uuid,
    processed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    role_id uuid NOT NULL,
    permission_id uuid NOT NULL
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(100) NOT NULL,
    description text,
    is_custom boolean DEFAULT false NOT NULL,
    is_system boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: sales_targets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales_targets (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    agent_id uuid NOT NULL,
    month integer NOT NULL,
    year integer NOT NULL,
    target_amount numeric(12,2) NOT NULL,
    target_conversions integer DEFAULT 0 NOT NULL,
    achieved_amount numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    achieved_conversions integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    group_id uuid NOT NULL,
    date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    classroom_id uuid,
    mode public.sessions_mode_enum NOT NULL,
    zoom_meeting_id character varying(100),
    zoom_join_url character varying(500),
    onmeet_meeting_id character varying(100),
    recording_url character varying(500),
    topic character varying(255),
    notes text,
    attendance_locked boolean DEFAULT false NOT NULL,
    cancelled_at timestamp with time zone,
    cancellation_reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    onmeet_join_url character varying(500)
);


--
-- Name: settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.settings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    key character varying(100) NOT NULL,
    value text,
    "group" character varying(50) DEFAULT 'general'::character varying NOT NULL,
    is_encrypted boolean DEFAULT false NOT NULL,
    description character varying(255),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: stock_levels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_levels (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    item_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    quantity integer DEFAULT 0 NOT NULL,
    reserved_quantity integer DEFAULT 0 NOT NULL,
    last_counted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: stock_moves; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_moves (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    item_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    type public.stock_moves_type_enum NOT NULL,
    quantity integer NOT NULL,
    unit_cost numeric(10,2),
    reason character varying(255) NOT NULL,
    reference_type character varying(50),
    reference_id uuid,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: student_item_issues; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_item_issues (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    student_id uuid NOT NULL,
    item_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    cost numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    issued_at timestamp with time zone DEFAULT now() NOT NULL,
    returned_at timestamp with time zone,
    condition_on_return public.student_item_issues_condition_on_return_enum,
    created_by uuid
);


--
-- Name: student_level_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_level_history (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    student_id uuid NOT NULL,
    old_level character varying(10) NOT NULL,
    new_level character varying(10) NOT NULL,
    reason character varying(50) NOT NULL,
    reference_id uuid,
    changed_by uuid,
    changed_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: student_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_profiles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    student_id uuid NOT NULL,
    photo_url character varying(500),
    date_of_birth date,
    gender character varying(10),
    address text,
    national_id character varying(50),
    education_level character varying(100),
    emergency_contact_name character varying(150),
    emergency_contact_phone character varying(20),
    emergency_contact_relation character varying(50),
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: student_surveys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_surveys (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    group_id uuid NOT NULL,
    student_id uuid NOT NULL,
    teacher_id uuid NOT NULL,
    term character varying(50) NOT NULL,
    responses jsonb NOT NULL,
    overall_rating integer,
    comment text,
    is_anonymous boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: students; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.students (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    student_number character varying(50) NOT NULL,
    current_level character varying(10),
    status public.students_status_enum DEFAULT 'active'::public.students_status_enum NOT NULL,
    enrollment_date date,
    branch_id uuid,
    placement_test_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.submissions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    assignment_id uuid NOT NULL,
    student_id uuid NOT NULL,
    content text,
    file_url character varying(500),
    file_name character varying(255),
    submitted_at timestamp with time zone DEFAULT now() NOT NULL,
    is_late boolean DEFAULT false NOT NULL,
    grade numeric(5,2),
    feedback text,
    graded_by uuid,
    graded_at timestamp with time zone,
    status public.submissions_status_enum DEFAULT 'submitted'::public.submissions_status_enum NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: teacher_availabilities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teacher_availabilities (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    employee_id uuid NOT NULL,
    day_of_week integer NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    is_available boolean DEFAULT true NOT NULL,
    note character varying(255),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: teacher_evaluations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teacher_evaluations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    group_id uuid NOT NULL,
    student_id uuid NOT NULL,
    teacher_id uuid NOT NULL,
    term character varying(50) NOT NULL,
    form_data jsonb NOT NULL,
    overall_comment text,
    is_shared_with_student boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: test_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.test_questions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    question_text text NOT NULL,
    type public.test_questions_type_enum NOT NULL,
    options jsonb,
    correct_answer jsonb NOT NULL,
    explanation text,
    level character varying(10) NOT NULL,
    category character varying(50),
    points integer DEFAULT 1 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: test_slots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.test_slots (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    branch_id uuid NOT NULL,
    examiner_id uuid NOT NULL,
    date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    mode public.test_slots_mode_enum DEFAULT 'in_person'::public.test_slots_mode_enum NOT NULL,
    capacity integer DEFAULT 1 NOT NULL,
    booked_count integer DEFAULT 0 NOT NULL,
    status public.test_slots_status_enum DEFAULT 'open'::public.test_slots_status_enum NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: testimonials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.testimonials (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    student_id uuid,
    name character varying(150) NOT NULL,
    content text NOT NULL,
    photo_url character varying(500),
    rating integer DEFAULT 5 NOT NULL,
    course_name character varying(100),
    is_featured boolean DEFAULT false NOT NULL,
    status public.testimonials_status_enum DEFAULT 'pending'::public.testimonials_status_enum NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    user_id uuid NOT NULL,
    role_id uuid NOT NULL,
    assigned_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(20),
    password_hash character varying(255) NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    avatar_url character varying(500),
    language character varying(5) DEFAULT 'ar'::character varying NOT NULL,
    branch_id uuid,
    status public.users_status_enum DEFAULT 'active'::public.users_status_enum NOT NULL,
    email_verified_at timestamp with time zone,
    phone_verified_at timestamp with time zone,
    two_factor_enabled boolean DEFAULT false NOT NULL,
    two_factor_secret character varying(255),
    last_login_at timestamp with time zone,
    last_login_ip character varying(45),
    chat_policy_accepted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: waitlists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.waitlists (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    student_id uuid NOT NULL,
    course_id uuid NOT NULL,
    level character varying(10) NOT NULL,
    branch_id uuid,
    priority integer DEFAULT 0 NOT NULL,
    status character varying(20) DEFAULT 'waiting'::character varying NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    enrolled_at timestamp with time zone
);


--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Data for Name: activities; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.activities (id, name, description, type, date, start_time, end_time, location, branch_id, capacity, fee, target_levels, target_groups, is_open_to_all, status, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: activity_photos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.activity_photos (id, activity_id, file_url, caption, uploaded_by, created_at) FROM stdin;
\.


--
-- Data for Name: activity_registrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.activity_registrations (id, activity_id, student_id, registered_at, status, paid_amount, payment_id, created_at) FROM stdin;
\.


--
-- Data for Name: assignments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.assignments (id, group_id, title, description, type, due_at, max_grade, allow_late_submission, late_penalty_percent, is_published, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: attendances; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.attendances (id, session_id, student_id, status, check_in_method, check_in_time, minutes_late, notes, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, actor_id, actor_type, action, module, target_type, target_id, before_state, after_state, description, ip_address, user_agent, session_id, created_at) FROM stdin;
\.


--
-- Data for Name: blog_posts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.blog_posts (id, title, slug, content, excerpt, featured_image, meta_title, meta_description, status, published_at, author_id, view_count, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: branches; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.branches (id, name, address, phone, email, manager_id, classroom_count, logo_url, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: certificate_templates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.certificate_templates (id, name, course_id, html_template, placeholders, background_url, is_default, status, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: certificates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.certificates (id, student_id, course_id, group_id, template_id, code, pdf_url, issue_date, expiry_date, status, revoked_at, revoke_reason, issued_by, is_auto_issued, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: chat_consents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chat_consents (id, user_id, accepted_at, policy_version, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chat_messages (id, room_id, sender_id, body, type, file_url, file_size, file_name, reply_to_id, edited_at, edited_count, deleted_at, is_flagged, flag_reason, created_at) FROM stdin;
\.


--
-- Data for Name: chat_room_members; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chat_room_members (id, room_id, user_id, role, joined_at, last_read_at, is_muted, muted_until, is_banned, banned_until, ban_reason, created_at) FROM stdin;
\.


--
-- Data for Name: chat_rooms; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chat_rooms (id, type, group_id, name, topic, is_archived, archived_at, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: chat_strikes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chat_strikes (id, user_id, violation_id, strike_number, action, expires_at, applied_by, applied_at, is_active) FROM stdin;
\.


--
-- Data for Name: chat_violations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chat_violations (id, message_id, room_id, sender_id, rule_matched, original_message, action_taken, moderator_id, moderator_note, resolved_at, is_false_positive, detection_method, created_at) FROM stdin;
\.


--
-- Data for Name: classrooms; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.classrooms (id, branch_id, name, capacity, type, status, created_at) FROM stdin;
\.


--
-- Data for Name: courses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.courses (id, name, code, level, duration_hours, syllabus, description, default_price, min_age, max_age, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: employee_documents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.employee_documents (id, employee_id, name, file_url, document_type, expiry_date, created_at) FROM stdin;
\.


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.employees (id, user_id, employee_number, employee_type, department, job_title, contract_start, contract_end, salary, hourly_rate, currency, bank_account, bank_name, status, termination_date, termination_reason, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: enrollments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.enrollments (id, student_id, group_id, status, total_fee, discount_amount, final_amount, promo_code_id, enrolled_at, enrolled_by, dropped_at, drop_reason, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: financial_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.financial_transactions (id, branch_id, invoice_id, payment_id, refund_id, transaction_type, direction, amount, transaction_date, description, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: follow_ups; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.follow_ups (id, lead_id, assigned_to, due_date, status, note, completed_at, created_at) FROM stdin;
\.


--
-- Data for Name: gradebook_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.gradebook_categories (id, group_id, name, weight, "order", created_by, created_at) FROM stdin;
\.


--
-- Data for Name: gradebook_entries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.gradebook_entries (id, group_id, student_id, category_id, score, max_score, percentage, weighted_score, reference_type, reference_id, notes, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: group_schedules; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.group_schedules (id, group_id, day_of_week, start_time, end_time, classroom_id, is_recurring, created_at) FROM stdin;
\.


--
-- Data for Name: group_students; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.group_students (group_id, student_id, id, enrolled_at, enrolled_by, status, dropped_at, drop_reason) FROM stdin;
\.


--
-- Data for Name: groups; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.groups (id, name, course_id, teacher_id, substitute_teacher_id, branch_id, capacity, mode, zoom_meeting_id, zoom_link, onmeet_link, onmeet_meeting_id, start_date, end_date, status, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: installments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.installments (id, invoice_id, installment_number, amount, due_date, paid_amount, paid_at, status, reminder_sent_at, created_at) FROM stdin;
\.


--
-- Data for Name: inventory_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inventory_items (id, sku, name, description, category, unit_cost, sale_price, unit_of_measure, reorder_level, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: invoice_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.invoice_items (id, invoice_id, item_type, course_id, description, quantity, unit_price, discount_amount, tax_amount, total_amount, created_at) FROM stdin;
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.invoices (id, invoice_number, enrollment_id, student_id, branch_id, subtotal, discount_amount, tax_amount, total_amount, paid_amount, balance_due, status, due_date, notes, is_e_invoice, e_invoice_reference, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: kb_article_versions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.kb_article_versions (id, article_id, body, version_number, change_note, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: kb_articles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.kb_articles (id, category_id, title, slug, body, excerpt, tags, version, visibility, is_pinned, view_count, created_by, updated_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: kb_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.kb_categories (id, name, slug, description, parent_id, visibility, sort_order, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: lead_activities; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.lead_activities (id, lead_id, type, note, old_status, new_status, scheduled_at, completed_at, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: lead_tags; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.lead_tags (id, name, color, branch_id, created_at) FROM stdin;
\.


--
-- Data for Name: leads; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.leads (id, first_name, last_name, phone, email, national_id, source, status, level_interest, notes, assigned_to, branch_id, converted_to_student_id, converted_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: leave_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.leave_requests (id, employee_id, type, start_date, end_date, days_count, reason, attachment_url, status, approved_by, approved_at, approval_note, created_at) FROM stdin;
\.


--
-- Data for Name: lms_lessons; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.lms_lessons (id, module_id, name, content, type, duration_minutes, "order", is_published, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: lms_modules; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.lms_modules (id, group_id, name, description, "order", is_published, published_at, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: lms_resources; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.lms_resources (id, lesson_id, name, type, file_url, file_size, mime_type, external_url, access_control, download_count, watermark_text, created_at) FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.migrations (id, "timestamp", name) FROM stdin;
1	1727600000000	CreateChatConsents1727600000000
2	1786965613141	InitialSchema1786965613141
3	1789000000000	CreateChatTables1789000000000
4	1789923250288	Stage3Check1789923250288
5	1790000000000	AddSessionOnmeetJoinUrl1790000000000
6	1790000000000	AddPlacementTestPapers1790000000000
7	1790000001000	AuditLogTargetIdNullable1790000001000
\.


--
-- Data for Name: notification_preferences; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notification_preferences (id, user_id, channel, module, event, is_enabled, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, user_id, type, title, body, data, action_url, read_at, created_at) FROM stdin;
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payments (id, invoice_id, amount, method, reference, easykash_transaction_id, easykash_payload, paid_at, recorded_by, status, receipt_number, notes, created_at) FROM stdin;
\.


--
-- Data for Name: payroll_entries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payroll_entries (id, payroll_period_id, employee_id, base_amount, hours_worked, classes_taught, bonus, deductions, hourly_rate, total_amount, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: payroll_periods; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payroll_periods (id, name, start_date, end_date, status, closed_at, closed_by, created_at) FROM stdin;
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.permissions (id, module, action, description, created_at) FROM stdin;
\.


--
-- Data for Name: placement_test_answers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.placement_test_answers (id, test_id, question_id, answer, score, is_correct, created_at) FROM stdin;
\.


--
-- Data for Name: placement_test_papers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.placement_test_papers (id, test_id, level, question_ids, generated_at) FROM stdin;
\.


--
-- Data for Name: placement_tests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.placement_tests (id, lead_id, student_id, slot_id, examiner_id, scheduled_at, written_score, written_max, oral_score, oral_max, suggested_level, final_level, override_reason, examiner_notes, status, result_sent_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: promo_codes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.promo_codes (id, code, type, value, max_discount, expiry_date, usage_limit, used_count, applicable_courses, applicable_branches, status, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: quiz_attempts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quiz_attempts (id, quiz_id, student_id, attempt_number, answers, score, percentage, is_passed, started_at, submitted_at, time_spent_seconds, status, graded_by, graded_at, ip_address, user_agent, created_at) FROM stdin;
\.


--
-- Data for Name: quiz_questions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quiz_questions (id, quiz_id, bank_question_id, question_text, type, options, correct_answer, points, "order", media_url, created_at) FROM stdin;
\.


--
-- Data for Name: quizzes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quizzes (id, group_id, title, description, time_limit_minutes, max_attempts, shuffle_questions, shuffle_options, release_type, release_at, passing_score, is_published, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: refunds; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.refunds (id, payment_id, invoice_id, amount, reason_code, reason_note, status, approved_by, approved_at, processed_by, processed_at, created_at) FROM stdin;
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.role_permissions (role_id, permission_id) FROM stdin;
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.roles (id, name, slug, description, is_custom, is_system, created_at) FROM stdin;
\.


--
-- Data for Name: sales_targets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sales_targets (id, agent_id, month, year, target_amount, target_conversions, achieved_amount, achieved_conversions, created_at) FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sessions (id, group_id, date, start_time, end_time, classroom_id, mode, zoom_meeting_id, zoom_join_url, onmeet_meeting_id, recording_url, topic, notes, attendance_locked, cancelled_at, cancellation_reason, created_at, onmeet_join_url) FROM stdin;
\.


--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.settings (id, key, value, "group", is_encrypted, description, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: stock_levels; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.stock_levels (id, item_id, branch_id, quantity, reserved_quantity, last_counted_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: stock_moves; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.stock_moves (id, item_id, branch_id, type, quantity, unit_cost, reason, reference_type, reference_id, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: student_item_issues; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.student_item_issues (id, student_id, item_id, branch_id, quantity, cost, issued_at, returned_at, condition_on_return, created_by) FROM stdin;
\.


--
-- Data for Name: student_level_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.student_level_history (id, student_id, old_level, new_level, reason, reference_id, changed_by, changed_at) FROM stdin;
\.


--
-- Data for Name: student_profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.student_profiles (id, student_id, photo_url, date_of_birth, gender, address, national_id, education_level, emergency_contact_name, emergency_contact_phone, emergency_contact_relation, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: student_surveys; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.student_surveys (id, group_id, student_id, teacher_id, term, responses, overall_rating, comment, is_anonymous, created_at) FROM stdin;
\.


--
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.students (id, user_id, student_number, current_level, status, enrollment_date, branch_id, placement_test_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: submissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.submissions (id, assignment_id, student_id, content, file_url, file_name, submitted_at, is_late, grade, feedback, graded_by, graded_at, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: teacher_availabilities; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.teacher_availabilities (id, employee_id, day_of_week, start_time, end_time, is_available, note, created_at) FROM stdin;
\.


--
-- Data for Name: teacher_evaluations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.teacher_evaluations (id, group_id, student_id, teacher_id, term, form_data, overall_comment, is_shared_with_student, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: test_questions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.test_questions (id, question_text, type, options, correct_answer, explanation, level, category, points, is_active, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: test_slots; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.test_slots (id, branch_id, examiner_id, date, start_time, end_time, mode, capacity, booked_count, status, created_at) FROM stdin;
\.


--
-- Data for Name: testimonials; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.testimonials (id, student_id, name, content, photo_url, rating, course_name, is_featured, status, created_at) FROM stdin;
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_roles (user_id, role_id, assigned_by, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, phone, password_hash, first_name, last_name, avatar_url, language, branch_id, status, email_verified_at, phone_verified_at, two_factor_enabled, two_factor_secret, last_login_at, last_login_ip, chat_policy_accepted_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: waitlists; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.waitlists (id, student_id, course_id, level, branch_id, priority, status, notes, created_at, enrolled_at) FROM stdin;
\.


--
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.migrations_id_seq', 7, true);


--
-- Name: student_level_history PK_0107bd09da4247097eabe523186; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_level_history
    ADD CONSTRAINT "PK_0107bd09da4247097eabe523186" PRIMARY KEY (id);


--
-- Name: settings PK_0669fe20e252eb692bf4d344975; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT "PK_0669fe20e252eb692bf4d344975" PRIMARY KEY (id);


--
-- Name: submissions PK_10b3be95b8b2fb1e482e07d706b; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT "PK_10b3be95b8b2fb1e482e07d706b" PRIMARY KEY (id);


--
-- Name: test_questions PK_15b5ff9ab1ab5bc53162881623b; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_questions
    ADD CONSTRAINT "PK_15b5ff9ab1ab5bc53162881623b" PRIMARY KEY (id);


--
-- Name: payments PK_197ab7af18c93fbb0c9b28b4a59; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY (id);


--
-- Name: lead_activities PK_1aa1cc6988a817368568ca26bf1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_activities
    ADD CONSTRAINT "PK_1aa1cc6988a817368568ca26bf1" PRIMARY KEY (id);


--
-- Name: kb_article_versions PK_1adadce034403a3ba3e6443a217; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kb_article_versions
    ADD CONSTRAINT "PK_1adadce034403a3ba3e6443a217" PRIMARY KEY (id);


--
-- Name: audit_logs PK_1bb179d048bbc581caa3b013439; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY (id);


--
-- Name: lms_modules PK_1e8ad309147deae77c35adf5bf5; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lms_modules
    ADD CONSTRAINT "PK_1e8ad309147deae77c35adf5bf5" PRIMARY KEY (id);


--
-- Name: classrooms PK_20b7b82896c06eda27548bd0c24; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classrooms
    ADD CONSTRAINT "PK_20b7b82896c06eda27548bd0c24" PRIMARY KEY (id);


--
-- Name: user_roles PK_23ed6f04fe43066df08379fd034; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT "PK_23ed6f04fe43066df08379fd034" PRIMARY KEY (user_id, role_id);


--
-- Name: role_permissions PK_25d24010f53bb80b78e412c9656; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT "PK_25d24010f53bb80b78e412c9656" PRIMARY KEY (role_id, permission_id);


--
-- Name: stock_moves PK_27d4cab9a9996a1805d132497b7; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_moves
    ADD CONSTRAINT "PK_27d4cab9a9996a1805d132497b7" PRIMARY KEY (id);


--
-- Name: payroll_periods PK_2afd9a853dd55d80ef644b74358; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_periods
    ADD CONSTRAINT "PK_2afd9a853dd55d80ef644b74358" PRIMARY KEY (id);


--
-- Name: placement_test_answers PK_315645b28dcd20f4aeb854f9cdc; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.placement_test_answers
    ADD CONSTRAINT "PK_315645b28dcd20f4aeb854f9cdc" PRIMARY KEY (id);


--
-- Name: sales_targets PK_31edd2af8f8c70fb1d3cac863d4; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_targets
    ADD CONSTRAINT "PK_31edd2af8f8c70fb1d3cac863d4" PRIMARY KEY (id);


--
-- Name: sessions PK_3238ef96f18b355b671619111bc; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT "PK_3238ef96f18b355b671619111bc" PRIMARY KEY (id);


--
-- Name: financial_transactions PK_3f0ffe3ca2def8783ad8bb5036b; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_transactions
    ADD CONSTRAINT "PK_3f0ffe3ca2def8783ad8bb5036b" PRIMARY KEY (id);


--
-- Name: courses PK_3f70a487cc718ad8eda4e6d58c9; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT "PK_3f70a487cc718ad8eda4e6d58c9" PRIMARY KEY (id);


--
-- Name: attendances PK_483ed97cd4cd43ab4a117516b69; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT "PK_483ed97cd4cd43ab4a117516b69" PRIMARY KEY (id);


--
-- Name: refunds PK_5106efb01eeda7e49a78b869738; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT "PK_5106efb01eeda7e49a78b869738" PRIMARY KEY (id);


--
-- Name: invoice_items PK_53b99f9e0e2945e69de1a12b75a; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT "PK_53b99f9e0e2945e69de1a12b75a" PRIMARY KEY (id);


--
-- Name: teacher_evaluations PK_571166d2b41bab153d53f534797; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_evaluations
    ADD CONSTRAINT "PK_571166d2b41bab153d53f534797" PRIMARY KEY (id);


--
-- Name: teacher_availabilities PK_58eb0747fd9f9a8bfdfda11547f; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_availabilities
    ADD CONSTRAINT "PK_58eb0747fd9f9a8bfdfda11547f" PRIMARY KEY (id);


--
-- Name: student_profiles PK_5ed0a32eeaddfe812fb326177d0; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_profiles
    ADD CONSTRAINT "PK_5ed0a32eeaddfe812fb326177d0" PRIMARY KEY (id);


--
-- Name: testimonials PK_63b03c608bd258f115a0a4a1060; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.testimonials
    ADD CONSTRAINT "PK_63b03c608bd258f115a0a4a1060" PRIMARY KEY (id);


--
-- Name: groups PK_659d1483316afb28afd3a90646e; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT "PK_659d1483316afb28afd3a90646e" PRIMARY KEY (id);


--
-- Name: invoices PK_668cef7c22a427fd822cc1be3ce; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT "PK_668cef7c22a427fd822cc1be3ce" PRIMARY KEY (id);


--
-- Name: test_slots PK_66e549827decf50f1e8f13b1844; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_slots
    ADD CONSTRAINT "PK_66e549827decf50f1e8f13b1844" PRIMARY KEY (id);


--
-- Name: notifications PK_6a72c3c0f683f6462415e653c3a; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY (id);


--
-- Name: lms_lessons PK_6cd0ea5c343aed86a5f56930f43; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lms_lessons
    ADD CONSTRAINT "PK_6cd0ea5c343aed86a5f56930f43" PRIMARY KEY (id);


--
-- Name: group_students PK_72f9cc5725656666453ab33f1b2; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_students
    ADD CONSTRAINT "PK_72f9cc5725656666453ab33f1b2" PRIMARY KEY (student_id, id, group_id);


--
-- Name: payroll_entries PK_749b8c91480734ee1e616d4456d; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_entries
    ADD CONSTRAINT "PK_749b8c91480734ee1e616d4456d" PRIMARY KEY (id);


--
-- Name: enrollments PK_7c0f752f9fb68bf6ed7367ab00f; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT "PK_7c0f752f9fb68bf6ed7367ab00f" PRIMARY KEY (id);


--
-- Name: students PK_7d7f07271ad4ce999880713f05e; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT "PK_7d7f07271ad4ce999880713f05e" PRIMARY KEY (id);


--
-- Name: branches PK_7f37d3b42defea97f1df0d19535; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT "PK_7f37d3b42defea97f1df0d19535" PRIMARY KEY (id);


--
-- Name: activities PK_7f4004429f731ffb9c88eb486a8; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT "PK_7f4004429f731ffb9c88eb486a8" PRIMARY KEY (id);


--
-- Name: lms_resources PK_8a326f24d7970511663291244c4; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lms_resources
    ADD CONSTRAINT "PK_8a326f24d7970511663291244c4" PRIMARY KEY (id);


--
-- Name: migrations PK_8c82d7f526340ab734260ea46be; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY (id);


--
-- Name: permissions PK_920331560282b8bd21bb02290df; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY (id);


--
-- Name: certificate_templates PK_9704620367ce59e9aa60204ed30; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificate_templates
    ADD CONSTRAINT "PK_9704620367ce59e9aa60204ed30" PRIMARY KEY (id);


--
-- Name: users PK_a3ffb1c0c8416b9fc6f907b7433; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY (id);


--
-- Name: activity_photos PK_a6eace2023f53cb7bba1498397a; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_photos
    ADD CONSTRAINT "PK_a6eace2023f53cb7bba1498397a" PRIMARY KEY (id);


--
-- Name: quiz_attempts PK_a84a93fb092359516dc5b325b90; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_attempts
    ADD CONSTRAINT "PK_a84a93fb092359516dc5b325b90" PRIMARY KEY (id);


--
-- Name: student_surveys PK_a9ce75b19ebc66ebe671f6e55fd; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_surveys
    ADD CONSTRAINT "PK_a9ce75b19ebc66ebe671f6e55fd" PRIMARY KEY (id);


--
-- Name: student_item_issues PK_b1dc348a3d4ddc5e2766bfa88bc; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_item_issues
    ADD CONSTRAINT "PK_b1dc348a3d4ddc5e2766bfa88bc" PRIMARY KEY (id);


--
-- Name: quizzes PK_b24f0f7662cf6b3a0e7dba0a1b4; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT "PK_b24f0f7662cf6b3a0e7dba0a1b4" PRIMARY KEY (id);


--
-- Name: kb_categories PK_b45b2b3fa8645a80ddcb72cdb16; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kb_categories
    ADD CONSTRAINT "PK_b45b2b3fa8645a80ddcb72cdb16" PRIMARY KEY (id);


--
-- Name: employees PK_b9535a98350d5b26e7eb0c26af4; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT "PK_b9535a98350d5b26e7eb0c26af4" PRIMARY KEY (id);


--
-- Name: roles PK_c1433d71a4838793a49dcad46ab; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY (id);


--
-- Name: employee_documents PK_c19b36f5e604e261fb430293b68; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_documents
    ADD CONSTRAINT "PK_c19b36f5e604e261fb430293b68" PRIMARY KEY (id);


--
-- Name: gradebook_categories PK_c5043dd8420a133d1b20f1f7e7e; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gradebook_categories
    ADD CONSTRAINT "PK_c5043dd8420a133d1b20f1f7e7e" PRIMARY KEY (id);


--
-- Name: assignments PK_c54ca359535e0012b04dcbd80ee; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT "PK_c54ca359535e0012b04dcbd80ee" PRIMARY KEY (id);


--
-- Name: installments PK_c74e44aa06bdebef2af0a93da1b; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.installments
    ADD CONSTRAINT "PK_c74e44aa06bdebef2af0a93da1b" PRIMARY KEY (id);


--
-- Name: promo_codes PK_c7b4f01710fda5afa056a2b4a35; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promo_codes
    ADD CONSTRAINT "PK_c7b4f01710fda5afa056a2b4a35" PRIMARY KEY (id);


--
-- Name: gradebook_entries PK_c9d6fcf9ca4f34f14e1013218ce; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gradebook_entries
    ADD CONSTRAINT "PK_c9d6fcf9ca4f34f14e1013218ce" PRIMARY KEY (id);


--
-- Name: leads PK_cd102ed7a9a4ca7d4d8bfeba406; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT "PK_cd102ed7a9a4ca7d4d8bfeba406" PRIMARY KEY (id);


--
-- Name: lead_tags PK_ce6b12309bf373c5af878035b3e; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_tags
    ADD CONSTRAINT "PK_ce6b12309bf373c5af878035b3e" PRIMARY KEY (id);


--
-- Name: inventory_items PK_cf2f451407242e132547ac19169; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT "PK_cf2f451407242e132547ac19169" PRIMARY KEY (id);


--
-- Name: chat_consents PK_chat_consents; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_consents
    ADD CONSTRAINT "PK_chat_consents" PRIMARY KEY (id);


--
-- Name: chat_messages PK_chat_messages_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT "PK_chat_messages_id" PRIMARY KEY (id);


--
-- Name: chat_room_members PK_chat_room_members_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_room_members
    ADD CONSTRAINT "PK_chat_room_members_id" PRIMARY KEY (id);


--
-- Name: chat_rooms PK_chat_rooms_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_rooms
    ADD CONSTRAINT "PK_chat_rooms_id" PRIMARY KEY (id);


--
-- Name: chat_strikes PK_chat_strikes_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_strikes
    ADD CONSTRAINT "PK_chat_strikes_id" PRIMARY KEY (id);


--
-- Name: chat_violations PK_chat_violations_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_violations
    ADD CONSTRAINT "PK_chat_violations_id" PRIMARY KEY (id);


--
-- Name: placement_tests PK_d024b5ad98461ffe65066501325; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.placement_tests
    ADD CONSTRAINT "PK_d024b5ad98461ffe65066501325" PRIMARY KEY (id);


--
-- Name: leave_requests PK_d3abcf9a16cef1450129e06fa9f; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT "PK_d3abcf9a16cef1450129e06fa9f" PRIMARY KEY (id);


--
-- Name: follow_ups PK_d510aabdff2ec7fdc67a1092157; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.follow_ups
    ADD CONSTRAINT "PK_d510aabdff2ec7fdc67a1092157" PRIMARY KEY (id);


--
-- Name: waitlists PK_d825b8fcdb753fda136c4039b3a; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.waitlists
    ADD CONSTRAINT "PK_d825b8fcdb753fda136c4039b3a" PRIMARY KEY (id);


--
-- Name: blog_posts PK_dd2add25eac93daefc93da9d387; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT "PK_dd2add25eac93daefc93da9d387" PRIMARY KEY (id);


--
-- Name: certificates PK_e4c7e31e2144300bea7d89eb165; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT "PK_e4c7e31e2144300bea7d89eb165" PRIMARY KEY (id);


--
-- Name: notification_preferences PK_e94e2b543f2f218ee68e4f4fad2; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT "PK_e94e2b543f2f218ee68e4f4fad2" PRIMARY KEY (id);


--
-- Name: quiz_questions PK_ec0447fd30d9f5c182e7653bfd3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_questions
    ADD CONSTRAINT "PK_ec0447fd30d9f5c182e7653bfd3" PRIMARY KEY (id);


--
-- Name: group_schedules PK_ec690933f0303281d30e840857d; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_schedules
    ADD CONSTRAINT "PK_ec690933f0303281d30e840857d" PRIMARY KEY (id);


--
-- Name: activity_registrations PK_ed3d336c3b301af02e6f9ffcbd6; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_registrations
    ADD CONSTRAINT "PK_ed3d336c3b301af02e6f9ffcbd6" PRIMARY KEY (id);


--
-- Name: stock_levels PK_ee416fdf2f5696dff16fd0c1c90; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_levels
    ADD CONSTRAINT "PK_ee416fdf2f5696dff16fd0c1c90" PRIMARY KEY (id);


--
-- Name: kb_articles PK_ffb01b096d72350aa97d1d0cb14; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kb_articles
    ADD CONSTRAINT "PK_ffb01b096d72350aa97d1d0cb14" PRIMARY KEY (id);


--
-- Name: placement_test_papers PK_placement_test_papers; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.placement_test_papers
    ADD CONSTRAINT "PK_placement_test_papers" PRIMARY KEY (id);


--
-- Name: installments UQ_1407957001ba92b34c3f8288f1b; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.installments
    ADD CONSTRAINT "UQ_1407957001ba92b34c3f8288f1b" UNIQUE (invoice_id, installment_number);


--
-- Name: employees UQ_2d83c53c3e553a48dadb9722e38; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT "UQ_2d83c53c3e553a48dadb9722e38" UNIQUE (user_id);


--
-- Name: group_students UQ_2dc2c3c7c14f90c8bd41151548f; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_students
    ADD CONSTRAINT "UQ_2dc2c3c7c14f90c8bd41151548f" UNIQUE (group_id, student_id);


--
-- Name: promo_codes UQ_2f096c406a9d9d5b8ce204190c3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promo_codes
    ADD CONSTRAINT "UQ_2f096c406a9d9d5b8ce204190c3" UNIQUE (code);


--
-- Name: inventory_items UQ_395ec8d9e0cad6e3890b989fc1c; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT "UQ_395ec8d9e0cad6e3890b989fc1c" UNIQUE (sku);


--
-- Name: student_profiles UQ_4cedc08d3dc1f2c2da8a12f7a88; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_profiles
    ADD CONSTRAINT "UQ_4cedc08d3dc1f2c2da8a12f7a88" UNIQUE (student_id);


--
-- Name: blog_posts UQ_5b2818a2c45c3edb9991b1c7a51; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT "UQ_5b2818a2c45c3edb9991b1c7a51" UNIQUE (slug);


--
-- Name: kb_categories UQ_5bef5b2759dfe7b39ec340fbe1a; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kb_categories
    ADD CONSTRAINT "UQ_5bef5b2759dfe7b39ec340fbe1a" UNIQUE (slug);


--
-- Name: roles UQ_648e3f5447f725579d7d4ffdfb7; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT "UQ_648e3f5447f725579d7d4ffdfb7" UNIQUE (name);


--
-- Name: kb_articles UQ_6c048f402eb6814c8c10b6da0bf; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kb_articles
    ADD CONSTRAINT "UQ_6c048f402eb6814c8c10b6da0bf" UNIQUE (slug);


--
-- Name: activity_registrations UQ_810d96d1648c72e463532ab8194; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_registrations
    ADD CONSTRAINT "UQ_810d96d1648c72e463532ab8194" UNIQUE (activity_id, student_id);


--
-- Name: courses UQ_86b3589486bac01d2903e22471c; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT "UQ_86b3589486bac01d2903e22471c" UNIQUE (code);


--
-- Name: roles UQ_881f72bac969d9a00a1a29e1079; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT "UQ_881f72bac969d9a00a1a29e1079" UNIQUE (slug);


--
-- Name: employees UQ_8878710dc844ecd6f9e587f34fc; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT "UQ_8878710dc844ecd6f9e587f34fc" UNIQUE (employee_number);


--
-- Name: notification_preferences UQ_937c63b6d77788785927d890c05; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT "UQ_937c63b6d77788785927d890c05" UNIQUE (user_id, channel, module, event);


--
-- Name: quiz_attempts UQ_954f2143da6531a890d1532d999; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_attempts
    ADD CONSTRAINT "UQ_954f2143da6531a890d1532d999" UNIQUE (quiz_id, student_id, attempt_number);


--
-- Name: users UQ_97672ac88f789774dd47f7c8be3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE (email);


--
-- Name: users UQ_a000cca60bcf04454e727699490; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_a000cca60bcf04454e727699490" UNIQUE (phone);


--
-- Name: attendances UQ_a5789744333d8e7f56e3fed3957; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT "UQ_a5789744333d8e7f56e3fed3957" UNIQUE (session_id, student_id);


--
-- Name: payments UQ_a6659e5eb1bf3b467c819e7f167; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "UQ_a6659e5eb1bf3b467c819e7f167" UNIQUE (receipt_number);


--
-- Name: payroll_entries UQ_a7093f5a4a29028c8371af59f17; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_entries
    ADD CONSTRAINT "UQ_a7093f5a4a29028c8371af59f17" UNIQUE (payroll_period_id, employee_id);


--
-- Name: students UQ_a711caeb43450bf6ce3e9086dfa; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT "UQ_a711caeb43450bf6ce3e9086dfa" UNIQUE (student_number);


--
-- Name: gradebook_entries UQ_b4982e9bedb18300283f440c2f6; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gradebook_entries
    ADD CONSTRAINT "UQ_b4982e9bedb18300283f440c2f6" UNIQUE (group_id, student_id, category_id, reference_type, reference_id);


--
-- Name: placement_test_answers UQ_c5ba03cf90e37aa9aed7ef4f82d; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.placement_test_answers
    ADD CONSTRAINT "UQ_c5ba03cf90e37aa9aed7ef4f82d" UNIQUE (test_id, question_id);


--
-- Name: settings UQ_c8639b7626fa94ba8265628f214; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT "UQ_c8639b7626fa94ba8265628f214" UNIQUE (key);


--
-- Name: stock_levels UQ_ca338cbf37b34ec4913578d1343; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_levels
    ADD CONSTRAINT "UQ_ca338cbf37b34ec4913578d1343" UNIQUE (item_id, branch_id);


--
-- Name: invoices UQ_d8f8d3788694e1b3f96c42c36fb; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT "UQ_d8f8d3788694e1b3f96c42c36fb" UNIQUE (invoice_number);


--
-- Name: sales_targets UQ_e65da082c39f4924c864694ee3a; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_targets
    ADD CONSTRAINT "UQ_e65da082c39f4924c864694ee3a" UNIQUE (agent_id, month, year);


--
-- Name: certificates UQ_e9e6937f74d9a653f0fc3299132; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT "UQ_e9e6937f74d9a653f0fc3299132" UNIQUE (code);


--
-- Name: submissions UQ_f043d0d459a667e9396e2a90864; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT "UQ_f043d0d459a667e9396e2a90864" UNIQUE (assignment_id, student_id);


--
-- Name: students UQ_fb3eff90b11bddf7285f9b4e281; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT "UQ_fb3eff90b11bddf7285f9b4e281" UNIQUE (user_id);


--
-- Name: placement_test_papers uq_ptp_test; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.placement_test_papers
    ADD CONSTRAINT uq_ptp_test UNIQUE (test_id);


--
-- Name: IDX_17022daf3f885f7d35423e9971; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_17022daf3f885f7d35423e9971" ON public.role_permissions USING btree (permission_id);


--
-- Name: IDX_178199805b901ccd220ab7740e; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_178199805b901ccd220ab7740e" ON public.role_permissions USING btree (role_id);


--
-- Name: IDX_86ac11b05c01e9981dd4e4ba39; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_86ac11b05c01e9981dd4e4ba39" ON public.group_students USING btree (student_id);


--
-- Name: IDX_8b5b7bb7e2c2f1a8e4319ae33; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_8b5b7bb7e2c2f1a8e4319ae33" ON public.group_students USING btree (group_id);


--
-- Name: IDX_chat_consents_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_chat_consents_user_id" ON public.chat_consents USING btree (user_id);


--
-- Name: IDX_chat_messages_room_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_chat_messages_room_id" ON public.chat_messages USING btree (room_id);


--
-- Name: IDX_chat_messages_sender_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_chat_messages_sender_id" ON public.chat_messages USING btree (sender_id);


--
-- Name: IDX_chat_room_members_room_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_chat_room_members_room_id" ON public.chat_room_members USING btree (room_id);


--
-- Name: IDX_chat_room_members_room_user; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_chat_room_members_room_user" ON public.chat_room_members USING btree (room_id, user_id);


--
-- Name: IDX_chat_room_members_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_chat_room_members_user_id" ON public.chat_room_members USING btree (user_id);


--
-- Name: IDX_chat_strikes_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_chat_strikes_user_id" ON public.chat_strikes USING btree (user_id);


--
-- Name: IDX_chat_strikes_violation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_chat_strikes_violation_id" ON public.chat_strikes USING btree (violation_id);


--
-- Name: IDX_chat_violations_room_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_chat_violations_room_id" ON public.chat_violations USING btree (room_id);


--
-- Name: IDX_chat_violations_sender_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_chat_violations_sender_id" ON public.chat_violations USING btree (sender_id);


--
-- Name: assignments FK_03fa66c20619cbc55aa4ebc69bd; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT "FK_03fa66c20619cbc55aa4ebc69bd" FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: student_item_issues FK_04980de8699c4ec34ede894fcd7; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_item_issues
    ADD CONSTRAINT "FK_04980de8699c4ec34ede894fcd7" FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE RESTRICT;


--
-- Name: kb_categories FK_08277157ffb16ec2c630e0fd36c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kb_categories
    ADD CONSTRAINT "FK_08277157ffb16ec2c630e0fd36c" FOREIGN KEY (parent_id) REFERENCES public.kb_categories(id) ON DELETE SET NULL;


--
-- Name: invoices FK_0a19069218ffe36a4e4b41c4870; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT "FK_0a19069218ffe36a4e4b41c4870" FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE RESTRICT;


--
-- Name: classrooms FK_0bbedc9d10b3b6c53144a9e2e63; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classrooms
    ADD CONSTRAINT "FK_0bbedc9d10b3b6c53144a9e2e63" FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: certificate_templates FK_0d6c69bff7efa430feee51654ff; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificate_templates
    ADD CONSTRAINT "FK_0d6c69bff7efa430feee51654ff" FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: kb_article_versions FK_0f99c336ba154a89d5f46a506d9; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kb_article_versions
    ADD CONSTRAINT "FK_0f99c336ba154a89d5f46a506d9" FOREIGN KEY (article_id) REFERENCES public.kb_articles(id) ON DELETE CASCADE;


--
-- Name: stock_moves FK_12fd85240fa91001a859f77f755; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_moves
    ADD CONSTRAINT "FK_12fd85240fa91001a859f77f755" FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: activities FK_1315bba9f87e51a49bd7280410b; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT "FK_1315bba9f87e51a49bd7280410b" FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: lead_activities FK_1339a9192b94ddf0eac8f25142b; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_activities
    ADD CONSTRAINT "FK_1339a9192b94ddf0eac8f25142b" FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: quiz_questions FK_14c6d2b8f5be0bdb406a3895bb4; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_questions
    ADD CONSTRAINT "FK_14c6d2b8f5be0bdb406a3895bb4" FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE;


--
-- Name: branches FK_14da1875eaf9e5c81ca4678765d; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT "FK_14da1875eaf9e5c81ca4678765d" FOREIGN KEY (manager_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: role_permissions FK_17022daf3f885f7d35423e9971e; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT "FK_17022daf3f885f7d35423e9971e" FOREIGN KEY (permission_id) REFERENCES public.permissions(id);


--
-- Name: audit_logs FK_177183f29f438c488b5e8510cdb; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT "FK_177183f29f438c488b5e8510cdb" FOREIGN KEY (actor_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: role_permissions FK_178199805b901ccd220ab7740ec; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT "FK_178199805b901ccd220ab7740ec" FOREIGN KEY (role_id) REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payroll_periods FK_185fc596def65be34c569862fad; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_periods
    ADD CONSTRAINT "FK_185fc596def65be34c569862fad" FOREIGN KEY (closed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: lms_modules FK_1b78b623d1c36a142efad579f2e; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lms_modules
    ADD CONSTRAINT "FK_1b78b623d1c36a142efad579f2e" FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: leads FK_1f077fc1a37d0ef752e0b8285fb; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT "FK_1f077fc1a37d0ef752e0b8285fb" FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;


--
-- Name: teacher_evaluations FK_1f25ade25eda93037a700f26e69; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_evaluations
    ADD CONSTRAINT "FK_1f25ade25eda93037a700f26e69" FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: invoices FK_2413e6ce6a8b64c541c4f629925; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT "FK_2413e6ce6a8b64c541c4f629925" FOREIGN KEY (enrollment_id) REFERENCES public.enrollments(id) ON DELETE RESTRICT;


--
-- Name: certificates FK_254f3859dcd4d99b0213f90d754; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT "FK_254f3859dcd4d99b0213f90d754" FOREIGN KEY (issued_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: lead_activities FK_26316cb0e146683e9e8aee237d4; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_activities
    ADD CONSTRAINT "FK_26316cb0e146683e9e8aee237d4" FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- Name: sessions FK_29cb65ff2ae5b234efbe9b6c09b; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT "FK_29cb65ff2ae5b234efbe9b6c09b" FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: employees FK_2d83c53c3e553a48dadb9722e38; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT "FK_2d83c53c3e553a48dadb9722e38" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: follow_ups FK_2dde8f78f85193994c0f3f6ce68; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.follow_ups
    ADD CONSTRAINT "FK_2dde8f78f85193994c0f3f6ce68" FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;


--
-- Name: teacher_evaluations FK_2f3fc83aa67b4df3a3316a048ad; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_evaluations
    ADD CONSTRAINT "FK_2f3fc83aa67b4df3a3316a048ad" FOREIGN KEY (teacher_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: enrollments FK_307813fe255896d6ebf3e6cd55c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT "FK_307813fe255896d6ebf3e6cd55c" FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: certificates FK_353b0d35680087de9e604610df0; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT "FK_353b0d35680087de9e604610df0" FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE RESTRICT;


--
-- Name: test_slots FK_37834fb6fb860d5b117d5842abd; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_slots
    ADD CONSTRAINT "FK_37834fb6fb860d5b117d5842abd" FOREIGN KEY (examiner_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: financial_transactions FK_37e1bbb92039598460e4cbb13f8; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_transactions
    ADD CONSTRAINT "FK_37e1bbb92039598460e4cbb13f8" FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE SET NULL;


--
-- Name: invoices FK_39a202af5d1dd1744458820ecb5; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT "FK_39a202af5d1dd1744458820ecb5" FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: certificates FK_3b6a412073ea28153dc20a843b4; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT "FK_3b6a412073ea28153dc20a843b4" FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE RESTRICT;


--
-- Name: test_questions FK_3c42056943583693d7a491927dc; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_questions
    ADD CONSTRAINT "FK_3c42056943583693d7a491927dc" FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: quiz_attempts FK_401102c6a3400b7acd61ebb2603; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_attempts
    ADD CONSTRAINT "FK_401102c6a3400b7acd61ebb2603" FOREIGN KEY (graded_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: submissions FK_435def3bbd4b4bbb9de1209cdae; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT "FK_435def3bbd4b4bbb9de1209cdae" FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: student_profiles FK_4cedc08d3dc1f2c2da8a12f7a88; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_profiles
    ADD CONSTRAINT "FK_4cedc08d3dc1f2c2da8a12f7a88" FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: financial_transactions FK_4d826bab6065472dc899f0d1571; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_transactions
    ADD CONSTRAINT "FK_4d826bab6065472dc899f0d1571" FOREIGN KEY (refund_id) REFERENCES public.refunds(id) ON DELETE SET NULL;


--
-- Name: quizzes FK_4eb3cacff4db73542f37b5a4358; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT "FK_4eb3cacff4db73542f37b5a4358" FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: group_students FK_50d45645710f456f595955979ff; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_students
    ADD CONSTRAINT "FK_50d45645710f456f595955979ff" FOREIGN KEY (enrolled_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: leave_requests FK_52b4b7c7d295e204add6dbe0a09; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT "FK_52b4b7c7d295e204add6dbe0a09" FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: enrollments FK_52e3e34305ad0800648eab215ed; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT "FK_52e3e34305ad0800648eab215ed" FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE RESTRICT;


--
-- Name: payments FK_563a5e248518c623eebd987d43e; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "FK_563a5e248518c623eebd987d43e" FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE RESTRICT;


--
-- Name: gradebook_entries FK_57e2f526c64af2534574cc3bc2c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gradebook_entries
    ADD CONSTRAINT "FK_57e2f526c64af2534574cc3bc2c" FOREIGN KEY (category_id) REFERENCES public.gradebook_categories(id) ON DELETE CASCADE;


--
-- Name: users FK_5a58f726a41264c8b3e86d4a1de; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "FK_5a58f726a41264c8b3e86d4a1de" FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;


--
-- Name: leads FK_5c37aa54e3b06f6733d56007e0c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT "FK_5c37aa54e3b06f6733d56007e0c" FOREIGN KEY (assigned_to) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: certificates FK_5fc025803a5eb21001b77ed6b1a; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT "FK_5fc025803a5eb21001b77ed6b1a" FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE RESTRICT;


--
-- Name: student_surveys FK_607e4895ededf0a54c2b0bcfa88; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_surveys
    ADD CONSTRAINT "FK_607e4895ededf0a54c2b0bcfa88" FOREIGN KEY (teacher_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: teacher_evaluations FK_6141c4d982ab237f1178759cbb7; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_evaluations
    ADD CONSTRAINT "FK_6141c4d982ab237f1178759cbb7" FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: waitlists FK_63ab425527783f5e42e05179e8e; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.waitlists
    ADD CONSTRAINT "FK_63ab425527783f5e42e05179e8e" FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: notification_preferences FK_64c90edc7310c6be7c10c96f675; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT "FK_64c90edc7310c6be7c10c96f675" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: gradebook_categories FK_6527180ea3c788221fbd51dfacf; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gradebook_categories
    ADD CONSTRAINT "FK_6527180ea3c788221fbd51dfacf" FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: chat_violations FK_696c9711b596429534143ba0ba5; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_violations
    ADD CONSTRAINT "FK_696c9711b596429534143ba0ba5" FOREIGN KEY (message_id) REFERENCES public.chat_messages(id) ON DELETE CASCADE;


--
-- Name: test_slots FK_74acd2425e8885e8cd58cd7d929; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_slots
    ADD CONSTRAINT "FK_74acd2425e8885e8cd58cd7d929" FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: follow_ups FK_779d819934eb871aaf5ff2744fd; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.follow_ups
    ADD CONSTRAINT "FK_779d819934eb871aaf5ff2744fd" FOREIGN KEY (assigned_to) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: attendances FK_7874d0af5c1371ad4ea2152e266; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT "FK_7874d0af5c1371ad4ea2152e266" FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: submissions FK_7e45a1f4ca37da761e5ae72046e; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT "FK_7e45a1f4ca37da761e5ae72046e" FOREIGN KEY (graded_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: kb_article_versions FK_7e9337070faddd2d7599f8aa690; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kb_article_versions
    ADD CONSTRAINT "FK_7e9337070faddd2d7599f8aa690" FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: refunds FK_7f48aa5d56c42aeb495db016683; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT "FK_7f48aa5d56c42aeb495db016683" FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE RESTRICT;


--
-- Name: employee_documents FK_7fce49bcbfe15a73953b2809944; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_documents
    ADD CONSTRAINT "FK_7fce49bcbfe15a73953b2809944" FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: lms_resources FK_8030a9844d2fa9ac216ff70ce5e; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lms_resources
    ADD CONSTRAINT "FK_8030a9844d2fa9ac216ff70ce5e" FOREIGN KEY (lesson_id) REFERENCES public.lms_lessons(id) ON DELETE CASCADE;


--
-- Name: sessions FK_8049054c003f0457bc60256a080; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT "FK_8049054c003f0457bc60256a080" FOREIGN KEY (classroom_id) REFERENCES public.classrooms(id) ON DELETE SET NULL;


--
-- Name: kb_articles FK_82a3bf1c44547417c7afd9cfeff; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kb_articles
    ADD CONSTRAINT "FK_82a3bf1c44547417c7afd9cfeff" FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: group_students FK_86ac11b05c01e9981dd4e4ba39e; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_students
    ADD CONSTRAINT "FK_86ac11b05c01e9981dd4e4ba39e" FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: submissions FK_8723840b9b0464206640c268abc; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT "FK_8723840b9b0464206640c268abc" FOREIGN KEY (assignment_id) REFERENCES public.assignments(id) ON DELETE CASCADE;


--
-- Name: user_roles FK_87b8888186ca9769c960e926870; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT "FK_87b8888186ca9769c960e926870" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: group_students FK_8b5b7bb7e2c2f1a8e4319ae3394; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_students
    ADD CONSTRAINT "FK_8b5b7bb7e2c2f1a8e4319ae3394" FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: financial_transactions FK_8bf2cd92fd0099dacfad8e4f981; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_transactions
    ADD CONSTRAINT "FK_8bf2cd92fd0099dacfad8e4f981" FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE SET NULL;


--
-- Name: student_item_issues FK_8cc088c289dcfbaeb9745dd13dd; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_item_issues
    ADD CONSTRAINT "FK_8cc088c289dcfbaeb9745dd13dd" FOREIGN KEY (item_id) REFERENCES public.inventory_items(id) ON DELETE RESTRICT;


--
-- Name: groups FK_8d4bd26aea4760f20c53c64d806; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT "FK_8d4bd26aea4760f20c53c64d806" FOREIGN KEY (substitute_teacher_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: gradebook_entries FK_90228c0a8033a8de9232406f330; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gradebook_entries
    ADD CONSTRAINT "FK_90228c0a8033a8de9232406f330" FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: sales_targets FK_91b3dc386bf44165fc2529a19ea; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_targets
    ADD CONSTRAINT "FK_91b3dc386bf44165fc2529a19ea" FOREIGN KEY (agent_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: stock_levels FK_95b525d66b131aeb3a4e107b73b; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_levels
    ADD CONSTRAINT "FK_95b525d66b131aeb3a4e107b73b" FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: kb_articles FK_97f00dd69b2702516768e908cf2; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kb_articles
    ADD CONSTRAINT "FK_97f00dd69b2702516768e908cf2" FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: assignments FK_9a52a70c18d351ddab148eaf849; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT "FK_9a52a70c18d351ddab148eaf849" FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: notifications FK_9a8a82462cab47c73d25f49261f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: installments FK_9b9efe3f86dae4178c0ce9bab05; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.installments
    ADD CONSTRAINT "FK_9b9efe3f86dae4178c0ce9bab05" FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;


--
-- Name: group_schedules FK_9c38b828abe6b2ce450c24b547a; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_schedules
    ADD CONSTRAINT "FK_9c38b828abe6b2ce450c24b547a" FOREIGN KEY (classroom_id) REFERENCES public.classrooms(id) ON DELETE SET NULL;


--
-- Name: group_schedules FK_9ec13301c0b64ec00b1093b286d; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_schedules
    ADD CONSTRAINT "FK_9ec13301c0b64ec00b1093b286d" FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: teacher_availabilities FK_a129880a147d2fa3be815b3ca1f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_availabilities
    ADD CONSTRAINT "FK_a129880a147d2fa3be815b3ca1f" FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: groups FK_a2a39f99d587813ada6f1a12ed3; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT "FK_a2a39f99d587813ada6f1a12ed3" FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE RESTRICT;


--
-- Name: financial_transactions FK_a4f2f71a86f10cff13dc0fde93b; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_transactions
    ADD CONSTRAINT "FK_a4f2f71a86f10cff13dc0fde93b" FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: quiz_attempts FK_a720e260138b64fcff2fca19b2d; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_attempts
    ADD CONSTRAINT "FK_a720e260138b64fcff2fca19b2d" FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE;


--
-- Name: placement_tests FK_aadf9d73eabc6642ac563bd2e20; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.placement_tests
    ADD CONSTRAINT "FK_aadf9d73eabc6642ac563bd2e20" FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;


--
-- Name: stock_levels FK_ac43084fe0d4bd17f91c3a54705; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_levels
    ADD CONSTRAINT "FK_ac43084fe0d4bd17f91c3a54705" FOREIGN KEY (item_id) REFERENCES public.inventory_items(id) ON DELETE CASCADE;


--
-- Name: activity_registrations FK_acaaa1c98235a614018523814fc; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_registrations
    ADD CONSTRAINT "FK_acaaa1c98235a614018523814fc" FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: kb_articles FK_b0eba5ebb9a584b49918f151d50; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kb_articles
    ADD CONSTRAINT "FK_b0eba5ebb9a584b49918f151d50" FOREIGN KEY (category_id) REFERENCES public.kb_categories(id) ON DELETE RESTRICT;


--
-- Name: stock_moves FK_b1265a0414f4c282d251f68bf07; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_moves
    ADD CONSTRAINT "FK_b1265a0414f4c282d251f68bf07" FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE RESTRICT;


--
-- Name: user_roles FK_b23c65e50a758245a33ee35fda1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT "FK_b23c65e50a758245a33ee35fda1" FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: student_surveys FK_b586cf0886069a9dfb6583eccba; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_surveys
    ADD CONSTRAINT "FK_b586cf0886069a9dfb6583eccba" FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: groups FK_b61a35e72ff621fcd717d74fce6; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT "FK_b61a35e72ff621fcd717d74fce6" FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE RESTRICT;


--
-- Name: placement_test_answers FK_b70e84619348fdc64b9d90f86dc; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.placement_test_answers
    ADD CONSTRAINT "FK_b70e84619348fdc64b9d90f86dc" FOREIGN KEY (test_id) REFERENCES public.placement_tests(id) ON DELETE CASCADE;


--
-- Name: certificates FK_b73604d85c520ce2d2cfd675cce; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT "FK_b73604d85c520ce2d2cfd675cce" FOREIGN KEY (template_id) REFERENCES public.certificate_templates(id) ON DELETE SET NULL;


--
-- Name: payments FK_b8128ab843771cf6d42ab3ca188; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "FK_b8128ab843771cf6d42ab3ca188" FOREIGN KEY (recorded_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: placement_tests FK_b89cbec052ed31ebd2e2c9e9351; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.placement_tests
    ADD CONSTRAINT "FK_b89cbec052ed31ebd2e2c9e9351" FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE SET NULL;


--
-- Name: student_item_issues FK_b8c608bb0e4db5e09ba0ed8bdf5; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_item_issues
    ADD CONSTRAINT "FK_b8c608bb0e4db5e09ba0ed8bdf5" FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: promo_codes FK_b92a143baf32a667bb94c3ba38d; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promo_codes
    ADD CONSTRAINT "FK_b92a143baf32a667bb94c3ba38d" FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: activity_photos FK_b98a81a759304cf434059e57eae; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_photos
    ADD CONSTRAINT "FK_b98a81a759304cf434059e57eae" FOREIGN KEY (uploaded_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: placement_test_answers FK_baa7782034eed85ae9397e0ce6b; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.placement_test_answers
    ADD CONSTRAINT "FK_baa7782034eed85ae9397e0ce6b" FOREIGN KEY (question_id) REFERENCES public.test_questions(id) ON DELETE RESTRICT;


--
-- Name: refunds FK_bbe1a0623e423441c89937a74bd; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT "FK_bbe1a0623e423441c89937a74bd" FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE RESTRICT;


--
-- Name: stock_moves FK_bc7e0881ce3bc369b009942b0a7; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_moves
    ADD CONSTRAINT "FK_bc7e0881ce3bc369b009942b0a7" FOREIGN KEY (item_id) REFERENCES public.inventory_items(id) ON DELETE RESTRICT;


--
-- Name: activity_registrations FK_bcc386851d4476e5fab2a683c39; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_registrations
    ADD CONSTRAINT "FK_bcc386851d4476e5fab2a683c39" FOREIGN KEY (activity_id) REFERENCES public.activities(id) ON DELETE CASCADE;


--
-- Name: student_level_history FK_c030dd8e3a30b93bd09171dd67c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_level_history
    ADD CONSTRAINT "FK_c030dd8e3a30b93bd09171dd67c" FOREIGN KEY (changed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: placement_tests FK_c114824123a9ccca3a1008e9ab4; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.placement_tests
    ADD CONSTRAINT "FK_c114824123a9ccca3a1008e9ab4" FOREIGN KEY (slot_id) REFERENCES public.test_slots(id) ON DELETE RESTRICT;


--
-- Name: refunds FK_c1cf8b20996c8a602311aac45e8; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT "FK_c1cf8b20996c8a602311aac45e8" FOREIGN KEY (processed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: blog_posts FK_c3fc4a3a656aad74331acfcf2a9; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT "FK_c3fc4a3a656aad74331acfcf2a9" FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: certificate_templates FK_c9b95008b57b70e19c9f4b64bc9; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificate_templates
    ADD CONSTRAINT "FK_c9b95008b57b70e19c9f4b64bc9" FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE SET NULL;


--
-- Name: attendances FK_ccb4752e27a2927234e1f3dc960; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT "FK_ccb4752e27a2927234e1f3dc960" FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;


--
-- Name: lead_tags FK_cf2c00470dc5c11f0ad4aca2e8d; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_tags
    ADD CONSTRAINT "FK_cf2c00470dc5c11f0ad4aca2e8d" FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;


--
-- Name: chat_messages FK_chat_messages_reply; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT "FK_chat_messages_reply" FOREIGN KEY (reply_to_id) REFERENCES public.chat_messages(id) ON DELETE SET NULL;


--
-- Name: chat_messages FK_chat_messages_room; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT "FK_chat_messages_room" FOREIGN KEY (room_id) REFERENCES public.chat_rooms(id) ON DELETE CASCADE;


--
-- Name: chat_messages FK_chat_messages_sender; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT "FK_chat_messages_sender" FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: chat_room_members FK_chat_room_members_room; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_room_members
    ADD CONSTRAINT "FK_chat_room_members_room" FOREIGN KEY (room_id) REFERENCES public.chat_rooms(id) ON DELETE CASCADE;


--
-- Name: chat_room_members FK_chat_room_members_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_room_members
    ADD CONSTRAINT "FK_chat_room_members_user" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: chat_rooms FK_chat_rooms_creator; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_rooms
    ADD CONSTRAINT "FK_chat_rooms_creator" FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: chat_rooms FK_chat_rooms_group; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_rooms
    ADD CONSTRAINT "FK_chat_rooms_group" FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE SET NULL;


--
-- Name: chat_strikes FK_chat_strikes_applied_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_strikes
    ADD CONSTRAINT "FK_chat_strikes_applied_by" FOREIGN KEY (applied_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: chat_strikes FK_chat_strikes_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_strikes
    ADD CONSTRAINT "FK_chat_strikes_user" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: chat_strikes FK_chat_strikes_violation; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_strikes
    ADD CONSTRAINT "FK_chat_strikes_violation" FOREIGN KEY (violation_id) REFERENCES public.chat_violations(id) ON DELETE CASCADE;


--
-- Name: chat_violations FK_chat_violations_moderator; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_violations
    ADD CONSTRAINT "FK_chat_violations_moderator" FOREIGN KEY (moderator_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: chat_violations FK_chat_violations_room; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_violations
    ADD CONSTRAINT "FK_chat_violations_room" FOREIGN KEY (room_id) REFERENCES public.chat_rooms(id) ON DELETE CASCADE;


--
-- Name: chat_violations FK_chat_violations_sender; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_violations
    ADD CONSTRAINT "FK_chat_violations_sender" FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: activity_photos FK_d14fa034046e6a6f91bd176cec5; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_photos
    ADD CONSTRAINT "FK_d14fa034046e6a6f91bd176cec5" FOREIGN KEY (activity_id) REFERENCES public.activities(id) ON DELETE CASCADE;


--
-- Name: gradebook_categories FK_d54093de5aa4922f4baad9f7d05; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gradebook_categories
    ADD CONSTRAINT "FK_d54093de5aa4922f4baad9f7d05" FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: invoice_items FK_d6e25d9f130342c717b07a66a37; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT "FK_d6e25d9f130342c717b07a66a37" FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE SET NULL;


--
-- Name: payroll_entries FK_d89bb38d97d8b4aa20afabece3e; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_entries
    ADD CONSTRAINT "FK_d89bb38d97d8b4aa20afabece3e" FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: student_surveys FK_db9d34cf10832e0cbda0cee6be7; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_surveys
    ADD CONSTRAINT "FK_db9d34cf10832e0cbda0cee6be7" FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: gradebook_entries FK_dc50c08035a6359a11f7a00ff7d; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gradebook_entries
    ADD CONSTRAINT "FK_dc50c08035a6359a11f7a00ff7d" FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: payroll_entries FK_dc91b80cda0b7dcc3f44d50e5bf; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_entries
    ADD CONSTRAINT "FK_dc91b80cda0b7dcc3f44d50e5bf" FOREIGN KEY (payroll_period_id) REFERENCES public.payroll_periods(id) ON DELETE RESTRICT;


--
-- Name: invoice_items FK_dc991d555664682cfe892eea2c1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT "FK_dc991d555664682cfe892eea2c1" FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;


--
-- Name: enrollments FK_ddcb886503618036162eb0d9c3b; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT "FK_ddcb886503618036162eb0d9c3b" FOREIGN KEY (enrolled_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: financial_transactions FK_e05880ea239c1f7a165448c0157; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_transactions
    ADD CONSTRAINT "FK_e05880ea239c1f7a165448c0157" FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;


--
-- Name: placement_tests FK_e18113550eb18ac6a9ca503fb91; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.placement_tests
    ADD CONSTRAINT "FK_e18113550eb18ac6a9ca503fb91" FOREIGN KEY (examiner_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: students FK_e2b424d1d926ec268413c32de59; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT "FK_e2b424d1d926ec268413c32de59" FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;


--
-- Name: student_level_history FK_e430e966e59a73d7da054cae529; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_level_history
    ADD CONSTRAINT "FK_e430e966e59a73d7da054cae529" FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: groups FK_e9703f1aa2b5ae1000816cf385d; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT "FK_e9703f1aa2b5ae1000816cf385d" FOREIGN KEY (teacher_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: gradebook_entries FK_ea2cf3329379c1f25ae29ee1357; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gradebook_entries
    ADD CONSTRAINT "FK_ea2cf3329379c1f25ae29ee1357" FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: activities FK_eadf67c38263ba30b296d40f033; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT "FK_eadf67c38263ba30b296d40f033" FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: quiz_questions FK_ef08d2819d83ba3e8904e299da1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_questions
    ADD CONSTRAINT "FK_ef08d2819d83ba3e8904e299da1" FOREIGN KEY (bank_question_id) REFERENCES public.test_questions(id) ON DELETE SET NULL;


--
-- Name: waitlists FK_eff5bd6eff59d36473e2afa63af; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.waitlists
    ADD CONSTRAINT "FK_eff5bd6eff59d36473e2afa63af" FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: testimonials FK_f31145f659a2b784256a5a0c681; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.testimonials
    ADD CONSTRAINT "FK_f31145f659a2b784256a5a0c681" FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE SET NULL;


--
-- Name: attendances FK_f403e204ac9e7bcb47b81af344e; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT "FK_f403e204ac9e7bcb47b81af344e" FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: lms_lessons FK_f703bd501b910b87241a1a76fad; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lms_lessons
    ADD CONSTRAINT "FK_f703bd501b910b87241a1a76fad" FOREIGN KEY (module_id) REFERENCES public.lms_modules(id) ON DELETE CASCADE;


--
-- Name: lms_modules FK_f71a43c546ccd0a7b1a0831a625; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lms_modules
    ADD CONSTRAINT "FK_f71a43c546ccd0a7b1a0831a625" FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: student_item_issues FK_f804e139b30cb962aca679f338d; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_item_issues
    ADD CONSTRAINT "FK_f804e139b30cb962aca679f338d" FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: waitlists FK_f8549c24116e37291b336faf7e1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.waitlists
    ADD CONSTRAINT "FK_f8549c24116e37291b336faf7e1" FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;


--
-- Name: invoices FK_f8b468df52fb45053ad0c4ca38b; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT "FK_f8b468df52fb45053ad0c4ca38b" FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE RESTRICT;


--
-- Name: quizzes FK_f97c6f20022cd42831db1bd5e65; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT "FK_f97c6f20022cd42831db1bd5e65" FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: students FK_fb3eff90b11bddf7285f9b4e281; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT "FK_fb3eff90b11bddf7285f9b4e281" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: quiz_attempts FK_fcb54da39fa07acef996f75f32d; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_attempts
    ADD CONSTRAINT "FK_fcb54da39fa07acef996f75f32d" FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: leave_requests FK_fe3e6c3fea2c56aaaad8cedbc20; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT "FK_fe3e6c3fea2c56aaaad8cedbc20" FOREIGN KEY (approved_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: refunds FK_ff3564f0e4925cec019b1a60144; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT "FK_ff3564f0e4925cec019b1a60144" FOREIGN KEY (approved_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: placement_test_papers fk_ptp_test; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.placement_test_papers
    ADD CONSTRAINT fk_ptp_test FOREIGN KEY (test_id) REFERENCES public.placement_tests(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict s4MyFYpnhKa4nvkZ6btP8B2Xum97EuVfPpMhhX5QDDWm4TIey7GIpBLS3azv2i5

