import { DataSource } from 'typeorm';

/**
 * Default course / teacher / group bootstrap (no branches — the academy
 * is 100% online).
 */
export async function seedDefaults(dataSource: DataSource) {
  const defaultId = '3c2ecfa2-aced-460f-9ee4-fa1af3d7161b';
  const teacherId = '19197f5b-e457-43a7-b4a5-bb52cf8acf34';

  // 1. إدخال كورس افتراضي (Course)
  await dataSource.query(
    `INSERT INTO courses (id, name, code, level, duration_hours, default_price, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, 'active', NOW(), NOW())
     ON CONFLICT (id) DO NOTHING`,
    [defaultId, 'Default Course', 'DEF-01', 'A1', 10, 1000.00]
  );

  // 2. إدخال المدرس الافتراضي (User)
  await dataSource.query(
    `INSERT INTO users (id, email, password_hash, first_name, last_name, language, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
     ON CONFLICT (id) DO NOTHING`,
    [teacherId, 'teacher@speakup.com', '$2b$10$EpVqVv0g9h372k9z...', 'Teacher', 'User', 'ar', 'active']
  );

  // 3. ربط المدرس بدور "teacher" في جدول الصلاحيات (user_roles) لتجاوز دالة التحقق
  await dataSource.query(
    `INSERT INTO user_roles (user_id, role_id)
     SELECT $1, id FROM roles WHERE slug = 'teacher'
     ON CONFLICT DO NOTHING`,
    [teacherId]
  );

  // 4. إدخال الـ Group بعد التأكد أن المدرس أصبح لديه صلاحية الـ teacher رسمياً
  await dataSource.query(
    `INSERT INTO groups (id, name, course_id, teacher_id, capacity, mode, start_date, end_date, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW() + INTERVAL '30 days', $7, NOW(), NOW())
     ON CONFLICT (id) DO NOTHING`,
    [defaultId, 'Default Group', defaultId, teacherId, 20, 'in_person', 'upcoming']
  );

  console.log('Default Course, Teacher, Teacher Role, and Group seeded successfully.');
}
