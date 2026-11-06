Write-Host "🚀 Starting SpeakUp LMS Auto-Setup with Full Schema Compliance..." -ForegroundColor Cyan

$sqlQuery = @"
INSERT INTO branches (id, name, address, phone, status, created_at, updated_at) 
VALUES ('3c2ecfa2-aced-460f-9ee4-fa1af3d7161b', 'Main Branch', 'Default Address', '+201000000000', 'active', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

INSERT INTO users (id, email, password_hash, first_name, last_name, branch_id, language, status, created_at, updated_at)
VALUES (
    '19197f5b-e457-43a7-b4a5-bb52cf8acf34', 
    'teacher@speakup.com', 
    '$2b$10$EpVqVv0g9h372k9z...', 
    'Teacher', 
    'User', 
    '3c2ecfa2-aced-460f-9ee4-fa1af3d7161b', 
    'ar', 
    'active', 
    NOW(), 
    NOW()
)
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

INSERT INTO courses (id, name, level, duration_hours, default_price, created_at, updated_at)
VALUES ('3c2ecfa2-aced-460f-9ee4-fa1af3d7161b', 'Default Course', 'Beginner', 10, 1000.00, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- إدخال الـ groups مع تغطية كل الأعمدة الإجبارية بدقة وتحديثها لو وجدت
INSERT INTO groups (
    id, 
    name, 
    course_id, 
    teacher_id, 
    branch_id, 
    capacity, 
    mode, 
    start_date, 
    end_date, 
    status, 
    created_at, 
    updated_at
)
VALUES (
    '3c2ecfa2-aced-460f-9ee4-fa1af3d7161b', 
    'Default Group', 
    '3c2ecfa2-aced-460f-9ee4-fa1af3d7161b', 
    '19197f5b-e457-43a7-b4a5-bb52cf8acf34', 
    '3c2ecfa2-aced-460f-9ee4-fa1af3d7161b', 
    20, 
    'in_person', 
    NOW(), 
    NOW() + INTERVAL '30 days', 
    'upcoming', 
    NOW(), 
    NOW()
)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    course_id = EXCLUDED.course_id,
    teacher_id = EXCLUDED.teacher_id,
    branch_id = EXCLUDED.branch_id,
    capacity = EXCLUDED.capacity,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    updated_at = NOW();

INSERT INTO roles (id, name, slug, is_system, created_at) 
VALUES ('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Super Administrator', 'super_admin', true, NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_roles (user_id, role_id, created_at) 
VALUES ('19197f5b-e457-43a7-b4a5-bb52cf8acf34', 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', NOW())
ON CONFLICT (user_id, role_id) DO NOTHING;

INSERT INTO lms_modules (id, group_id, name, description, "order", created_at, updated_at) 
VALUES ('3c2ecfa2-aced-460f-9ee4-fa1af3d7161b', '3c2ecfa2-aced-460f-9ee4-fa1af3d7161b', 'Module 1: Basic Grammar', 'Introduction to tenses', 1, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

INSERT INTO lms_lessons (id, module_id, name, content, type, "order", is_published, created_at, updated_at) 
VALUES ('633d37b0-d407-4273-8f16-c3a1d345a2ff', '3c2ecfa2-aced-460f-9ee4-fa1af3d7161b', 'Lesson 1: Present Simple', 'Detailed lesson text...', 'content', 1, true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

INSERT INTO roles (id, name, slug, is_system, created_at) 
VALUES ('d4eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Student', 'student', true, NOW())
ON CONFLICT (slug) DO NOTHING;
"@

$sqlQuery | docker exec -i speakup-postgres psql -U postgres -d speakup_tms

Write-Host "✅ LMS Data Seeded & Updated Successfully!" -ForegroundColor Green