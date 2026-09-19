


-- ============================================================================
-- SPEAK UP ENGLISH ACADEMY - TMS DATABASE
-- PostgreSQL 15+ DDL Script
-- Generated from SRS v1.0 | April 2026
-- FIXED: Dependency ordering corrected
-- ============================================================================
-- STEP 0: Setup Extensions & Custom Types
-- STEP 1: Core & Auth (users, roles, permissions)
-- STEP 2: Branch Management (branches, classrooms)
-- STEP 3: CRM & Leads (leads, activities, tags, follow-ups, sales_targets)
-- STEP 4: Students (students, profiles, level history)
-- STEP 5: Referrals (depends on students)
-- STEP 6: Courses & Catalog (courses, prerequisites, inventory_items, materials)
-- STEP 7: Groups & Scheduling (groups, schedules, students, waitlists)
-- STEP 8: Sessions & Attendance (sessions, attendances)
-- STEP 9: Placement Tests (slots, tests, questions, answers)
-- STEP 10: LMS Content (modules, lessons, resources)
-- STEP 11: LMS Assessments (assignments, submissions, quizzes, attempts)
-- STEP 12: Gradebook (categories, entries, evaluations, surveys)
-- STEP 13: Finance (promo_codes, enrollments, invoices, payments, installments, refunds)
-- STEP 14: Certificates (templates, certificates)
-- STEP 15: HR (employees, docs, availabilities, leaves, payroll)
-- STEP 16: Activities (activities, registrations, photos)
-- STEP 17: Inventory (stock_levels, stock_moves, student_item_issues)
-- STEP 18: Knowledge Base (categories, articles, versions)
-- STEP 19: Live Chat (rooms, members, messages, violations, strikes)
-- STEP 20: Website (blog, testimonials, page views)
-- STEP 21: System (notifications, preferences, audit logs, settings)
-- STEP 22: Views, Functions, Triggers
-- ============================================================================

-- ============================================================================
-- STEP 0: SETUP EXTENSIONS & CUSTOM TYPES
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "unaccent";
-- ============================================================================
-- CUSTOM ENUMERATIONS
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'interested', 'test_scheduled', 'enrolled', 'lost');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE lead_source AS ENUM ('walk_in', 'website', 'referral', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE activity_type AS ENUM ('call', 'note', 'follow_up', 'status_change', 'email', 'visit');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE follow_up_status AS ENUM ('pending', 'completed', 'overdue', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE student_status AS ENUM ('active', 'inactive', 'graduated', 'dropped', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE course_status AS ENUM ('active', 'inactive', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE group_mode AS ENUM ('in_person', 'online', 'hybrid');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE group_status AS ENUM ('upcoming', 'active', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE enrollment_status AS ENUM ('pending', 'active', 'completed', 'dropped', 'transferred');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'excused');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE check_in_method AS ENUM ('manual', 'qr_code', 'self_portal', 'auto');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE slot_status AS ENUM ('open', 'full', 'cancelled', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE test_status AS ENUM ('scheduled', 'in_progress', 'completed', 'no_show', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE question_type AS ENUM ('mcq', 'fill_blank', 'matching', 'true_false', 'ordering', 'short_answer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE lesson_type AS ENUM ('content', 'video', 'audio', 'interactive');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE resource_type AS ENUM ('file', 'video', 'audio', 'link', 'pdf');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE resource_access AS ENUM ('enrolled', 'public', 'restricted');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE assignment_type AS ENUM ('text', 'file_upload', 'mixed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE submission_status AS ENUM ('submitted', 'graded', 'returned', 'resubmitted');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE release_type AS ENUM ('instant', 'after_review', 'scheduled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE attempt_status AS ENUM ('in_progress', 'submitted', 'graded', 'abandoned');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE invoice_status AS ENUM ('unpaid', 'partial', 'paid', 'overdue', 'cancelled', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('cash', 'bank_transfer', 'easykash', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE installment_status AS ENUM ('pending', 'paid', 'overdue', 'partial');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE refund_reason AS ENUM ('course_cancellation', 'student_withdrawal', 'duplicate_payment', 'error', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE refund_status AS ENUM ('pending', 'approved', 'processed', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE promo_type AS ENUM ('percentage', 'fixed_amount');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE cert_status AS ENUM ('active', 'revoked', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE employee_type AS ENUM ('full_time', 'part_time', 'contract', 'hourly');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE employee_status AS ENUM ('active', 'on_leave', 'terminated', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE document_type AS ENUM ('contract', 'id', 'certificate', 'visa', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE leave_type AS ENUM ('annual', 'sick', 'emergency', 'unpaid', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE payroll_status AS ENUM ('open', 'processing', 'closed', 'exported');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE payroll_entry_status AS ENUM ('draft', 'approved', 'paid', 'disputed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE activity_event_type AS ENUM ('movie_night', 'conversation_club', 'trip', 'contest', 'workshop', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE activity_status AS ENUM ('upcoming', 'open', 'full', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE registration_status AS ENUM ('registered', 'attended', 'no_show', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE inventory_category AS ENUM ('book', 'workbook', 'merchandise', 'stationery', 'equipment', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE inventory_status AS ENUM ('active', 'discontinued', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE stock_move_type AS ENUM ('in', 'out', 'adjustment', 'return', 'transfer_in', 'transfer_out');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE item_condition AS ENUM ('good', 'damaged', 'lost');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE kb_visibility AS ENUM ('staff', 'manager', 'admin', 'teacher', 'public');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE chat_room_type AS ENUM ('one_on_one', 'group', 'announcement');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE chat_message_type AS ENUM ('text', 'emoji', 'image', 'file', 'system');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE violation_action AS ENUM ('blocked', 'warned', 'flagged_only');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE strike_action AS ENUM ('warning', 'mute_24h', 'ban_permanent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE post_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE testimonial_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE notification_channel AS ENUM ('in_app', 'email');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE actor_type AS ENUM ('user', 'system', 'api');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE transaction_direction AS ENUM ('in', 'out');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE financial_transaction_type AS ENUM ('payment', 'refund', 'expense', 'adjustment');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
   CREATE TYPE invoice_item_type AS ENUM (
    'course',
    'registration_fee',
    'book',
    'exam',
    'certificate',
    'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- HELPER FUNCTION: Auto-update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- HELPER FUNCTION: Generate student number
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_student_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.student_number := 'SU-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('student_number_seq')::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- HELPER FUNCTION: Generate invoice number
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('invoice_number_seq')::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- HELPER FUNCTION: Generate receipt number
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.receipt_number := 'RCP-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('receipt_number_seq')::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SEQUENCES FOR AUTO-NUMBERING
-- ============================================================================
CREATE SEQUENCE IF NOT EXISTS student_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS receipt_number_seq START 1;

-- ============================================================================
-- STEP 1: CORE & AUTH MODULE
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: branches (must come before users due to FK)
-- ----------------------------------------------------------------------------
CREATE TABLE branches (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(150) NOT NULL,
    address             TEXT NOT NULL,
    phone               VARCHAR(20) NOT NULL,
    email               VARCHAR(255),
    manager_id          UUID,
    classroom_count     INT DEFAULT 0 CHECK (classroom_count >= 0),
    logo_url            VARCHAR(500),
    status              user_status DEFAULT 'active',
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_branch_name_not_empty CHECK (TRIM(name) <> '')
);

CREATE INDEX idx_branches_manager ON branches(manager_id);
CREATE INDEX idx_branches_status ON branches(status);

COMMENT ON TABLE branches IS 'Physical academy locations with isolated data scopes';

CREATE TRIGGER trg_branches_updated_at
    BEFORE UPDATE ON branches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Table: users
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email               VARCHAR(255) UNIQUE NOT NULL,
    phone               VARCHAR(20) UNIQUE,
    password_hash       VARCHAR(255) NOT NULL,
    first_name          VARCHAR(100) NOT NULL,
    last_name           VARCHAR(100) NOT NULL,
    avatar_url          VARCHAR(500),
    language            VARCHAR(5) DEFAULT 'ar' CHECK (language IN ('ar', 'en')),
    branch_id           UUID,
    status              user_status DEFAULT 'active',
    email_verified_at   TIMESTAMPTZ,
    phone_verified_at   TIMESTAMPTZ,
    two_factor_enabled  BOOLEAN DEFAULT FALSE,
    two_factor_secret   VARCHAR(255),
    last_login_at       TIMESTAMPTZ,
    last_login_ip       VARCHAR(45),
	chat_policy_accepted_at TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_user_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT chk_user_name_not_empty CHECK (TRIM(first_name) <> '' AND TRIM(last_name) <> ''),
    CONSTRAINT fk_users_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_branch ON users(branch_id);
CREATE INDEX idx_users_status ON users(status);

COMMENT ON TABLE users IS 'Central identity table for all system users';

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Now add the FK from branches to users (circular dependency resolved)
ALTER TABLE branches ADD CONSTRAINT fk_branches_manager 
    FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL;

-- ----------------------------------------------------------------------------
-- Table: roles
-- ----------------------------------------------------------------------------
CREATE TABLE roles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(100) NOT NULL UNIQUE,
    slug            VARCHAR(100) NOT NULL UNIQUE,
    description     TEXT,
    is_custom       BOOLEAN DEFAULT FALSE,
    is_system       BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE roles IS 'RBAC role definitions (templates + custom)';

-- ----------------------------------------------------------------------------
-- Table: permissions
-- ----------------------------------------------------------------------------
CREATE TABLE permissions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module          VARCHAR(50) NOT NULL,
    action          VARCHAR(50) NOT NULL,
    description     VARCHAR(255),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_permissions_module_action UNIQUE (module, action)
);

CREATE INDEX idx_permissions_module ON permissions(module);

COMMENT ON TABLE permissions IS 'Granular permission matrix (module x action)';

-- ----------------------------------------------------------------------------
-- Table: role_permissions (junction)
-- ----------------------------------------------------------------------------
CREATE TABLE role_permissions (
    role_id         UUID NOT NULL,
    permission_id   UUID NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_rp_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_rp_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

COMMENT ON TABLE role_permissions IS 'Many-to-many junction between roles and permissions';

-- ----------------------------------------------------------------------------
-- Table: user_roles (junction)
-- ----------------------------------------------------------------------------
CREATE TABLE user_roles (
    user_id     UUID NOT NULL,
    role_id     UUID NOT NULL,
    assigned_by UUID,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_ur_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_ur_assigned_by FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
);

COMMENT ON TABLE user_roles IS 'Assigns one or more roles to a user';

-- ============================================================================
-- STEP 2: BRANCH MANAGEMENT
-- ============================================================================

CREATE TABLE classrooms (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id   UUID NOT NULL,
    name        VARCHAR(100) NOT NULL,
    capacity    INT DEFAULT 20 CHECK (capacity > 0),
    type        VARCHAR(20) DEFAULT 'standard' CHECK (type IN ('standard', 'lab', 'conference', 'online')),
    status      user_status DEFAULT 'active',
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_classrooms_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    CONSTRAINT chk_classroom_name_not_empty CHECK (TRIM(name) <> '')
);

CREATE INDEX idx_classrooms_branch ON classrooms(branch_id);
CREATE INDEX idx_classrooms_status ON classrooms(status);

COMMENT ON TABLE classrooms IS 'Physical rooms within a branch';

-- ============================================================================
-- STEP 3: CRM & LEADS
-- ============================================================================

CREATE TABLE leads (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name              VARCHAR(100) NOT NULL,
    last_name               VARCHAR(100) NOT NULL,
    phone                   VARCHAR(20) NOT NULL,
    email                   VARCHAR(255),
    national_id             VARCHAR(50),
    source                  lead_source NOT NULL,
    status                  lead_status DEFAULT 'new',
    level_interest          VARCHAR(10) CHECK (level_interest IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Beginner', 'Intermediate', 'Advanced')),
    notes                   TEXT,
    assigned_to             UUID,
    branch_id               UUID,
    converted_to_student_id UUID,
    converted_at            TIMESTAMPTZ,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_leads_assigned_to FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_leads_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
    CONSTRAINT chk_lead_name_not_empty CHECK (TRIM(first_name) <> '' AND TRIM(last_name) <> ''),
    CONSTRAINT chk_lead_phone_not_empty CHECK (TRIM(phone) <> '')
);

CREATE INDEX idx_leads_phone ON leads(phone);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_assigned ON leads(assigned_to);
CREATE INDEX idx_leads_branch ON leads(branch_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_converted ON leads(converted_to_student_id);
CREATE INDEX idx_leads_created ON leads(created_at);
CREATE INDEX idx_leads_active ON leads(status) WHERE status NOT IN ('enrolled', 'lost');

COMMENT ON TABLE leads IS 'Prospective students before enrollment. Core CRM entity';

CREATE TRIGGER trg_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE lead_activities (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id         UUID NOT NULL,
    type            activity_type NOT NULL,
    note            TEXT,
    old_status      VARCHAR(50),
    new_status      VARCHAR(50),
    scheduled_at    TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    created_by      UUID,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_la_lead FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    CONSTRAINT fk_la_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_la_lead ON lead_activities(lead_id);
CREATE INDEX idx_la_type ON lead_activities(type);
CREATE INDEX idx_la_created_by ON lead_activities(created_by);
CREATE INDEX idx_la_scheduled ON lead_activities(scheduled_at) WHERE scheduled_at IS NOT NULL;

COMMENT ON TABLE lead_activities IS 'Activity log per lead (calls, notes, follow-ups, status changes)';

CREATE TABLE lead_tags (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(50) NOT NULL,
    color       VARCHAR(7) DEFAULT '#000000' CHECK (color ~* '^#[0-9A-Fa-f]{6}$'),
    branch_id   UUID,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_lt_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);

CREATE INDEX idx_lt_branch ON lead_tags(branch_id);

COMMENT ON TABLE lead_tags IS 'Segmentation tags for leads';

CREATE TABLE lead_tag_pivot (
    lead_id     UUID NOT NULL,
    tag_id      UUID NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (lead_id, tag_id),
    CONSTRAINT fk_ltp_lead FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    CONSTRAINT fk_ltp_tag FOREIGN KEY (tag_id) REFERENCES lead_tags(id) ON DELETE CASCADE
);

COMMENT ON TABLE lead_tag_pivot IS 'Many-to-many lead-tag junction';

CREATE TABLE follow_ups (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id         UUID NOT NULL,
    assigned_to     UUID NOT NULL,
    due_date        TIMESTAMPTZ NOT NULL,
    status          follow_up_status DEFAULT 'pending',
    note            TEXT,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_fu_lead FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    CONSTRAINT fk_fu_assigned FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_fu_lead ON follow_ups(lead_id);
CREATE INDEX idx_fu_assigned ON follow_ups(assigned_to);
CREATE INDEX idx_fu_due_date ON follow_ups(due_date);
CREATE INDEX idx_fu_status ON follow_ups(status);
CREATE INDEX idx_fu_active ON follow_ups(status) WHERE status = 'pending';

COMMENT ON TABLE follow_ups IS 'Dedicated follow-up reminder system';

CREATE TABLE sales_targets (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id                UUID NOT NULL,
    month                   INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year                    INT NOT NULL CHECK (year >= 2020),
    target_amount           DECIMAL(12,2) NOT NULL CHECK (target_amount >= 0),
    target_conversions      INT DEFAULT 0 CHECK (target_conversions >= 0),
    achieved_amount         DECIMAL(12,2) DEFAULT 0 CHECK (achieved_amount >= 0),
    achieved_conversions    INT DEFAULT 0 CHECK (achieved_conversions >= 0),
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_sales_targets_agent_month_year UNIQUE (agent_id, month, year),
    CONSTRAINT fk_st_agent FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_st_agent ON sales_targets(agent_id);
CREATE INDEX idx_st_period ON sales_targets(year, month);

COMMENT ON TABLE sales_targets IS 'Monthly sales goals per agent';

-- NOTE: referrals table is deferred to Step 5 because it references students
-- which doesn't exist yet at this point

-- ============================================================================
-- STEP 4: STUDENTS
-- ============================================================================
CREATE TABLE students (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID UNIQUE NOT NULL,
    student_number      VARCHAR(50) UNIQUE NOT NULL,
    current_level       VARCHAR(10) CHECK (current_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Beginner', 'Intermediate', 'Advanced')),
    status              student_status DEFAULT 'active',
    enrollment_date     DATE,
    branch_id           UUID,
    placement_test_id   UUID,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_students_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_students_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);

CREATE INDEX idx_students_user ON students(user_id);
CREATE INDEX idx_students_number ON students(student_number);
CREATE INDEX idx_students_branch ON students(branch_id);
CREATE INDEX idx_students_status ON students(status);

COMMENT ON TABLE students IS 'Enrolled learner profile. Extends users with academic data';

CREATE TRIGGER trg_students_number
    BEFORE INSERT ON students
    FOR EACH ROW EXECUTE FUNCTION generate_student_number();

CREATE TRIGGER trg_students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE student_profiles (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id                  UUID UNIQUE NOT NULL,
    photo_url                   VARCHAR(500),
    date_of_birth               DATE,
    gender                      VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    address                     TEXT,
    national_id                 VARCHAR(50),
    education_level             VARCHAR(100),
    emergency_contact_name      VARCHAR(150),
    emergency_contact_phone     VARCHAR(20),
    emergency_contact_relation  VARCHAR(50),
    notes                       TEXT,
    created_at                  TIMESTAMPTZ DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_sp_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE INDEX idx_sp_student ON student_profiles(student_id);

COMMENT ON TABLE student_profiles IS 'Extended PII and demographic data (encrypted at rest per NFR 7.3)';

CREATE TRIGGER trg_student_profiles_updated_at
    BEFORE UPDATE ON student_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE student_level_history (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id      UUID NOT NULL,
    old_level       VARCHAR(10) NOT NULL,
    new_level       VARCHAR(10) NOT NULL,
    reason          VARCHAR(50) NOT NULL CHECK (reason IN ('placement_test', 'course_completion', 'manual_override')),
    reference_id    UUID,
    changed_by      UUID,
    changed_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_slh_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_slh_changed_by FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_slh_student ON student_level_history(student_id);
CREATE INDEX idx_slh_changed_at ON student_level_history(changed_at);

COMMENT ON TABLE student_level_history IS 'Track level progression over time';

-- ============================================================================
-- STEP 5: REFERRALS (depends on students - created AFTER students table)
-- ============================================================================

CREATE TABLE referrals (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_student_id     UUID NOT NULL,
    referred_lead_id        UUID,
    referred_student_id     UUID,
    credit_amount           DECIMAL(10,2) DEFAULT 0 CHECK (credit_amount >= 0),
    status                  VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'credited', 'expired')),
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_ref_referrer FOREIGN KEY (referrer_student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_ref_lead FOREIGN KEY (referred_lead_id) REFERENCES leads(id) ON DELETE SET NULL,
    CONSTRAINT fk_ref_referred_student FOREIGN KEY (referred_student_id) REFERENCES students(id) ON DELETE SET NULL,
    CONSTRAINT chk_ref_target CHECK (referred_lead_id IS NOT NULL OR referred_student_id IS NOT NULL)
);

CREATE INDEX idx_ref_referrer ON referrals(referrer_student_id);
CREATE INDEX idx_ref_lead ON referrals(referred_lead_id);
CREATE INDEX idx_ref_referred_student ON referrals(referred_student_id);

COMMENT ON TABLE referrals IS 'Student-refers-student tracking with credits';

-- ============================================================================
-- STEP 6: COURSES & CATALOG
-- ============================================================================

CREATE TABLE courses (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(200) NOT NULL,
    code            VARCHAR(50) UNIQUE,
    level           VARCHAR(10) NOT NULL CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    duration_hours  INT NOT NULL CHECK (duration_hours > 0),
    syllabus        TEXT,
    description     TEXT,
    default_price   DECIMAL(10,2) NOT NULL CHECK (default_price >= 0),
    min_age         INT CHECK (min_age >= 0),
    max_age         INT CHECK (max_age >= min_age),
    status          course_status DEFAULT 'active',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_course_name_not_empty CHECK (TRIM(name) <> '')
);

CREATE INDEX idx_courses_level ON courses(level);
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_courses_code ON courses(code);

COMMENT ON TABLE courses IS 'Master course definitions';

CREATE TRIGGER trg_courses_updated_at
    BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE course_prerequisites (
    course_id               UUID NOT NULL,
    prerequisite_course_id  UUID NOT NULL,
    is_strict               BOOLEAN DEFAULT TRUE,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (course_id, prerequisite_course_id),
    CONSTRAINT fk_cp_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    CONSTRAINT fk_cp_prereq FOREIGN KEY (prerequisite_course_id) REFERENCES courses(id) ON DELETE CASCADE,
    CONSTRAINT chk_cp_no_self_ref CHECK (course_id <> prerequisite_course_id)
);

COMMENT ON TABLE course_prerequisites IS 'Many-to-many course dependency chain';

-- Inventory items needed before course_materials
CREATE TABLE inventory_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku             VARCHAR(50) UNIQUE,
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    category        inventory_category NOT NULL,
    unit_cost       DECIMAL(10,2) DEFAULT 0 CHECK (unit_cost >= 0),
    sale_price      DECIMAL(10,2) DEFAULT 0 CHECK (sale_price >= 0),
    unit_of_measure VARCHAR(20) DEFAULT 'piece',
    reorder_level   INT DEFAULT 10 CHECK (reorder_level >= 0),
    status          inventory_status DEFAULT 'active',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_item_name_not_empty CHECK (TRIM(name) <> '')
);

CREATE INDEX idx_items_sku ON inventory_items(sku);
CREATE INDEX idx_items_category ON inventory_items(category);
CREATE INDEX idx_items_status ON inventory_items(status);

COMMENT ON TABLE inventory_items IS 'Master catalog of training materials';

CREATE TRIGGER trg_inventory_items_updated_at
    BEFORE UPDATE ON inventory_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE course_materials (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id           UUID NOT NULL,
    inventory_item_id   UUID NOT NULL,
    is_required         BOOLEAN DEFAULT TRUE,
    quantity_per_student INT DEFAULT 1 CHECK (quantity_per_student > 0),
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_cm_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    CONSTRAINT fk_cm_item FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE
);

CREATE INDEX idx_cm_course ON course_materials(course_id);
CREATE INDEX idx_cm_item ON course_materials(inventory_item_id);

COMMENT ON TABLE course_materials IS 'Links courses to inventory items (books, workbooks)';

-- ============================================================================
-- STEP 7: GROUPS & SCHEDULING
-- ============================================================================

CREATE TABLE groups (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                    VARCHAR(150) NOT NULL,
    course_id               UUID NOT NULL,
    teacher_id              UUID NOT NULL,
    substitute_teacher_id   UUID,
    branch_id               UUID NOT NULL,
    capacity                INT NOT NULL CHECK (capacity > 0),
    mode                    group_mode DEFAULT 'in_person',
    zoom_meeting_id         VARCHAR(100),
    zoom_link               VARCHAR(500),
    onmeet_link             VARCHAR(500),
    onmeet_meeting_id       VARCHAR(100),
    start_date              DATE NOT NULL,
    end_date                DATE NOT NULL,
    status                  group_status DEFAULT 'upcoming',
    created_by              UUID,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_groups_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE RESTRICT,
    CONSTRAINT fk_groups_teacher FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_groups_sub_teacher FOREIGN KEY (substitute_teacher_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_groups_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT,
    CONSTRAINT fk_groups_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_group_dates CHECK (end_date >= start_date),
    CONSTRAINT chk_group_name_not_empty CHECK (TRIM(name) <> '')
);

CREATE INDEX idx_groups_course ON groups(course_id);
CREATE INDEX idx_groups_teacher ON groups(teacher_id);
CREATE INDEX idx_groups_branch ON groups(branch_id);
CREATE INDEX idx_groups_status ON groups(status);
CREATE INDEX idx_groups_mode ON groups(mode);
CREATE INDEX idx_groups_dates ON groups(start_date, end_date);

COMMENT ON TABLE groups IS 'Scheduled cohort of students (a class)';

CREATE TRIGGER trg_groups_updated_at
    BEFORE UPDATE ON groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add FK from students to groups (deferred since groups didn't exist when students was created)
--ALTER TABLE students ADD CONSTRAINT fk_students_current_group 
  --  FOREIGN KEY (current_group_id) REFERENCES groups(id) ON DELETE SET NULL;

CREATE TABLE group_schedules (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id        UUID NOT NULL,
    day_of_week     INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time      TIME NOT NULL,
    end_time        TIME NOT NULL,
    classroom_id    UUID,
    is_recurring    BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_gs_group FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    CONSTRAINT fk_gs_classroom FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE SET NULL,
    CONSTRAINT chk_gs_time CHECK (end_time > start_time)
);

CREATE INDEX idx_gs_group ON group_schedules(group_id);
CREATE INDEX idx_gs_day ON group_schedules(day_of_week);
CREATE INDEX idx_gs_classroom ON group_schedules(classroom_id);

COMMENT ON TABLE group_schedules IS 'Recurring weekly schedule for a group';

CREATE TABLE group_students (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id        UUID NOT NULL,
    student_id      UUID NOT NULL,
    enrolled_at     TIMESTAMPTZ DEFAULT NOW(),
    enrolled_by     UUID,
    status          VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'dropped', 'transferred', 'completed')),
    dropped_at      TIMESTAMPTZ,
    drop_reason     TEXT,
    CONSTRAINT uq_group_students UNIQUE (group_id, student_id),
    CONSTRAINT fk_gs_group_ref FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    CONSTRAINT fk_gs_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_gs_enrolled_by FOREIGN KEY (enrolled_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_gs_group_ref ON group_students(group_id);
CREATE INDEX idx_gs_student ON group_students(student_id);
CREATE INDEX idx_gs_status ON group_students(status);

COMMENT ON TABLE group_students IS 'Many-to-many enrollment with metadata';

CREATE TABLE waitlists (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id      UUID NOT NULL,
    course_id       UUID NOT NULL,
    level           VARCHAR(10) NOT NULL,
    branch_id       UUID,
    priority        INT DEFAULT 0,
    status          VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'enrolled', 'expired', 'cancelled')),
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    enrolled_at     TIMESTAMPTZ,
    CONSTRAINT fk_wl_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_wl_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    CONSTRAINT fk_wl_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);

CREATE INDEX idx_wl_student ON waitlists(student_id);
CREATE INDEX idx_wl_course ON waitlists(course_id);
CREATE INDEX idx_wl_branch ON waitlists(branch_id);
CREATE INDEX idx_wl_status ON waitlists(status);
CREATE INDEX idx_wl_priority ON waitlists(priority DESC);
CREATE INDEX idx_wl_active ON waitlists(status) WHERE status IN ('waiting', 'notified');

COMMENT ON TABLE waitlists IS 'Queue for students waiting for a group slot';

-- ============================================================================
-- STEP 8: SESSIONS & ATTENDANCE
-- ============================================================================

CREATE TABLE sessions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id            UUID NOT NULL,
    date                DATE NOT NULL,
    start_time          TIME NOT NULL,
    end_time            TIME NOT NULL,
    classroom_id        UUID,
    mode                group_mode NOT NULL,
    zoom_meeting_id     VARCHAR(100),
    zoom_join_url       VARCHAR(500),
    onmeet_meeting_id   VARCHAR(100),
    recording_url       VARCHAR(500),
    topic               VARCHAR(255),
    notes               TEXT,
    attendance_locked   BOOLEAN DEFAULT FALSE,
    cancelled_at        TIMESTAMPTZ,
    cancellation_reason TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_sessions_group FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    CONSTRAINT fk_sessions_classroom FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE SET NULL,
    CONSTRAINT chk_session_time CHECK (end_time > start_time)
);

CREATE INDEX idx_sessions_group ON sessions(group_id);
CREATE INDEX idx_sessions_date ON sessions(date);
CREATE INDEX idx_sessions_classroom ON sessions(classroom_id);
CREATE INDEX idx_sessions_mode ON sessions(mode);
CREATE INDEX idx_sessions_group_date ON sessions(group_id, date);

COMMENT ON TABLE sessions IS 'Individual class occurrence (instance of a group schedule)';

CREATE TABLE attendances (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id      UUID NOT NULL,
    student_id      UUID NOT NULL,
    status          attendance_status NOT NULL,
    check_in_method check_in_method DEFAULT 'manual',
    check_in_time   TIMESTAMPTZ,
    minutes_late    INT DEFAULT 0 CHECK (minutes_late >= 0),
    notes           TEXT,
    created_by      UUID,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_attendance UNIQUE (session_id, student_id),
    CONSTRAINT fk_att_session FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    CONSTRAINT fk_att_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_att_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_att_session ON attendances(session_id);
CREATE INDEX idx_att_student ON attendances(student_id);
CREATE INDEX idx_att_status ON attendances(status);
CREATE INDEX idx_att_created ON attendances(created_at);

COMMENT ON TABLE attendances IS 'Student presence record per session';

CREATE TRIGGER trg_attendances_updated_at
    BEFORE UPDATE ON attendances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 9: PLACEMENT TESTS
-- ============================================================================

CREATE TABLE test_slots (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id       UUID NOT NULL,
    examiner_id     UUID NOT NULL,
    date            DATE NOT NULL,
    start_time      TIME NOT NULL,
    end_time        TIME NOT NULL,
    mode            group_mode DEFAULT 'in_person',
    capacity        INT DEFAULT 1 CHECK (capacity > 0),
    booked_count    INT DEFAULT 0 CHECK (booked_count >= 0),
    status          slot_status DEFAULT 'open',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_ts_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    CONSTRAINT fk_ts_examiner FOREIGN KEY (examiner_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT chk_ts_time CHECK (end_time > start_time),
    CONSTRAINT chk_ts_capacity CHECK (booked_count <= capacity)
);

CREATE INDEX idx_ts_branch ON test_slots(branch_id);
CREATE INDEX idx_ts_examiner ON test_slots(examiner_id);
CREATE INDEX idx_ts_date ON test_slots(date);
CREATE INDEX idx_ts_status ON test_slots(status);

COMMENT ON TABLE test_slots IS 'Available appointment slots for placement tests';

CREATE TABLE placement_tests (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id             UUID,
    student_id          UUID,
    slot_id             UUID NOT NULL,
    examiner_id         UUID NOT NULL,
    scheduled_at        TIMESTAMPTZ NOT NULL,
    written_score       DECIMAL(5,2) CHECK (written_score >= 0),
    written_max         DECIMAL(5,2) DEFAULT 100 CHECK (written_max > 0),
    oral_score          DECIMAL(5,2) CHECK (oral_score >= 0),
    oral_max            DECIMAL(5,2) DEFAULT 100 CHECK (oral_max > 0),
    suggested_level     VARCHAR(10) CHECK (suggested_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    final_level         VARCHAR(10) CHECK (final_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    override_reason     TEXT,
    examiner_notes      TEXT,
    status              test_status DEFAULT 'scheduled',
    result_sent_at      TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_pt_lead FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL,
    CONSTRAINT fk_pt_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL,
    CONSTRAINT fk_pt_slot FOREIGN KEY (slot_id) REFERENCES test_slots(id) ON DELETE RESTRICT,
    CONSTRAINT fk_pt_examiner FOREIGN KEY (examiner_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT chk_pt_target CHECK (
    (lead_id IS NOT NULL AND student_id IS NULL) OR 
    (lead_id IS NULL AND student_id IS NOT NULL)
     ),
    CONSTRAINT chk_pt_written_score CHECK (written_score IS NULL OR written_score <= written_max),
    CONSTRAINT chk_pt_oral_score CHECK (oral_score IS NULL OR oral_score <= oral_max)
);

CREATE INDEX idx_pt_lead ON placement_tests(lead_id);
CREATE INDEX idx_pt_student ON placement_tests(student_id);
CREATE INDEX idx_pt_slot ON placement_tests(slot_id);
CREATE INDEX idx_pt_examiner ON placement_tests(examiner_id);
CREATE INDEX idx_pt_status ON placement_tests(status);

COMMENT ON TABLE placement_tests IS 'Actual test instance for a lead/student';

-- Add FK from students to placement_tests (deferred)
ALTER TABLE students ADD CONSTRAINT fk_students_placement_test 
    FOREIGN KEY (placement_test_id) REFERENCES placement_tests(id) ON DELETE SET NULL;

CREATE TRIGGER trg_placement_tests_updated_at
    BEFORE UPDATE ON placement_tests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE test_questions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_text   TEXT NOT NULL,
    type            question_type NOT NULL,
    options         JSONB,
    correct_answer  JSONB NOT NULL,
    explanation     TEXT,
    level           VARCHAR(10) NOT NULL CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    category        VARCHAR(50) CHECK (category IN ('grammar', 'vocab', 'reading', 'listening', 'writing', 'speaking')),
    points          INT DEFAULT 1 CHECK (points > 0),
    is_active       BOOLEAN DEFAULT TRUE,
    created_by      UUID,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_tq_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_tq_level ON test_questions(level);
CREATE INDEX idx_tq_category ON test_questions(category);
CREATE INDEX idx_tq_type ON test_questions(type);
CREATE INDEX idx_tq_active ON test_questions(is_active);
CREATE INDEX idx_tq_created_by ON test_questions(created_by);

COMMENT ON TABLE test_questions IS 'Question bank for written tests (reusable across quizzes)';

CREATE TABLE placement_test_answers (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_id         UUID NOT NULL,
    question_id     UUID NOT NULL,
    answer          JSONB NOT NULL,
    score           DECIMAL(5,2) DEFAULT 0 CHECK (score >= 0),
    is_correct      BOOLEAN,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_pta_test_question UNIQUE (test_id, question_id),
    CONSTRAINT fk_pta_test FOREIGN KEY (test_id) REFERENCES placement_tests(id) ON DELETE CASCADE,
    CONSTRAINT fk_pta_question FOREIGN KEY (question_id) REFERENCES test_questions(id) ON DELETE RESTRICT
);

CREATE INDEX idx_pta_test ON placement_test_answers(test_id);
CREATE INDEX idx_pta_question ON placement_test_answers(question_id);

COMMENT ON TABLE placement_test_answers IS 'Student responses to written test questions';

-- ============================================================================
-- STEP 10: LMS - CONTENT
-- ============================================================================

CREATE TABLE lms_modules (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id        UUID NOT NULL,
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    "order"         INT NOT NULL CHECK ("order" > 0),
    is_published    BOOLEAN DEFAULT FALSE,
    published_at    TIMESTAMPTZ,
    created_by      UUID,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_lm_group FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    CONSTRAINT fk_lm_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_lm_name_not_empty CHECK (TRIM(name) <> '')
);

CREATE INDEX idx_lm_group ON lms_modules(group_id);
CREATE INDEX idx_lm_order ON lms_modules("order");
CREATE INDEX idx_lm_published ON lms_modules(is_published);

COMMENT ON TABLE lms_modules IS 'Top-level content container within a group';

CREATE TRIGGER trg_lms_modules_updated_at
    BEFORE UPDATE ON lms_modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE lms_lessons (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id       UUID NOT NULL,
    name            VARCHAR(200) NOT NULL,
    content         TEXT,
    type            lesson_type DEFAULT 'content',
    duration_minutes INT CHECK (duration_minutes > 0),
    "order"         INT NOT NULL CHECK ("order" > 0),
    is_published    BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_ll_module FOREIGN KEY (module_id) REFERENCES lms_modules(id) ON DELETE CASCADE,
    CONSTRAINT chk_ll_name_not_empty CHECK (TRIM(name) <> '')
);

CREATE INDEX idx_ll_module ON lms_lessons(module_id);
CREATE INDEX idx_ll_order ON lms_lessons("order");
CREATE INDEX idx_ll_published ON lms_lessons(is_published);

COMMENT ON TABLE lms_lessons IS 'Individual lesson within a module';

CREATE TRIGGER trg_lms_lessons_updated_at
    BEFORE UPDATE ON lms_lessons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE lms_resources (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id       UUID NOT NULL,
    name            VARCHAR(255) NOT NULL,
    type            resource_type NOT NULL,
    file_url        VARCHAR(500),
    file_size       BIGINT CHECK (file_size >= 0),
    mime_type       VARCHAR(100),
    external_url    VARCHAR(500),
    access_control  resource_access DEFAULT 'enrolled',
    download_count  INT DEFAULT 0 CHECK (download_count >= 0),
    watermark_text  VARCHAR(100),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_lr_lesson FOREIGN KEY (lesson_id) REFERENCES lms_lessons(id) ON DELETE CASCADE,
    CONSTRAINT chk_lr_name_not_empty CHECK (TRIM(name) <> '')
);

CREATE INDEX idx_lr_lesson ON lms_resources(lesson_id);
CREATE INDEX idx_lr_type ON lms_resources(type);
CREATE INDEX idx_lr_access ON lms_resources(access_control);

COMMENT ON TABLE lms_resources IS 'Files, links, videos attached to lessons';

-- ============================================================================
-- STEP 11: LMS - ASSESSMENTS
-- ============================================================================

CREATE TABLE assignments (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id                UUID NOT NULL,
    title                   VARCHAR(255) NOT NULL,
    description             TEXT,
    type                    assignment_type DEFAULT 'file_upload',
    due_at                  TIMESTAMPTZ NOT NULL,
    max_grade               DECIMAL(5,2) DEFAULT 100 CHECK (max_grade > 0),
    allow_late_submission   BOOLEAN DEFAULT FALSE,
    late_penalty_percent    INT DEFAULT 0 CHECK (late_penalty_percent BETWEEN 0 AND 100),
    is_published            BOOLEAN DEFAULT FALSE,
    created_by              UUID,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_asgn_group FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    CONSTRAINT fk_asgn_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_asgn_title_not_empty CHECK (TRIM(title) <> '')
);

CREATE INDEX idx_asgn_group ON assignments(group_id);
CREATE INDEX idx_asgn_due ON assignments(due_at);
CREATE INDEX idx_asgn_published ON assignments(is_published);

COMMENT ON TABLE assignments IS 'Homework or tasks for a group';

CREATE TRIGGER trg_assignments_updated_at
    BEFORE UPDATE ON assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE submissions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id   UUID NOT NULL,
    student_id      UUID NOT NULL,
    content         TEXT,
    file_url        VARCHAR(500),
    file_name       VARCHAR(255),
    submitted_at    TIMESTAMPTZ DEFAULT NOW(),
    is_late         BOOLEAN DEFAULT FALSE,
    grade           DECIMAL(5,2) CHECK (grade IS NULL OR grade >= 0),
    feedback        TEXT,
    graded_by       UUID,
    graded_at       TIMESTAMPTZ,
    status          submission_status DEFAULT 'submitted',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_submission UNIQUE (assignment_id, student_id),
    CONSTRAINT fk_sub_assignment FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    CONSTRAINT fk_sub_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_sub_graded_by FOREIGN KEY (graded_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_sub_assignment ON submissions(assignment_id);
CREATE INDEX idx_sub_student ON submissions(student_id);
CREATE INDEX idx_sub_status ON submissions(status);
CREATE INDEX idx_sub_graded_by ON submissions(graded_by);

COMMENT ON TABLE submissions IS 'Student assignment uploads';

CREATE TRIGGER trg_submissions_updated_at
    BEFORE UPDATE ON submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE quizzes (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id            UUID NOT NULL,
    title               VARCHAR(255) NOT NULL,
    description         TEXT,
    time_limit_minutes  INT CHECK (time_limit_minutes IS NULL OR time_limit_minutes > 0),
    max_attempts        INT DEFAULT 1 CHECK (max_attempts > 0),
    shuffle_questions   BOOLEAN DEFAULT FALSE,
    shuffle_options     BOOLEAN DEFAULT FALSE,
    release_type        release_type DEFAULT 'instant',
    release_at          TIMESTAMPTZ,
    passing_score       DECIMAL(5,2) DEFAULT 60 CHECK (passing_score >= 0 AND passing_score <= 100),
    is_published        BOOLEAN DEFAULT FALSE,
    created_by          UUID,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_quiz_group FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    CONSTRAINT fk_quiz_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_quiz_title_not_empty CHECK (TRIM(title) <> '')
);

CREATE INDEX idx_quiz_group ON quizzes(group_id);
CREATE INDEX idx_quiz_published ON quizzes(is_published);
CREATE INDEX idx_quiz_release ON quizzes(release_type);

COMMENT ON TABLE quizzes IS 'Tests and quizzes for a group';

CREATE TRIGGER trg_quizzes_updated_at
    BEFORE UPDATE ON quizzes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE quiz_questions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id         UUID NOT NULL,
    bank_question_id UUID,
    question_text   TEXT NOT NULL,
    type            question_type NOT NULL,
    options         JSONB,
    correct_answer  JSONB NOT NULL,
    points          INT DEFAULT 1 CHECK (points > 0),
    "order"         INT NOT NULL CHECK ("order" > 0),
    media_url       VARCHAR(500),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_qq_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    CONSTRAINT fk_qq_bank FOREIGN KEY (bank_question_id) REFERENCES test_questions(id) ON DELETE SET NULL
);

CREATE INDEX idx_qq_quiz ON quiz_questions(quiz_id);
CREATE INDEX idx_qq_order ON quiz_questions("order");
CREATE INDEX idx_qq_type ON quiz_questions(type);

COMMENT ON TABLE quiz_questions IS 'Questions within a quiz (can reuse from bank or be quiz-specific)';

CREATE TABLE quiz_attempts (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id             UUID NOT NULL,
    student_id          UUID NOT NULL,
    attempt_number      INT NOT NULL CHECK (attempt_number > 0),
    answers             JSONB NOT NULL,
    score               DECIMAL(5,2) CHECK (score IS NULL OR score >= 0),
    percentage          DECIMAL(5,2) CHECK (percentage IS NULL OR (percentage >= 0 AND percentage <= 100)),
    is_passed           BOOLEAN,
    started_at          TIMESTAMPTZ NOT NULL,
    submitted_at        TIMESTAMPTZ,
    time_spent_seconds  INT CHECK (time_spent_seconds IS NULL OR time_spent_seconds >= 0),
    status              attempt_status DEFAULT 'in_progress',
    graded_by           UUID,
    graded_at           TIMESTAMPTZ,
    ip_address          VARCHAR(45),
    user_agent          TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_quiz_attempt UNIQUE (quiz_id, student_id, attempt_number),
    CONSTRAINT fk_qa_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    CONSTRAINT fk_qa_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_qa_graded_by FOREIGN KEY (graded_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_qa_quiz ON quiz_attempts(quiz_id);
CREATE INDEX idx_qa_student ON quiz_attempts(student_id);
CREATE INDEX idx_qa_status ON quiz_attempts(status);
CREATE INDEX idx_qa_score ON quiz_attempts(score);

COMMENT ON TABLE quiz_attempts IS 'Student quiz session with proctoring info';

-- ============================================================================
-- STEP 12: LMS - GRADEBOOK
-- ============================================================================

CREATE TABLE gradebook_categories (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id    UUID NOT NULL,
    name        VARCHAR(100) NOT NULL,
    weight      DECIMAL(5,2) NOT NULL CHECK (weight > 0 AND weight <= 100),
    "order"     INT NOT NULL CHECK ("order" > 0),
    created_by  UUID,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_gc_group FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    CONSTRAINT fk_gc_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_gc_name_not_empty CHECK (TRIM(name) <> '')
);

CREATE INDEX idx_gc_group ON gradebook_categories(group_id);
CREATE INDEX idx_gc_order ON gradebook_categories("order");

COMMENT ON TABLE gradebook_categories IS 'Weighted grading components (attendance, assignments, midterm, final)';

CREATE TABLE gradebook_entries (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id        UUID NOT NULL,
    student_id      UUID NOT NULL,
    category_id     UUID NOT NULL,
    score           DECIMAL(5,2) NOT NULL CHECK (score >= 0),
    max_score       DECIMAL(5,2) NOT NULL CHECK (max_score > 0),
    percentage      DECIMAL(5,2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
    weighted_score  DECIMAL(5,2) NOT NULL,
    reference_type  VARCHAR(50) CHECK (reference_type IN ('quiz', 'assignment', 'attendance', 'manual')),
    reference_id    UUID,
    notes           TEXT,
    created_by      UUID,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_gradebook_entry UNIQUE (group_id, student_id, category_id, reference_type, reference_id),
    CONSTRAINT fk_ge_group FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    CONSTRAINT fk_ge_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_ge_category FOREIGN KEY (category_id) REFERENCES gradebook_categories(id) ON DELETE CASCADE,
    CONSTRAINT fk_ge_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_ge_group ON gradebook_entries(group_id);
CREATE INDEX idx_ge_student ON gradebook_entries(student_id);
CREATE INDEX idx_ge_category ON gradebook_entries(category_id);

COMMENT ON TABLE gradebook_entries IS 'Individual scores per student per category';

CREATE TRIGGER trg_gradebook_entries_updated_at
    BEFORE UPDATE ON gradebook_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE teacher_evaluations (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id                UUID NOT NULL,
    student_id              UUID NOT NULL,
    teacher_id              UUID NOT NULL,
    term                    VARCHAR(50) NOT NULL,
    form_data               JSONB NOT NULL,
    overall_comment         TEXT,
    is_shared_with_student  BOOLEAN DEFAULT FALSE,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_te_group FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    CONSTRAINT fk_te_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_te_teacher FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_te_group ON teacher_evaluations(group_id);
CREATE INDEX idx_te_student ON teacher_evaluations(student_id);
CREATE INDEX idx_te_teacher ON teacher_evaluations(teacher_id);

COMMENT ON TABLE teacher_evaluations IS 'Teacher → student feedback per term';

CREATE TRIGGER trg_teacher_evaluations_updated_at
    BEFORE UPDATE ON teacher_evaluations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE student_surveys (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id        UUID NOT NULL,
    student_id      UUID NOT NULL,
    teacher_id      UUID NOT NULL,
    term            VARCHAR(50) NOT NULL,
    responses       JSONB NOT NULL,
    overall_rating  INT CHECK (overall_rating IS NULL OR (overall_rating >= 1 AND overall_rating <= 5)),
    comment         TEXT,
    is_anonymous    BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_ss_group FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    CONSTRAINT fk_ss_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_ss_teacher FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_ss_group ON student_surveys(group_id);
CREATE INDEX idx_ss_student ON student_surveys(student_id);
CREATE INDEX idx_ss_teacher ON student_surveys(teacher_id);

COMMENT ON TABLE student_surveys IS 'Student → teacher/course evaluation survey per term';

-- ============================================================================
-- STEP 13: FINANCE & PAYMENTS
-- ============================================================================

CREATE TABLE promo_codes (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code                VARCHAR(50) UNIQUE NOT NULL,
    type                promo_type NOT NULL,
    value               DECIMAL(10,2) NOT NULL CHECK (value >= 0),
    max_discount        DECIMAL(10,2) CHECK (max_discount IS NULL OR max_discount >= 0),
    expiry_date         DATE NOT NULL,
    usage_limit         INT CHECK (usage_limit IS NULL OR usage_limit > 0),
    used_count          INT DEFAULT 0 CHECK (used_count >= 0),
    applicable_courses  JSONB,
    applicable_branches JSONB,
    status              VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'disabled')),
    created_by          UUID,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_pc_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_pc_code_not_empty CHECK (TRIM(code) <> '')
);

CREATE INDEX idx_pc_code ON promo_codes(code);
CREATE INDEX idx_pc_status ON promo_codes(status);
CREATE INDEX idx_pc_expiry ON promo_codes(expiry_date);

COMMENT ON TABLE promo_codes IS 'Discount codes for marketing/sales';

CREATE TABLE enrollments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id      UUID NOT NULL,
    group_id        UUID NOT NULL,
    status          enrollment_status DEFAULT 'pending',
    total_fee       DECIMAL(12,2) NOT NULL CHECK (total_fee >= 0),
    discount_amount DECIMAL(12,2) DEFAULT 0 CHECK (discount_amount >= 0),
    final_amount    DECIMAL(12,2) NOT NULL CHECK (final_amount >= 0),
    promo_code_id   UUID,
    enrolled_at     TIMESTAMPTZ DEFAULT NOW(),
    enrolled_by     UUID,
    dropped_at      TIMESTAMPTZ,
    drop_reason     TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_enr_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_enr_group FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE RESTRICT,
    CONSTRAINT fk_enr_promo FOREIGN KEY (promo_code_id) REFERENCES promo_codes(id) ON DELETE SET NULL,
    CONSTRAINT fk_enr_enrolled_by FOREIGN KEY (enrolled_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_enr_final_amount CHECK (final_amount = total_fee - discount_amount),
	CONSTRAINT chk_enr_discount_bounds CHECK (discount_amount <= total_fee)
);

CREATE INDEX idx_enr_student ON enrollments(student_id);
CREATE INDEX idx_enr_group ON enrollments(group_id);
CREATE INDEX idx_enr_status ON enrollments(status);
CREATE INDEX idx_enr_enrolled_by ON enrollments(enrolled_by);
CREATE INDEX idx_enr_enrolled_at ON enrollments(enrolled_at);

COMMENT ON TABLE enrollments IS 'Formal enrollment linking student to group with financial terms';

CREATE TRIGGER trg_enrollments_updated_at
    BEFORE UPDATE ON enrollments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE invoices (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number      VARCHAR(50) UNIQUE NOT NULL,
    enrollment_id       UUID NOT NULL,
    student_id          UUID NOT NULL,
    branch_id           UUID NOT NULL,
    subtotal            DECIMAL(12,2) NOT NULL CHECK (subtotal >= 0),
    discount_amount     DECIMAL(12,2) DEFAULT 0 CHECK (discount_amount >= 0),
    tax_amount          DECIMAL(12,2) DEFAULT 0 CHECK (tax_amount >= 0),
    total_amount        DECIMAL(12,2) NOT NULL CHECK (total_amount >= 0),
    paid_amount         DECIMAL(12,2) DEFAULT 0 CHECK (paid_amount >= 0),
    balance_due         DECIMAL(12,2) NOT NULL,
    status              invoice_status DEFAULT 'unpaid',
    due_date            DATE NOT NULL,
    notes               TEXT,
    is_e_invoice        BOOLEAN DEFAULT FALSE,
    e_invoice_reference VARCHAR(100),
    created_by          UUID,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_inv_enrollment FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE RESTRICT,
    CONSTRAINT fk_inv_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE RESTRICT,
    CONSTRAINT fk_inv_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT,
    CONSTRAINT fk_inv_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_inv_balance CHECK (balance_due = total_amount - paid_amount),
    CONSTRAINT chk_inv_total CHECK (total_amount = subtotal - discount_amount + tax_amount),
	CONSTRAINT chk_inv_paid_bounds CHECK (paid_amount <= total_amount)
);

CREATE INDEX idx_inv_enrollment ON invoices(enrollment_id);
CREATE INDEX idx_inv_student ON invoices(student_id);
CREATE INDEX idx_inv_status ON invoices(status);
CREATE INDEX idx_inv_due_date ON invoices(due_date);
CREATE INDEX idx_inv_number ON invoices(invoice_number);
CREATE INDEX idx_inv_branch ON invoices(branch_id);
CREATE INDEX idx_inv_unpaid ON invoices(status) WHERE status IN ('unpaid', 'partial', 'overdue');

COMMENT ON TABLE invoices IS 'Billing document per enrollment';

CREATE TRIGGER trg_invoices_number
    BEFORE INSERT ON invoices
    FOR EACH ROW EXECUTE FUNCTION generate_invoice_number();

CREATE TRIGGER trg_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE payments (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id              UUID NOT NULL,
    amount                  DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    method                  payment_method NOT NULL,
    reference               VARCHAR(255),
    easykash_transaction_id VARCHAR(100),
    easykash_payload        JSONB,
    paid_at                 TIMESTAMPTZ NOT NULL,
    recorded_by             UUID,
    status                  payment_status DEFAULT 'completed',
    receipt_number          VARCHAR(50) UNIQUE,
    notes                   TEXT,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_pay_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE RESTRICT,
    CONSTRAINT fk_pay_recorded_by FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_pay_invoice ON payments(invoice_id);
CREATE INDEX idx_pay_method ON payments(method);
CREATE INDEX idx_pay_easykash ON payments(easykash_transaction_id);
CREATE INDEX idx_pay_paid_at ON payments(paid_at);
CREATE INDEX idx_pay_status ON payments(status);

COMMENT ON TABLE payments IS 'Actual money received';

CREATE TRIGGER trg_payments_receipt
    BEFORE INSERT ON payments
    FOR EACH ROW EXECUTE FUNCTION generate_receipt_number();

CREATE TABLE installments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id      UUID NOT NULL,
    installment_number INT NOT NULL CHECK (installment_number > 0),
    amount          DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    due_date        DATE NOT NULL,
    paid_amount     DECIMAL(12,2) DEFAULT 0 CHECK (paid_amount >= 0),
    paid_at         TIMESTAMPTZ,
    status          installment_status DEFAULT 'pending',
    reminder_sent_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_inst_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    CONSTRAINT uq_installment UNIQUE (invoice_id, installment_number)
);

CREATE INDEX idx_inst_invoice ON installments(invoice_id);
CREATE INDEX idx_inst_due_date ON installments(due_date);
CREATE INDEX idx_inst_status ON installments(status);
CREATE INDEX idx_inst_pending ON installments(status) WHERE status IN ('pending', 'overdue', 'partial');

COMMENT ON TABLE installments IS 'Payment plan breakdown';

CREATE TABLE refunds (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id      UUID NOT NULL,
    invoice_id      UUID NOT NULL,
    amount          DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    reason_code     refund_reason NOT NULL,
    reason_note     TEXT,
    status          refund_status DEFAULT 'pending',
    approved_by     UUID,
    approved_at     TIMESTAMPTZ,
    processed_by    UUID,
    processed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_ref_payment FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE RESTRICT,
    CONSTRAINT fk_ref_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE RESTRICT,
    CONSTRAINT fk_ref_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_ref_processed_by FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_ref_payment ON refunds(payment_id);
CREATE INDEX idx_ref_invoice ON refunds(invoice_id);
CREATE INDEX idx_ref_status ON refunds(status);

COMMENT ON TABLE refunds IS 'Refund tracking with reason codes';


CREATE TABLE financial_transactions (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id        UUID,
    invoice_id       UUID,
    payment_id       UUID,
    refund_id        UUID,
    transaction_type financial_transaction_type NOT NULL,
    direction        transaction_direction NOT NULL,
    amount           DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    description      TEXT,
    created_by       UUID,
    created_at       TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT fk_ft_branch 
        FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
    CONSTRAINT fk_ft_invoice 
        FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
    CONSTRAINT fk_ft_payment 
        FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL,
    CONSTRAINT fk_ft_refund 
        FOREIGN KEY (refund_id) REFERENCES refunds(id) ON DELETE SET NULL,
    CONSTRAINT fk_ft_created_by 
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_ft_date ON financial_transactions(transaction_date);
CREATE INDEX idx_ft_branch ON financial_transactions(branch_id);
CREATE INDEX idx_ft_invoice ON financial_transactions(invoice_id);

COMMENT ON TABLE financial_transactions IS 'Central ledger for all incoming and outgoing financial movements';


-- ----------------------------------------------------------------------------
-- TABLE: Invoice Items (Line Items)
-- ----------------------------------------------------------------------------
CREATE TABLE invoice_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id      UUID NOT NULL,
    item_type       invoice_item_type NOT NULL,
    course_id       UUID,
    inventory_item_id UUID, -- Added permanently
    description     VARCHAR(255) NOT NULL,
    quantity        INTEGER NOT NULL DEFAULT 1,
    unit_price      DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_amount      DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_amount    DECIMAL(12,2) NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT fk_invoice_item_invoice
        FOREIGN KEY (invoice_id)
        REFERENCES invoices(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_invoice_item_course
        FOREIGN KEY (course_id)
        REFERENCES courses(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_invoice_item_quantity
        CHECK (quantity > 0),

    CONSTRAINT chk_invoice_item_prices
        CHECK (
            unit_price >= 0
            AND discount_amount >= 0
            AND tax_amount >= 0
            AND total_amount >= 0
        ),

    CONSTRAINT chk_invoice_item_discount
        CHECK (
            discount_amount <= (quantity * unit_price)
        ),

    CONSTRAINT chk_invoice_item_total
        CHECK (
            total_amount = (quantity * unit_price) - discount_amount + tax_amount
        )
);

-- ----------------------------------------------------------------------------
-- INDEXES: Invoice Items Performance Optimization
-- ----------------------------------------------------------------------------
CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_course ON invoice_items(course_id);
CREATE INDEX idx_invoice_items_type ON invoice_items(item_type);
-- ============================================================================
-- STEP 14: CERTIFICATES
-- ============================================================================

CREATE TABLE certificate_templates (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(150) NOT NULL,
    course_id       UUID,
    html_template   TEXT NOT NULL,
    placeholders    JSONB NOT NULL,
    background_url  VARCHAR(500),
    is_default      BOOLEAN DEFAULT FALSE,
    status          VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_by      UUID,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_ct_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
    CONSTRAINT fk_ct_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_ct_name_not_empty CHECK (TRIM(name) <> '')
);

CREATE INDEX idx_ct_course ON certificate_templates(course_id);
CREATE INDEX idx_ct_default ON certificate_templates(is_default) WHERE is_default = TRUE;
CREATE INDEX idx_ct_status ON certificate_templates(status);

COMMENT ON TABLE certificate_templates IS 'Drag-drop designs for certificates with placeholders';

CREATE TRIGGER trg_certificate_templates_updated_at
    BEFORE UPDATE ON certificate_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE certificates (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id      UUID NOT NULL,
    course_id       UUID NOT NULL,
    group_id        UUID NOT NULL,
    template_id     UUID,
    code            VARCHAR(100) UNIQUE NOT NULL,
    pdf_url         VARCHAR(500),
    issue_date      DATE NOT NULL,
    expiry_date     DATE,
    status          cert_status DEFAULT 'active',
    revoked_at      TIMESTAMPTZ,
    revoke_reason   TEXT,
    issued_by       UUID,
    is_auto_issued  BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_cert_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE RESTRICT,
    CONSTRAINT fk_cert_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE RESTRICT,
    CONSTRAINT fk_cert_group FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE RESTRICT,
    CONSTRAINT fk_cert_template FOREIGN KEY (template_id) REFERENCES certificate_templates(id) ON DELETE SET NULL,
    CONSTRAINT fk_cert_issued_by FOREIGN KEY (issued_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_cert_dates CHECK (expiry_date IS NULL OR expiry_date >= issue_date),
    CONSTRAINT chk_cert_code_not_empty CHECK (TRIM(code) <> '')
);

CREATE INDEX idx_cert_student ON certificates(student_id);
CREATE INDEX idx_cert_course ON certificates(course_id);
CREATE INDEX idx_cert_code ON certificates(code);
CREATE INDEX idx_cert_status ON certificates(status);
CREATE INDEX idx_cert_issue_date ON certificates(issue_date);

COMMENT ON TABLE certificates IS 'Issued certificates with unique verification codes';

CREATE TRIGGER trg_certificates_updated_at
    BEFORE UPDATE ON certificates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 15: HR MANAGEMENT
-- ============================================================================

CREATE TABLE employees (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID UNIQUE NOT NULL,
    employee_number     VARCHAR(50) UNIQUE,
    employee_type       employee_type NOT NULL,
    department          VARCHAR(100),
    job_title           VARCHAR(100) NOT NULL,
    contract_start      DATE NOT NULL,
    contract_end        DATE,
    salary              DECIMAL(12,2) CHECK (salary IS NULL OR salary >= 0),
    hourly_rate         DECIMAL(10,2) CHECK (hourly_rate IS NULL OR hourly_rate >= 0),
    currency            VARCHAR(3) DEFAULT 'EGP',
    bank_account        VARCHAR(100),
    bank_name           VARCHAR(100),
    status              employee_status DEFAULT 'active',
    termination_date    DATE,
    termination_reason  TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_emp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_emp_contract_dates CHECK (contract_end IS NULL OR contract_end >= contract_start),
    CONSTRAINT chk_emp_job_title_not_empty CHECK (TRIM(job_title) <> '')
);

CREATE INDEX idx_emp_user ON employees(user_id);
CREATE INDEX idx_emp_number ON employees(employee_number);
CREATE INDEX idx_emp_status ON employees(status);
CREATE INDEX idx_emp_department ON employees(department);

COMMENT ON TABLE employees IS 'Staff and teacher employment records';

CREATE TRIGGER trg_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE employee_documents (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id     UUID NOT NULL,
    name            VARCHAR(200) NOT NULL,
    file_url        VARCHAR(500) NOT NULL,
    document_type   document_type NOT NULL,
    expiry_date     DATE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_ed_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    CONSTRAINT chk_ed_name_not_empty CHECK (TRIM(name) <> '')
);

CREATE INDEX idx_ed_employee ON employee_documents(employee_id);
CREATE INDEX idx_ed_type ON employee_documents(document_type);

COMMENT ON TABLE employee_documents IS 'Contract, ID, certificate attachments';

CREATE TABLE teacher_availabilities (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id     UUID NOT NULL,
    day_of_week     INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time      TIME NOT NULL,
    end_time        TIME NOT NULL,
    is_available    BOOLEAN DEFAULT TRUE,
    note            VARCHAR(255),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_ta_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    CONSTRAINT chk_ta_time CHECK (end_time > start_time)
);

CREATE INDEX idx_ta_employee ON teacher_availabilities(employee_id);
CREATE INDEX idx_ta_day ON teacher_availabilities(day_of_week);
CREATE INDEX idx_ta_available ON teacher_availabilities(is_available);

COMMENT ON TABLE teacher_availabilities IS 'When teachers can be scheduled';

CREATE TABLE leave_requests (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id     UUID NOT NULL,
    type            leave_type NOT NULL,
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    days_count      INT NOT NULL CHECK (days_count > 0),
    reason          TEXT,
    attachment_url  VARCHAR(500),
    status          leave_status DEFAULT 'pending',
    approved_by     UUID,
    approved_at     TIMESTAMPTZ,
    approval_note   TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_lr_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    CONSTRAINT fk_lr_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_lr_dates CHECK (end_date >= start_date)
);

CREATE INDEX idx_lr_employee ON leave_requests(employee_id);
CREATE INDEX idx_lr_status ON leave_requests(status);
CREATE INDEX idx_lr_start_date ON leave_requests(start_date);

COMMENT ON TABLE leave_requests IS 'Absence management with approval workflow';

CREATE TABLE payroll_periods (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(100) NOT NULL,
    start_date  DATE NOT NULL,
    end_date    DATE NOT NULL,
    status      payroll_status DEFAULT 'open',
    closed_at   TIMESTAMPTZ,
    closed_by   UUID,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_pp_closed_by FOREIGN KEY (closed_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_pp_dates CHECK (end_date >= start_date)
);

CREATE INDEX idx_pp_dates ON payroll_periods(start_date, end_date);
CREATE INDEX idx_pp_status ON payroll_periods(status);

COMMENT ON TABLE payroll_periods IS 'Monthly payroll cycles';

CREATE TABLE payroll_entries (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payroll_period_id   UUID NOT NULL,
    employee_id         UUID NOT NULL,
    base_amount         DECIMAL(12,2) NOT NULL CHECK (base_amount >= 0),
    hours_worked        DECIMAL(5,2) DEFAULT 0 CHECK (hours_worked >= 0),
    classes_taught      INT DEFAULT 0 CHECK (classes_taught >= 0),
    bonus               DECIMAL(12,2) DEFAULT 0 CHECK (bonus >= 0),
    deductions          DECIMAL(12,2) DEFAULT 0 CHECK (deductions >= 0),
	hourly_rate         DECIMAL(10,2) CHECK (hourly_rate IS NULL OR hourly_rate >= 0),
    total_amount        DECIMAL(12,2) NOT NULL,
    status              payroll_entry_status DEFAULT 'draft',
    notes               TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_payroll_entry UNIQUE (payroll_period_id, employee_id),
    CONSTRAINT fk_pe_period FOREIGN KEY (payroll_period_id) REFERENCES payroll_periods(id) ON DELETE RESTRICT,
    CONSTRAINT fk_pe_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    CONSTRAINT chk_pe_total_formula CHECK (
    CASE 
        WHEN base_amount > 0 THEN total_amount = base_amount + bonus - deductions
        WHEN hourly_rate > 0 THEN total_amount = (hours_worked * hourly_rate) + bonus - deductions
        ELSE total_amount = bonus - deductions
    END
  )
);

CREATE INDEX idx_pe_period ON payroll_entries(payroll_period_id);
CREATE INDEX idx_pe_employee ON payroll_entries(employee_id);
CREATE INDEX idx_pe_status ON payroll_entries(status);

COMMENT ON TABLE payroll_entries IS 'Individual pay calculations per period';

CREATE TRIGGER trg_payroll_entries_updated_at
    BEFORE UPDATE ON payroll_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 16: ACTIVITIES
-- ============================================================================

CREATE TABLE activities (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    type            activity_event_type NOT NULL,
    date            DATE NOT NULL,
    start_time      TIME,
    end_time        TIME,
    location        VARCHAR(255),
    branch_id       UUID NOT NULL,
    capacity        INT NOT NULL CHECK (capacity > 0),
    fee             DECIMAL(10,2) DEFAULT 0 CHECK (fee >= 0),
    target_levels   JSONB,
    target_groups   JSONB,
    is_open_to_all  BOOLEAN DEFAULT FALSE,
    status          activity_status DEFAULT 'upcoming',
    created_by      UUID,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_act_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    CONSTRAINT fk_act_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_act_name_not_empty CHECK (TRIM(name) <> ''),
    CONSTRAINT chk_act_time CHECK (end_time IS NULL OR start_time IS NULL OR end_time > start_time)
);

CREATE INDEX idx_act_branch ON activities(branch_id);
CREATE INDEX idx_act_date ON activities(date);
CREATE INDEX idx_act_status ON activities(status);
CREATE INDEX idx_act_type ON activities(type);

COMMENT ON TABLE activities IS 'Extracurricular events (movie nights, clubs, trips, contests)';

CREATE TRIGGER trg_activities_updated_at
    BEFORE UPDATE ON activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE activity_registrations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id     UUID NOT NULL,
    student_id      UUID NOT NULL,
    registered_at   TIMESTAMPTZ DEFAULT NOW(),
    status          registration_status DEFAULT 'registered',
    paid_amount     DECIMAL(10,2) DEFAULT 0 CHECK (paid_amount >= 0),
    payment_id      UUID,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_act_reg UNIQUE (activity_id, student_id),
    CONSTRAINT fk_ar_activity FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    CONSTRAINT fk_ar_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE INDEX idx_ar_activity ON activity_registrations(activity_id);
CREATE INDEX idx_ar_student ON activity_registrations(student_id);
CREATE INDEX idx_ar_status ON activity_registrations(status);

COMMENT ON TABLE activity_registrations IS 'Student sign-ups for events';

CREATE TABLE activity_photos (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID NOT NULL,
    file_url    VARCHAR(500) NOT NULL,
    caption     VARCHAR(255),
    uploaded_by UUID,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_ap_activity FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    CONSTRAINT fk_ap_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_ap_activity ON activity_photos(activity_id);

COMMENT ON TABLE activity_photos IS 'Photo gallery per activity';

-- ============================================================================
-- STEP 17: INVENTORY
-- ============================================================================

CREATE TABLE stock_levels (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id             UUID NOT NULL,
    branch_id           UUID NOT NULL,
    quantity            INT DEFAULT 0,
    reserved_quantity   INT DEFAULT 0 CHECK (reserved_quantity >= 0),
    last_counted_at     TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_stock_level UNIQUE (item_id, branch_id),
    CONSTRAINT fk_sl_item FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
    CONSTRAINT fk_sl_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    CONSTRAINT chk_sl_quantity CHECK (quantity >= 0)
);

CREATE INDEX idx_sl_item ON stock_levels(item_id);
CREATE INDEX idx_sl_branch ON stock_levels(branch_id);
CREATE INDEX idx_sl_quantity ON stock_levels(quantity);

COMMENT ON TABLE stock_levels IS 'Per-branch quantity tracking';

CREATE TRIGGER trg_stock_levels_updated_at
    BEFORE UPDATE ON stock_levels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE stock_moves (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id         UUID NOT NULL,
    branch_id       UUID NOT NULL,
    type            stock_move_type NOT NULL,
    quantity        INT NOT NULL,
    unit_cost       DECIMAL(10,2) CHECK (unit_cost IS NULL OR unit_cost >= 0),
    reason          VARCHAR(255) NOT NULL,
    reference_type  VARCHAR(50) CHECK (reference_type IN ('enrollment', 'activity', 'manual', 'purchase', 'return', 'adjustment')),
    reference_id    UUID,
    created_by      UUID,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_sm_item FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE RESTRICT,
    CONSTRAINT fk_sm_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT,
    CONSTRAINT fk_sm_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_sm_item ON stock_moves(item_id);
CREATE INDEX idx_sm_branch ON stock_moves(branch_id);
CREATE INDEX idx_sm_type ON stock_moves(type);
CREATE INDEX idx_sm_created ON stock_moves(created_at);

COMMENT ON TABLE stock_moves IS 'All inventory transactions (in, out, adjustment, transfer)';

CREATE TABLE student_item_issues (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id      UUID NOT NULL,
    item_id         UUID NOT NULL,
    branch_id       UUID NOT NULL,
    quantity        INT DEFAULT 1 CHECK (quantity > 0),
    cost            DECIMAL(10,2) DEFAULT 0 CHECK (cost >= 0),
    issued_at       TIMESTAMPTZ DEFAULT NOW(),
    returned_at     TIMESTAMPTZ,
    condition_on_return item_condition,
    created_by      UUID,
    CONSTRAINT fk_sii_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_sii_item FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE RESTRICT,
    CONSTRAINT fk_sii_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT,
    CONSTRAINT fk_sii_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_sii_student ON student_item_issues(student_id);
CREATE INDEX idx_sii_item ON student_item_issues(item_id);
CREATE INDEX idx_sii_branch ON student_item_issues(branch_id);

COMMENT ON TABLE student_item_issues IS 'Items given to students (books, materials) with optional cost';

-- ============================================================================
-- STEP 18: KNOWLEDGE BASE
-- ============================================================================

CREATE TABLE kb_categories (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(150) NOT NULL,
    slug        VARCHAR(150) UNIQUE,
    description TEXT,
    parent_id   UUID,
    visibility  kb_visibility DEFAULT 'staff',
    sort_order  INT DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_kbc_parent FOREIGN KEY (parent_id) REFERENCES kb_categories(id) ON DELETE SET NULL,
    CONSTRAINT chk_kbc_name_not_empty CHECK (TRIM(name) <> '')
);

CREATE INDEX idx_kbc_parent ON kb_categories(parent_id);
CREATE INDEX idx_kbc_visibility ON kb_categories(visibility);
CREATE INDEX idx_kbc_slug ON kb_categories(slug);

COMMENT ON TABLE kb_categories IS 'Wiki organization with hierarchical categories';

CREATE TRIGGER trg_kb_categories_updated_at
    BEFORE UPDATE ON kb_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE kb_articles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id     UUID NOT NULL,
    title           VARCHAR(255) NOT NULL,
    slug            VARCHAR(255) UNIQUE,
    body            TEXT NOT NULL,
    excerpt         VARCHAR(500),
    tags            JSONB,
    version         INT DEFAULT 1 CHECK (version > 0),
    visibility      kb_visibility DEFAULT 'staff',
    is_pinned       BOOLEAN DEFAULT FALSE,
    view_count      INT DEFAULT 0 CHECK (view_count >= 0),
    created_by      UUID,
    updated_by      UUID,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_ka_category FOREIGN KEY (category_id) REFERENCES kb_categories(id) ON DELETE RESTRICT,
    CONSTRAINT fk_ka_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_ka_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_ka_title_not_empty CHECK (TRIM(title) <> '')
);

CREATE INDEX idx_ka_category ON kb_articles(category_id);
CREATE INDEX idx_ka_visibility ON kb_articles(visibility);
CREATE INDEX idx_ka_slug ON kb_articles(slug);
CREATE INDEX idx_ka_tags ON kb_articles USING GIN(tags);
CREATE INDEX idx_ka_pinned ON kb_articles(is_pinned) WHERE is_pinned = TRUE;

COMMENT ON TABLE kb_articles IS 'Internal wiki articles for staff policies and SOPs';

CREATE TRIGGER trg_kb_articles_updated_at
    BEFORE UPDATE ON kb_articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE kb_article_versions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id      UUID NOT NULL,
    body            TEXT NOT NULL,
    version_number  INT NOT NULL CHECK (version_number > 0),
    change_note     VARCHAR(255),
    created_by      UUID,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_kav_article FOREIGN KEY (article_id) REFERENCES kb_articles(id) ON DELETE CASCADE,
    CONSTRAINT fk_kav_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_kav_article ON kb_article_versions(article_id);
CREATE INDEX idx_kav_version ON kb_article_versions(article_id, version_number);

COMMENT ON TABLE kb_article_versions IS 'Version history for audit and rollback';

-- ============================================================================
-- STEP 19: LIVE CHAT (Critical Module - Section 6 Compliance)
-- ============================================================================

CREATE TABLE chat_rooms (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type        chat_room_type NOT NULL,
    group_id    UUID,
    name        VARCHAR(150),
    topic       VARCHAR(255),
    is_archived BOOLEAN DEFAULT FALSE,
    archived_at TIMESTAMPTZ,
    created_by  UUID,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_cr_group FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL,
    CONSTRAINT fk_cr_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_cr_type ON chat_rooms(type);
CREATE INDEX idx_cr_group ON chat_rooms(group_id);
CREATE INDEX idx_cr_archived ON chat_rooms(is_archived);

COMMENT ON TABLE chat_rooms IS 'Conversation containers: 1-on-1, group, announcement';

CREATE TRIGGER trg_chat_rooms_updated_at
    BEFORE UPDATE ON chat_rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE chat_room_members (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id         UUID NOT NULL,
    user_id         UUID NOT NULL,
    role            VARCHAR(20) DEFAULT 'member' CHECK (role IN ('member', 'admin', 'moderator', 'teacher', 'student')),
    joined_at       TIMESTAMPTZ DEFAULT NOW(),
    last_read_at    TIMESTAMPTZ,
    is_muted        BOOLEAN DEFAULT FALSE,
    muted_until     TIMESTAMPTZ,
    is_banned       BOOLEAN DEFAULT FALSE,
    banned_until    TIMESTAMPTZ,
    ban_reason      TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_crm_room_user UNIQUE (room_id, user_id),
    CONSTRAINT fk_crm_room FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
    CONSTRAINT fk_crm_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_crm_room ON chat_room_members(room_id);
CREATE INDEX idx_crm_user ON chat_room_members(user_id);
CREATE INDEX idx_crm_banned ON chat_room_members(is_banned);
CREATE INDEX idx_crm_active_ban ON chat_room_members(is_banned, banned_until) WHERE is_banned = TRUE;

COMMENT ON TABLE chat_room_members IS 'Room membership with mute/ban preferences';

CREATE TABLE chat_messages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id         UUID NOT NULL,
    sender_id       UUID NOT NULL,
    body            TEXT ,
    type            chat_message_type DEFAULT 'text',
    file_url        VARCHAR(500),
    file_size       BIGINT CHECK (file_size >= 0),
    file_name       VARCHAR(255),
    reply_to_id     UUID,
    edited_at       TIMESTAMPTZ,
    edited_count    INT DEFAULT 0 CHECK (edited_count >= 0),
    deleted_at      TIMESTAMPTZ,
    is_flagged      BOOLEAN DEFAULT FALSE,
    flag_reason     VARCHAR(100),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_cm_room FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
    CONSTRAINT fk_cm_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_cm_reply_to FOREIGN KEY (reply_to_id) REFERENCES chat_messages(id) ON DELETE SET NULL,
	CONSTRAINT chk_cm_content_not_empty CHECK (body IS NOT NULL OR file_url IS NOT NULL)
);

CREATE INDEX idx_cm_room ON chat_messages(room_id);
CREATE INDEX idx_cm_sender ON chat_messages(sender_id);
CREATE INDEX idx_cm_created ON chat_messages(created_at);
CREATE INDEX idx_cm_flagged ON chat_messages(is_flagged);
CREATE INDEX idx_cm_reply ON chat_messages(reply_to_id);
CREATE INDEX idx_cm_active ON chat_messages(room_id, created_at) WHERE deleted_at IS NULL;

COMMENT ON TABLE chat_messages IS 'Individual messages with soft-delete and edit support';

CREATE TABLE chat_violations (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id          UUID NOT NULL,
    room_id             UUID NOT NULL,
    sender_id           UUID NOT NULL,
    rule_matched        VARCHAR(100) NOT NULL,
    original_message    TEXT NOT NULL,
    action_taken        violation_action NOT NULL,
    moderator_id        UUID,
    moderator_note      TEXT,
    resolved_at         TIMESTAMPTZ,
    is_false_positive   BOOLEAN DEFAULT FALSE,
	detection_method VARCHAR(50) DEFAULT 'text_regex', -- 'text_regex', 'image_ocr', 'pdf_scan'
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_cv_message FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE,
    CONSTRAINT fk_cv_room FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
    CONSTRAINT fk_cv_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_cv_moderator FOREIGN KEY (moderator_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_cv_sender ON chat_violations(sender_id);
CREATE INDEX idx_cv_room ON chat_violations(room_id);
CREATE INDEX idx_cv_rule ON chat_violations(rule_matched);
CREATE INDEX idx_cv_created ON chat_violations(created_at);
CREATE INDEX idx_cv_false_positive ON chat_violations(is_false_positive);
CREATE INDEX idx_cv_unresolved ON chat_violations(resolved_at) WHERE resolved_at IS NULL;

COMMENT ON TABLE chat_violations IS 'IMMUTABLE log of contact-sharing attempts (Section 6 compliance)';

CREATE TABLE chat_strikes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL,
    violation_id    UUID NOT NULL,
    strike_number   INT NOT NULL CHECK (strike_number > 0),
    action          strike_action NOT NULL,
    expires_at      TIMESTAMPTZ,
    applied_by      UUID,
    applied_at      TIMESTAMPTZ DEFAULT NOW(),
    is_active       BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_cs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_cs_violation FOREIGN KEY (violation_id) REFERENCES chat_violations(id) ON DELETE CASCADE,
    CONSTRAINT fk_cs_applied_by FOREIGN KEY (applied_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_cs_user ON chat_strikes(user_id);
CREATE INDEX idx_cs_strike_number ON chat_strikes(strike_number);
CREATE INDEX idx_cs_active ON chat_strikes(is_active);
CREATE INDEX idx_cs_current ON chat_strikes(is_active, expires_at) WHERE is_active = TRUE;

COMMENT ON TABLE chat_strikes IS 'Strike counter: 1st=warning, 2nd=24h mute, 3rd=permanent ban';

-- ============================================================================
-- STEP 20: WEBSITE & MARKETING
-- ============================================================================

CREATE TABLE blog_posts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title           VARCHAR(255) NOT NULL,
    slug            VARCHAR(255) UNIQUE,
    content         TEXT NOT NULL,
    excerpt         VARCHAR(500),
    featured_image  VARCHAR(500),
    meta_title      VARCHAR(255),
    meta_description VARCHAR(500),
    status          post_status DEFAULT 'draft',
    published_at    TIMESTAMPTZ,
    author_id       UUID,
    view_count      INT DEFAULT 0 CHECK (view_count >= 0),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_bp_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_bp_title_not_empty CHECK (TRIM(title) <> '')
);

CREATE INDEX idx_bp_slug ON blog_posts(slug);
CREATE INDEX idx_bp_status ON blog_posts(status);
CREATE INDEX idx_bp_published ON blog_posts(published_at);
CREATE INDEX idx_bp_author ON blog_posts(author_id);

COMMENT ON TABLE blog_posts IS 'Public blog (optional, if budget allows - Section 4.14)';

CREATE TRIGGER trg_blog_posts_updated_at
    BEFORE UPDATE ON blog_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE testimonials (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id      UUID,
    name            VARCHAR(150) NOT NULL,
    content         TEXT NOT NULL,
    photo_url       VARCHAR(500),
    rating          INT DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
    course_name     VARCHAR(100),
    is_featured     BOOLEAN DEFAULT FALSE,
    status          testimonial_status DEFAULT 'pending',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_test_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL,
    CONSTRAINT chk_test_name_not_empty CHECK (TRIM(name) <> ''),
    CONSTRAINT chk_test_content_not_empty CHECK (TRIM(content) <> '')
);

CREATE INDEX idx_test_status ON testimonials(status);
CREATE INDEX idx_test_featured ON testimonials(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_test_rating ON testimonials(rating);

COMMENT ON TABLE testimonials IS 'Student reviews for marketing landing page';

CREATE TABLE page_views (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_path   VARCHAR(500) NOT NULL,
    referrer    VARCHAR(500),
    user_agent  TEXT,
    ip_address  VARCHAR(45),
    session_id  VARCHAR(100),
    viewed_at   TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_pv_path_not_empty CHECK (TRIM(page_path) <> '')
);

CREATE INDEX idx_pv_path ON page_views(page_path);
CREATE INDEX idx_pv_viewed ON page_views(viewed_at);
CREATE INDEX idx_pv_session ON page_views(session_id);

COMMENT ON TABLE page_views IS 'Server-side page view counter (Section 4.14 - no external analytics)';

-- ============================================================================
-- STEP 21: SYSTEM & AUDIT
-- ============================================================================

CREATE TABLE notifications (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL,
    type        VARCHAR(50) NOT NULL,
    title       VARCHAR(255) NOT NULL,
    body        TEXT NOT NULL,
    data        JSONB,
    action_url  VARCHAR(500),
    read_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_notif_user ON notifications(user_id);
CREATE INDEX idx_notif_read ON notifications(read_at);
CREATE INDEX idx_notif_type ON notifications(type);
CREATE INDEX idx_notif_created ON notifications(created_at);
CREATE INDEX idx_notif_unread ON notifications(user_id, created_at) WHERE read_at IS NULL;

COMMENT ON TABLE notifications IS 'In-app notification center (bell icon with unread count)';

CREATE TABLE notification_preferences (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL,
    channel     notification_channel NOT NULL,
    module      VARCHAR(50) NOT NULL,
    event       VARCHAR(50) NOT NULL,
    is_enabled  BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_notif_pref UNIQUE (user_id, channel, module, event),
    CONSTRAINT fk_np_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_np_user ON notification_preferences(user_id);

COMMENT ON TABLE notification_preferences IS 'Per-user notification settings (in-app + email only)';

CREATE TRIGGER trg_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id        UUID,
    actor_type      actor_type DEFAULT 'user',
    action          VARCHAR(100) NOT NULL,
    module          VARCHAR(50) NOT NULL,
    target_type     VARCHAR(50) NOT NULL,
    target_id       UUID NOT NULL,
    before_state    JSONB,
    after_state     JSONB,
    description     TEXT,
    ip_address      VARCHAR(45),
    user_agent      TEXT,
    session_id      VARCHAR(100),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_al_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_al_actor ON audit_logs(actor_id);
CREATE INDEX idx_al_target ON audit_logs(target_type, target_id);
CREATE INDEX idx_al_action ON audit_logs(action);
CREATE INDEX idx_al_module ON audit_logs(module);
CREATE INDEX idx_al_created ON audit_logs(created_at);
CREATE INDEX idx_al_session ON audit_logs(session_id);

COMMENT ON TABLE audit_logs IS 'IMMUTABLE record of all sensitive actions (NFR 7.2)';

CREATE TABLE settings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key             VARCHAR(100) UNIQUE NOT NULL,
    value           TEXT,
    "group"         VARCHAR(50) DEFAULT 'general',
    is_encrypted    BOOLEAN DEFAULT FALSE,
    description     VARCHAR(255),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_settings_key_not_empty CHECK (TRIM(key) <> '')
);

CREATE INDEX idx_settings_key ON settings(key);
CREATE INDEX idx_settings_group ON settings("group");

COMMENT ON TABLE settings IS 'System configuration key-value store';

CREATE TRIGGER trg_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 22: VIEWS, FUNCTIONS, TRIGGERS & SEED DATA
-- ============================================================================

-- ----------------------------------------------------------------------------
-- VIEW: Group enrollment count (for capacity checks)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_group_enrollment_count AS
SELECT 
    g.id AS group_id,
    g.capacity,
    COUNT(gs.id) AS enrolled_count,
    g.capacity - COUNT(gs.id) AS remaining_slots
FROM groups g
LEFT JOIN group_students gs ON g.id = gs.group_id AND gs.status = 'active'
GROUP BY g.id, g.capacity;

COMMENT ON VIEW v_group_enrollment_count IS 'Real-time enrollment count per group for capacity validation';

-- ----------------------------------------------------------------------------
-- VIEW: Student attendance summary
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_student_attendance_summary AS
SELECT 
    s.id AS student_id,
    s.student_number,
    u.first_name || ' ' || u.last_name AS student_name,
    g.id AS group_id,
    g.name AS group_name,
    COUNT(CASE WHEN a.status = 'present' THEN 1 END) AS present_count,
    COUNT(CASE WHEN a.status = 'absent' THEN 1 END) AS absent_count,
    COUNT(CASE WHEN a.status = 'late' THEN 1 END) AS late_count,
    COUNT(CASE WHEN a.status = 'excused' THEN 1 END) AS excused_count,
    COUNT(a.id) AS total_sessions,
    ROUND(COUNT(CASE WHEN a.status = 'present' THEN 1 END) * 100.0 / NULLIF(COUNT(a.id), 0), 2) AS attendance_rate
FROM students s
JOIN users u ON s.user_id = u.id
LEFT JOIN group_students gs ON s.id = gs.student_id AND gs.status = 'active'
LEFT JOIN groups g ON gs.group_id = g.id
LEFT JOIN sessions ses ON g.id = ses.group_id
LEFT JOIN attendances a ON ses.id = a.session_id AND a.student_id = s.id
GROUP BY s.id, s.student_number, u.first_name, u.last_name, g.id, g.name;

COMMENT ON VIEW v_student_attendance_summary IS 'Attendance statistics per student per group';

-- ----------------------------------------------------------------------------
-- VIEW: Outstanding payments
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_outstanding_payments AS
SELECT 
    i.id AS invoice_id,
    i.invoice_number,
    s.student_number,
    u.first_name || ' ' || u.last_name AS student_name,
    i.total_amount,
    i.paid_amount,
    i.balance_due,
    i.due_date,
    i.status,
    b.name AS branch_name,
    CASE 
        WHEN i.due_date < CURRENT_DATE AND i.status IN ('unpaid', 'partial') THEN 'overdue'
        WHEN i.due_date <= CURRENT_DATE + INTERVAL '7 days' AND i.status IN ('unpaid', 'partial') THEN 'due_soon'
        ELSE 'ok'
    END AS urgency
FROM invoices i
JOIN students s ON i.student_id = s.id
JOIN users u ON s.user_id = u.id
JOIN branches b ON i.branch_id = b.id
WHERE i.status IN ('unpaid', 'partial', 'overdue')
ORDER BY i.due_date ASC;

COMMENT ON VIEW v_outstanding_payments IS 'All unpaid/partial invoices with urgency flag';

-- ----------------------------------------------------------------------------
-- VIEW: Sales agent performance
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_sales_agent_performance AS
SELECT 
    u.id AS agent_id,
    u.first_name || ' ' || u.last_name AS agent_name,
    b.name AS branch_name,
    COUNT(DISTINCT l.id) AS total_leads,
    COUNT(DISTINCT CASE WHEN l.status = 'enrolled' THEN l.id END) AS conversions,
    ROUND(COUNT(DISTINCT CASE WHEN l.status = 'enrolled' THEN l.id END) * 100.0 / NULLIF(COUNT(DISTINCT l.id), 0), 2) AS conversion_rate,
    COALESCE(SUM(e.final_amount), 0) AS total_revenue
FROM users u
JOIN branches b ON u.branch_id = b.id
LEFT JOIN leads l ON u.id = l.assigned_to
LEFT JOIN enrollments e ON l.converted_to_student_id = e.student_id AND e.status = 'active'
WHERE EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = u.id AND r.slug = 'sales')
GROUP BY u.id, u.first_name, u.last_name, b.name;

COMMENT ON VIEW v_sales_agent_performance IS 'Sales funnel metrics per agent';

-- ----------------------------------------------------------------------------
-- VIEW: Teacher utilization
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_teacher_utilization AS
SELECT 
    u.id AS teacher_id,
    u.first_name || ' ' || u.last_name AS teacher_name,
    COUNT(DISTINCT g.id) AS active_groups,
    COUNT(DISTINCT ses.id) AS sessions_this_month,
    COUNT(DISTINCT gs.student_id) AS total_students,
    COALESCE(SUM(EXTRACT(EPOCH FROM (ses.end_time - ses.start_time)) / 3600), 0) AS hours_taught
FROM users u
LEFT JOIN groups g ON u.id = g.teacher_id AND g.status = 'active'
LEFT JOIN sessions ses ON g.id = ses.group_id AND ses.date >= DATE_TRUNC('month', CURRENT_DATE)
LEFT JOIN group_students gs ON g.id = gs.group_id AND gs.status = 'active'
WHERE EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = u.id AND r.slug = 'teacher')
GROUP BY u.id, u.first_name, u.last_name;

COMMENT ON VIEW v_teacher_utilization IS 'Teacher workload and utilization metrics';

-- ----------------------------------------------------------------------------
-- VIEW: Chat violation feed (for moderator dashboard)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_chat_violation_feed AS
SELECT 
    cv.id AS violation_id,
    cv.created_at AS detected_at,
    cv.rule_matched,
    cv.action_taken,
    cv.original_message,
    cv.is_false_positive,
    cv.resolved_at,
    sender.first_name || ' ' || sender.last_name AS sender_name,
    sender_u.email AS sender_email,
    room.name AS room_name,
    room.type AS room_type,
    mod.first_name || ' ' || mod.last_name AS moderator_name,
    cs.strike_number,
    cs.action AS strike_action,
    cs.is_active AS strike_active
FROM chat_violations cv
JOIN users sender_u ON cv.sender_id = sender_u.id
LEFT JOIN users sender ON cv.sender_id = sender.id
LEFT JOIN chat_rooms room ON cv.room_id = room.id
LEFT JOIN users mod ON cv.moderator_id = mod.id
LEFT JOIN chat_strikes cs ON cv.id = cs.violation_id
ORDER BY cv.created_at DESC;

COMMENT ON VIEW v_chat_violation_feed IS 'Live moderator dashboard feed of flagged messages';



-- ----------
--for student group 
-- ------
CREATE OR REPLACE VIEW view_student_active_groups AS
SELECT 
    gs.student_id,
    gs.group_id,
    g.name AS group_name,
    g.course_id,
    gs.enrolled_at
FROM group_students gs
JOIN groups g ON g.id = gs.group_id
WHERE gs.status = 'active';
-- ----------------------------------------------------------------------------
-- FUNCTION: Check group capacity before enrollment
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_group_capacity()
RETURNS TRIGGER AS $$
DECLARE
    v_capacity INT;
    v_enrolled INT;
BEGIN
    SELECT capacity INTO v_capacity FROM groups WHERE id = NEW.group_id;
    SELECT COUNT(*) INTO v_enrolled FROM group_students 
    WHERE group_id = NEW.group_id AND status = 'active';

    IF v_enrolled >= v_capacity THEN
        RAISE EXCEPTION 'Group capacity exceeded: %/%', v_enrolled, v_capacity;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_group_capacity
    BEFORE INSERT ON group_students
    FOR EACH ROW EXECUTE FUNCTION check_group_capacity();

COMMENT ON FUNCTION check_group_capacity() IS 'Hard stop on over-enrollment (SRS 4.4)';

-- ----------------------------------------------------------------------------
-- FUNCTION: Prevent teacher double-booking
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_teacher_conflict()
RETURNS TRIGGER AS $$
DECLARE
    v_teacher_id UUID;
    v_sub_teacher_id UUID;
    v_conflict_count INT;
BEGIN
    SELECT teacher_id, substitute_teacher_id 
    INTO v_teacher_id, v_sub_teacher_id 
    FROM groups WHERE id = NEW.group_id;

    SELECT COUNT(*) INTO v_conflict_count
    FROM sessions s
    JOIN groups g ON s.group_id = g.id
    WHERE (g.teacher_id IN (v_teacher_id, COALESCE(v_sub_teacher_id, v_teacher_id))
           OR g.substitute_teacher_id IN (v_teacher_id, COALESCE(v_sub_teacher_id, v_teacher_id)))
      AND s.date = NEW.date
      AND s.id IS DISTINCT FROM NEW.id
      AND ((NEW.start_time, NEW.end_time) OVERLAPS (s.start_time, s.end_time));

    IF v_conflict_count > 0 THEN
        RAISE EXCEPTION 'Teacher double-booking detected for date % time %-%', NEW.date, NEW.start_time, NEW.end_time;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_teacher_conflict
    BEFORE INSERT OR UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION check_teacher_conflict();

COMMENT ON FUNCTION check_teacher_conflict() IS 'Prevent teacher from being scheduled in two sessions simultaneously';

-- ----------------------------------------------------------------------------
-- FUNCTION: Prevent classroom double-booking
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_classroom_conflict()
RETURNS TRIGGER AS $$
DECLARE
    v_conflict_count INT;
BEGIN
    IF NEW.classroom_id IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT COUNT(*) INTO v_conflict_count
    FROM sessions
    WHERE classroom_id = NEW.classroom_id
      AND date = NEW.date
      AND id IS DISTINCT FROM NEW.id
      AND (
          (NEW.start_time, NEW.end_time) OVERLAPS (start_time, end_time)
      );

    IF v_conflict_count > 0 THEN
        RAISE EXCEPTION 'Classroom double-booking detected for date % time %-%', NEW.date, NEW.start_time, NEW.end_time;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_classroom_conflict
    BEFORE INSERT OR UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION check_classroom_conflict();

COMMENT ON FUNCTION check_classroom_conflict() IS 'Prevent classroom from being double-booked';

--- ----------------------------------------------------------------------------
-- FUNCTION & TRIGGERS: Synchronize Invoice Paid Amount & Status (Payments & Refunds)
-- ----------------------------------------------------------------------------

-- 1. إنشاء أو تحديث الدالة أولاً
CREATE OR REPLACE FUNCTION sync_invoice_financials()
RETURNS TRIGGER AS $$
DECLARE
    r_invoice_id UUID;
    v_total_paid DECIMAL(12,2);
    v_total_refunded DECIMAL(12,2);
    v_net_paid DECIMAL(12,2);
    v_invoice_total DECIMAL(12,2);
BEGIN
    -- دمج الفاتورة القديمة والجديدة لضمان تحديث الاثنين في حالة نقل الدفعة/الاسترداد
    FOR r_invoice_id IN
        SELECT DISTINCT inv_id FROM (
            SELECT CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN NEW.invoice_id END AS inv_id
            UNION
            SELECT CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN OLD.invoice_id END AS inv_id
        ) t WHERE inv_id IS NOT NULL
    LOOP
        -- 1. إجمالي المدفوعات المكتملة لهذه الفاتورة
        SELECT COALESCE(SUM(amount), 0) INTO v_total_paid 
        FROM payments 
        WHERE invoice_id = r_invoice_id AND status = 'completed';

        -- 2. إجمالي المبالغ المستردة لهذه الفاتورة
        SELECT COALESCE(SUM(amount), 0) INTO v_total_refunded 
        FROM refunds 
        WHERE invoice_id = r_invoice_id AND status = 'processed';

        v_net_paid := v_total_paid - v_total_refunded;

        -- 3. تحديث الفاتورة المستهدفة
        SELECT total_amount INTO v_invoice_total FROM invoices WHERE id = r_invoice_id;

        IF FOUND THEN
            UPDATE invoices 
            SET paid_amount = v_net_paid,
                balance_due = v_invoice_total - v_net_paid,
                status = CASE 
                    WHEN (v_invoice_total - v_net_paid) <= 0 THEN 'paid'::invoice_status
                    WHEN v_net_paid > 0 THEN 'partial'::invoice_status
                    ELSE 'unpaid'::invoice_status
                END,
                updated_at = NOW()
            WHERE id = r_invoice_id;
        END IF;
    END LOOP;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION sync_invoice_financials() IS 'Auto-recalculate invoice net paid amount and status on any payment or refund change';

-- 2. حذف أي تريجر قديم متضارب
DROP TRIGGER IF EXISTS trg_update_invoice_on_payment ON payments;
DROP TRIGGER IF EXISTS trg_sync_invoice_on_payment ON payments;
DROP TRIGGER IF EXISTS trg_sync_invoice_on_refund ON refunds;

-- 3. إنشاء وتفعيل التريجرز بعد وجود الدالة
CREATE TRIGGER trg_sync_invoice_on_payment
    AFTER INSERT OR UPDATE OR DELETE ON payments
    FOR EACH ROW EXECUTE FUNCTION sync_invoice_financials();

CREATE TRIGGER trg_sync_invoice_on_refund
    AFTER INSERT OR UPDATE OR DELETE ON refunds
    FOR EACH ROW EXECUTE FUNCTION sync_invoice_financials();
	
-- ----------------------------------------------------------------------------
-- FUNCTION: Auto-update student current_group_id on enrollment
-- ----------------------------------------------------------------------------
--CREATE OR REPLACE FUNCTION update_student_current_group()
--RETURNS TRIGGER AS $$
--BEGIN
  --  IF NEW.status = 'active' THEN
    --    UPDATE students 
      --  SET current_group_id = NEW.group_id,
        --    updated_at = NOW()
       -- WHERE id = NEW.student_id;
    --END IF;
   -- RETURN NEW;
--END;
--$$ LANGUAGE plpgsql;

--CREATE TRIGGER trg_update_student_current_group
  --  AFTER INSERT OR UPDATE ON group_students
    --FOR EACH ROW EXECUTE FUNCTION update_student_current_group();

-- ----------------------------------------------------------------------------
-- FUNCTION: Log lead status changes to activity log
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION log_lead_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO lead_activities (lead_id, type, old_status, new_status, created_by, created_at)
        VALUES (NEW.id, 'status_change', OLD.status, NEW.status, NULL, NOW());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_lead_status_change
    AFTER UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION log_lead_status_change();

COMMENT ON FUNCTION log_lead_status_change() IS 'Auto-log status changes in lead activity history';

-- ----------------------------------------------------------------------------
-- FUNCTION: Update test slot booked count
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_test_slot_booked_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE test_slots 
    SET booked_count = booked_count + 1,
        status = CASE WHEN booked_count + 1 >= capacity THEN 'full'::slot_status ELSE status END
    WHERE id = NEW.slot_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_slot_booked
    AFTER INSERT ON placement_tests
    FOR EACH ROW EXECUTE FUNCTION update_test_slot_booked_count();

CREATE OR REPLACE FUNCTION decrease_test_slot_booked_count()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.slot_id IS NOT NULL THEN
        UPDATE test_slots 
        SET booked_count = GREATEST(booked_count - 1, 0),
            status = CASE 
                WHEN GREATEST(booked_count - 1, 0) < capacity THEN 'open'::slot_status 
                ELSE status 
            END
        WHERE id = OLD.slot_id;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_decrease_slot_booked
    AFTER DELETE ON placement_tests
    FOR EACH ROW EXECUTE FUNCTION decrease_test_slot_booked_count();	

-- ----------------------------------------------------------------------------
-- FUNCTION & TRIGGER: Log Payment to Financial Transactions
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION log_payment_transaction()
RETURNS TRIGGER AS $$
DECLARE
    v_branch UUID;
BEGIN
    SELECT branch_id INTO v_branch FROM invoices WHERE id = NEW.invoice_id;

    INSERT INTO financial_transactions (
        branch_id, invoice_id, payment_id,
        transaction_type, direction, amount,
        transaction_date, description, created_by
    )
    VALUES (
        v_branch, NEW.invoice_id, NEW.id,
        'payment', 'in', NEW.amount,
        NEW.paid_at, CONCAT('Payment ', COALESCE(NEW.receipt_number, '')), NEW.recorded_by
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_payment_financial_log ON payments;
CREATE TRIGGER trg_payment_financial_log
    AFTER INSERT ON payments
    FOR EACH ROW EXECUTE FUNCTION log_payment_transaction();

-- ----------------------------------------------------------------------------
-- FUNCTION & TRIGGER: Log Refund to Financial Transactions
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION log_refund_transaction()
RETURNS TRIGGER AS $$
DECLARE
    v_branch UUID;
BEGIN
    SELECT branch_id INTO v_branch FROM invoices WHERE id = NEW.invoice_id;

    INSERT INTO financial_transactions (
        branch_id, invoice_id, refund_id,
        transaction_type, direction, amount,
        transaction_date, description, created_by
    )
    VALUES (
        v_branch, NEW.invoice_id, NEW.id,
        'refund', 'out', NEW.amount,
        COALESCE(NEW.processed_at, NOW()), CONCAT('Refund ', NEW.reason_code), NEW.processed_by
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_refund_financial_log ON refunds;
CREATE TRIGGER trg_refund_financial_log
    AFTER INSERT ON refunds
    FOR EACH ROW EXECUTE FUNCTION log_refund_transaction();

	-- ----------------------------------------------------------------------------
-- FUNCTION & TRIGGER: Validate Refund Amount Limit (Refund <= Payment)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_refund_amount_limit()
RETURNS TRIGGER AS $$
DECLARE
    v_payment_amount DECIMAL(12,2);
    v_existing_refunds DECIMAL(12,2);
BEGIN
    -- 1. جلب قيمة الدفعة الأصلية
    SELECT amount INTO v_payment_amount FROM payments WHERE id = NEW.payment_id;

    -- 2. حساب المبالغ المستردة المعتمدة/المعاملة سابقاً لنفس الدفعة
    SELECT COALESCE(SUM(amount), 0) INTO v_existing_refunds 
    FROM refunds 
    WHERE payment_id = NEW.payment_id 
      AND id IS DISTINCT FROM NEW.id
      AND status IN ('pending', 'approved', 'processed');

    -- 3. التحقق من التراكمي
    IF (v_existing_refunds + NEW.amount) > v_payment_amount THEN
        RAISE EXCEPTION 'Cumulative refund amount (%) exceeds original payment amount (%) for payment_id %', 
            (v_existing_refunds + NEW.amount), v_payment_amount, NEW.payment_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_refund_amount_limit ON refunds;
CREATE TRIGGER trg_check_refund_amount_limit
    BEFORE INSERT OR UPDATE ON refunds
    FOR EACH ROW EXECUTE FUNCTION check_refund_amount_limit();

-- ----------------------------------------------------------------------------
-- FUNCTION & TRIGGER: Verify Group Teacher Role
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION verify_group_teacher_role()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM user_roles ur 
        JOIN roles r ON ur.role_id = r.id 
        WHERE ur.user_id = NEW.teacher_id AND r.slug = 'teacher'
    ) THEN
        RAISE EXCEPTION 'Assigned user_id (%) does not have the "teacher" role', NEW.teacher_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_verify_group_teacher ON groups;
CREATE TRIGGER trg_verify_group_teacher
    BEFORE INSERT OR UPDATE ON groups
    FOR EACH ROW EXECUTE FUNCTION verify_group_teacher_role();

COMMENT ON FUNCTION verify_group_teacher_role() IS 'Enforce that only users with teacher role can be assigned to groups';



-- ----------------------------------------------------------------------------
-- FUNCTION & TRIGGER: Protect Invoice Total Amount (Prevent Total Change if Paid)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION protect_invoice_total_amount()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.total_amount IS DISTINCT FROM NEW.total_amount THEN
        IF OLD.paid_amount > 0 THEN
            RAISE EXCEPTION 'Cannot modify total_amount on invoice % because payments are already recorded (paid: %). Use discount/credit notes instead.', 
                OLD.invoice_number, OLD.paid_amount;
        END IF;

        -- إعادة حساب المتبقي تلقائياً للفواتير غير المدفوعة
        NEW.balance_due := NEW.total_amount - NEW.paid_amount;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_invoice_total ON invoices;
CREATE TRIGGER trg_protect_invoice_total
    BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION protect_invoice_total_amount();

COMMENT ON FUNCTION protect_invoice_total_amount() IS 'Enforces invoice immutability on total_amount once payments have started';

-- فهارس تحسين أداء استعلامات الـ JSONB
CREATE INDEX idx_activities_target_levels ON activities USING GIN(target_levels);
CREATE INDEX idx_activities_target_groups ON activities USING GIN(target_groups);
CREATE INDEX idx_promo_courses ON promo_codes USING GIN(applicable_courses);
CREATE INDEX idx_promo_branches ON promo_codes USING GIN(applicable_branches);

-- تحسين فهرس الأسئلة النشطة
DROP INDEX IF EXISTS idx_tq_active;
CREATE INDEX idx_tq_active ON test_questions(is_active) WHERE is_active = TRUE;

-- فهارس البحث النصي السريع (Full-Text Search) للمقالات والمدونة
CREATE INDEX idx_kb_articles_search ON kb_articles USING GIN(to_tsvector('arabic', title || ' ' || body));
CREATE INDEX idx_blog_posts_search ON blog_posts USING GIN(to_tsvector('arabic', title || ' ' || content));
-- ============================================================================
-- SEED DATA: Default Roles (Section 3.2 User Roles)
-- ============================================================================

INSERT INTO roles (name, slug, description, is_system) VALUES
('Super Admin', 'super_admin', 'Full system control', TRUE),
('Branch Manager', 'branch_manager', 'Day-to-day branch oversight', TRUE),
('Sales Agent', 'sales', 'CRM, registration, payments', TRUE),
('Finance Officer', 'finance', 'Invoicing, installments, reconciliation', TRUE),
('Academic Coordinator', 'academic', 'Course and group management', TRUE),
('Teacher', 'teacher', 'LMS, attendance, grading, chat', TRUE),
('Student', 'student', 'Self-service portal, classes, payments, chat', TRUE),
('Moderator', 'moderator', 'Live chat oversight & flag review', TRUE),
('HR Officer', 'hr', 'Employee records and payroll', TRUE),
('Read-only Auditor', 'auditor', 'View-only access for compliance', TRUE)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- SEED DATA: Default Permissions (Section 4.16 RBAC)
-- ============================================================================

INSERT INTO permissions (module, action, description) VALUES
('crm', 'view', 'View leads and students'),
('crm', 'create', 'Create leads and students'),
('crm', 'edit', 'Edit leads and students'),
('crm', 'delete', 'Delete/archive leads'),
('crm', 'assign', 'Assign leads to agents'),
('sales', 'view', 'View sales dashboards'),
('sales', 'create', 'Create promotions and targets'),
('sales', 'edit', 'Edit sales data'),
('sales', 'approve', 'Approve discounts'),
('placement', 'view', 'View test results'),
('placement', 'create', 'Schedule tests'),
('placement', 'edit', 'Score and override levels'),
('placement', 'delete', 'Cancel test appointments'),
('groups', 'view', 'View groups and schedules'),
('groups', 'create', 'Create groups'),
('groups', 'edit', 'Edit groups and schedules'),
('groups', 'delete', 'Cancel groups'),
('attendance', 'view', 'View attendance reports'),
('attendance', 'create', 'Record attendance'),
('attendance', 'edit', 'Edit attendance records'),
('attendance', 'lock', 'Lock attendance after deadline'),
('lms', 'view', 'View content and grades'),
('lms', 'create', 'Create modules, lessons, assignments'),
('lms', 'edit', 'Edit LMS content'),
('lms', 'delete', 'Delete LMS content'),
('lms', 'grade', 'Grade submissions and quizzes'),
('chat', 'view', 'View chat messages'),
('chat', 'send', 'Send messages'),
('chat', 'moderate', 'Moderate and review violations'),
('chat', 'ban', 'Ban users from chat'),
('finance', 'view', 'View invoices and payments'),
('finance', 'create', 'Create invoices and record payments'),
('finance', 'edit', 'Edit financial records'),
('finance', 'approve', 'Approve refunds'),
('finance', 'export', 'Export financial reports'),
('certificates', 'view', 'View certificates'),
('certificates', 'create', 'Issue certificates'),
('certificates', 'edit', 'Edit certificate templates'),
('certificates', 'revoke', 'Revoke certificates'),
('hr', 'view', 'View employee records'),
('hr', 'create', 'Create employee records'),
('hr', 'edit', 'Edit employee records'),
('hr', 'approve', 'Approve leave requests'),
('hr', 'process_payroll', 'Process payroll'),
('activities', 'view', 'View activities'),
('activities', 'create', 'Create activities'),
('activities', 'edit', 'Edit activities'),
('activities', 'delete', 'Cancel activities'),
('inventory', 'view', 'View stock levels'),
('inventory', 'create', 'Add inventory items'),
('inventory', 'edit', 'Adjust stock'),
('inventory', 'issue', 'Issue items to students'),
('kb', 'view', 'View articles'),
('kb', 'create', 'Create articles'),
('kb', 'edit', 'Edit articles'),
('kb', 'delete', 'Delete articles'),
('reports', 'view', 'View reports and analytics'),
('reports', 'export', 'Export reports'),
('branches', 'view', 'View branch data'),
('branches', 'create', 'Create branches'),
('branches', 'edit', 'Edit branches'),
('branches', 'delete', 'Close branches'),
('system', 'view', 'View system settings'),
('system', 'edit', 'Edit system settings'),
('system', 'manage_roles', 'Manage roles and permissions'),
('system', 'audit', 'View audit logs')
ON CONFLICT (module, action) DO NOTHING;

-- ============================================================================
-- SEED DATA: Assign Permissions to Super Admin Role
-- ============================================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.slug = 'super_admin'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SEED DATA: Default System Settings
-- ============================================================================

INSERT INTO settings (key, value, "group", description) VALUES
('academy_name', 'Speak Up English Academy', 'general', 'Academy display name'),
('default_language', 'ar', 'general', 'Default UI language'),
('date_format', 'dd/mm/yyyy', 'general', 'Date display format'),
('currency', 'EGP', 'finance', 'Default currency'),
('chat_retention_months', '24', 'chat', 'Chat message retention period'),
('max_file_upload_mb', '10', 'system', 'Maximum file upload size in MB'),
('attendance_lock_hours', '48', 'attendance', 'Hours after session before attendance is locked'),
('passing_score_default', '60', 'lms', 'Default passing score percentage'),
('max_chat_file_mb', '5', 'chat', 'Maximum chat file attachment size'),
('enable_email_notifications', 'true', 'notifications', 'Master switch for email notifications'),
('easykash_sandbox_mode', 'true', 'integrations', 'EasyKash sandbox mode for testing'),
('zoom_auto_create', 'true', 'integrations', 'Auto-create Zoom meetings for online sessions'),
('onmeet_auto_create', 'true', 'integrations', 'Auto-create OnMeet meetings for online sessions')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- SEED DATA: Default Branch
-- ============================================================================

INSERT INTO branches (name, address, phone, status) VALUES
('Main Branch', 'TBD - Update Address', 'TBD', 'active')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- DATABASE COMPLETE - VERIFICATION QUERIES
-- ============================================================================

SELECT 'Total tables created: ' || COUNT(*)::TEXT AS status
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

SELECT 'Total views created: ' || COUNT(*)::TEXT AS status
FROM information_schema.views 
WHERE table_schema = 'public';

SELECT 'Total functions/triggers: ' || COUNT(*)::TEXT AS status
FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';

SELECT 'Total roles seeded: ' || COUNT(*)::TEXT AS status FROM roles;
SELECT 'Total permissions seeded: ' || COUNT(*)::TEXT AS status FROM permissions;
SELECT 'Total settings seeded: ' || COUNT(*)::TEXT AS status FROM settings;
