import { DataSource } from 'typeorm';
import { Role } from '../../shared/entities/role.entity';

export async function seedRoles(dataSource: DataSource) {
  const repo = dataSource.getRepository(Role);
  const roles = [
    { name: 'Super Admin', slug: 'super_admin', description: 'Full system control', is_system: true },
    { name: 'Branch Manager', slug: 'branch_manager', description: 'Day-to-day branch oversight', is_system: true },
    { name: 'Sales', slug: 'sales', description: 'CRM, registration, payments', is_system: true },
    { name: 'Finance Officer', slug: 'finance', description: 'Invoicing, installments, reconciliation', is_system: true },
    { name: 'Academic Coordinator', slug: 'academic', description: 'Course and group management', is_system: true },
    { name: 'Teacher', slug: 'teacher', description: 'LMS, attendance, grading, chat', is_system: true },
    { name: 'Student', slug: 'student', description: 'Self-service portal, classes, payments, chat', is_system: true },
    { name: 'Moderator', slug: 'moderator', description: 'Live chat oversight & flag review', is_system: true },
    { name: 'HR Officer', slug: 'hr', description: 'Employee records and payroll', is_system: true },
    { name: 'Read-only Auditor', slug: 'auditor', description: 'View-only access for compliance', is_system: true },
  ];

  for (const role of roles) {
    // التحقق بالـ slug أو الـ name لتجنب التكرار
    const exists = await repo.findOne({ 
      where: [{ slug: role.slug }, { name: role.name }] 
    });
    
    if (!exists) {
      try {
        await repo.save(repo.create(role));
        console.log(`Role seeded: ${role.slug}`);
      } catch (error) {
        // لو حصل تكرار لأي سبب نتجاهله عشان السكريبت ميكملش ضرب إيرور
        console.log(`Role skipped or already exists: ${role.slug}`);
      }
    }
  }
}