import { DataSource } from 'typeorm';

export async function seedBranch(dataSource: DataSource) {
  const defaultId = '3c2ecfa2-aced-460f-9ee4-fa1af3d7161b';
  const teacherId = '19197f5b-e457-43a7-b4a5-bb52cf8acf34';

  // 1. إدخال الفرع (Branch)
  await dataSource.query(
    `INSERT INTO branches (id, name, address, phone, status, created_at, updated_at) 
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) 
     ON CONFLICT (id) DO NOTHING`,
    [defaultId, 'Main Branch', 'Default Address', '+201000000000', 'active']
  );

  // 2. إدخال كورس افتراضي (Course) مع تغيير level إلى 'A1' (أو 'Beginner' لو مشتفتش)
  await dataSource.query(
    `INSERT INTO courses (id, name, code, level, duration_hours, default_price, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, 'active', NOW(), NOW())
     ON CONFLICT (id) DO NOTHING`,
    [defaultId, 'Default Course', 'DEF-01', 'A1', 10, 1000.00]
  );

  // 3. إدخال المدرس الافتراضي (User)
  await dataSource.query(
    `INSERT INTO users (id, email, password_hash, first_name, last_name, branch_id, language, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
     ON CONFLICT (id) DO NOTHING`,
    [teacherId, 'teacher@speakup.com', '$2b$10$EpVqVv0g9h372k9z...', 'Teacher', 'User', defaultId, 'ar', 'active']
  );

  // 4. ربط المدرس بدور "teacher" في جدول الصلاحيات (user_roles) لتجاوز دالة التحقق
  await dataSource.query(
    `INSERT INTO user_roles (user_id, role_id)
     SELECT $1, id FROM roles WHERE slug = 'teacher'
     ON CONFLICT DO NOTHING`,
    [teacherId]
  );

  // 5. إدخال الـ Group بعد التأكد أن المدرس أصبح لديه صلاحية الـ teacher رسمياً
  await dataSource.query(
    `INSERT INTO groups (id, name, course_id, teacher_id, branch_id, capacity, mode, start_date, end_date, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW() + INTERVAL '30 days', $8, NOW(), NOW())
     ON CONFLICT (id) DO NOTHING`,
    [defaultId, 'Default Group', defaultId, teacherId, defaultId, 20, 'in_person', 'upcoming']
  );

  console.log('Default Branch, Course, Teacher, Teacher Role, and Group seeded successfully.');
}