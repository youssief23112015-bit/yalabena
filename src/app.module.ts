import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { LeadsModule } from './modules/leads/leads.module';
import { StudentsModule } from './modules/students/students.module';
import { CoursesModule } from './modules/courses/courses.module';
import { ClassroomsModule } from './modules/classrooms/classrooms.module';
import { GroupsModule } from './modules/groups/groups.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { PlacementTestsModule } from './modules/placement-tests/placement-tests.module';
import { TestSlotsModule } from './modules/test-slots/test-slots.module'; // <-- الموديول الجديد
import { WaitlistsModule } from './modules/waitlists/waitlists.module';
import { AttendancesModule } from './modules/attendance/attendance.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { PublicModule } from './modules/public/public.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { HealthModule } from './modules/health/health.module';
import { FinanceModule } from './modules/finance/finance.module';
import { EnrollmentsModule } from './modules/enrollments/enrollments.module';
import { CertificatesModule } from './modules/certificates/certificates.module';
import { LmsModule } from './modules/lms/lms.module';
import { HrModule } from './modules/hr/hr.module';
import { ActivitiesModule } from './modules/activities/activities.module';
import { KbModule } from './modules/kb/kb.module';
import { ReportsModule } from './modules/reports/reports.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ChatModule } from './modules/chat/chat.module';
import { AuditModule } from './modules/audit/audit.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    RolesModule,
    LeadsModule,
    StudentsModule,
    CoursesModule,
    ClassroomsModule,
    GroupsModule,
    SessionsModule,
    AttendancesModule,
    PlacementTestsModule,
    TestSlotsModule, // <-- إضافته هنا في الـ imports
    WaitlistsModule,
    InventoryModule,
    PublicModule,
    NotificationsModule,
    HealthModule,
    FinanceModule,
    EnrollmentsModule,
    CertificatesModule,
    LmsModule,
    HrModule,
    ActivitiesModule,
    KbModule,
    ReportsModule,
    DashboardModule,
    ChatModule,
    // Global audit trail (SRS 7.2) — registers AuditController (/api/v1/audit-logs)
    // and the global AuditInterceptor via APP_INTERCEPTOR.
    AuditModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}