

A production-ready NestJS backend for the Academy Training Management System.

## Architecture

- **Framework**: NestJS 10 (Node.js)
- **Database**: PostgreSQL 15+ (TypeORM)
- **Auth**: JWT + bcrypt
- **API Docs**: Swagger/OpenAPI at `/docs`
- **Architecture Pattern**: Modular monolith with clean separation

## Project Structure

```
speakup-tms-backend/
├── src/
│   ├── main.ts                    # Application bootstrap
│   ├── app.module.ts              # Root module
│   ├── config/                    # Configuration files
│   ├── common/                    # Guards, decorators, pipes, filters, interceptors
│   │   ├── decorators/
│   │   ├── enums/                 # All TypeScript enums matching PostgreSQL enums
│   │   ├── filters/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   └── pipes/
│   ├── database/                  # TypeORM config, migrations, seeds
│   ├── shared/entities/           # All TypeORM entities (30+ tables)
│   └── modules/                   # Feature modules
│       ├── auth/                  # JWT auth, login, register, refresh
│       ├── users/                 # User CRUD
│       ├── branches/              # Branch management
│       ├── roles/                 # RBAC roles & permissions
│       ├── leads/                 # CRM lead management
│       ├── students/              # Student profiles & history
│       ├── courses/               # Course catalog
│       ├── classrooms/            # Classroom management
│       ├── groups/                # Group scheduling
│       ├── sessions/              # Session instances
│       ├── attendance/            # Attendance tracking
│       ├── placement-tests/       # Placement test system
│       ├── waitlists/             # Waitlist queue
│       ├── inventory/             # Training materials
│       ├── public/                # Public website APIs
│       └── notifications/         # In-app notifications
├── test/                          # E2E tests
├── scripts/                       # Deployment scripts
├── package.json
├── tsconfig.json
├── .env.example
└── docker-compose.yml
```

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your PostgreSQL credentials
```

### 3. Run PostgreSQL (or use Docker)
```bash
docker-compose up -d postgres
```

### 4. Run migrations & seeds
```bash
npm run migration:run
npm run seed
```

### 5. Start development server
```bash
npm run start:dev
```

### 6. Access API docs
Open http://localhost:3000/docs

## Database

The database schema is based on the provided `new128.sql` PostgreSQL DDL script. All 30+ tables are mapped to TypeORM entities with proper relations, indexes, and constraints.

### Key Tables
- `users`, `roles`, `permissions`, `user_roles` — Auth & RBAC
- `branches`, `classrooms` — Branch management
- `leads`, `lead_activities`, `follow_ups`, `sales_targets` — CRM
- `students`, `student_profiles`, `student_level_history` — Students
- `courses`, `groups`, `group_schedules`, `group_students` — Scheduling
- `sessions`, `attendances` — Sessions & attendance
- `test_slots`, `placement_tests`, `test_questions` — Placement tests
- `enrollments`, `invoices`, `payments`, `installments`, `refunds` — Finance (Stage 3+)
- `inventory_items`, `stock_levels`, `stock_moves` — Inventory
- `blog_posts`, `testimonials` — Public website

## Stages

| Stage | Scope | Status |
|-------|-------|--------|
| **Stage 1** | Foundation, Auth, RBAC, CRM, Users, Branches, Public API | ✅ DONE |
| **Stage 2** | Students, Courses, Classrooms, Groups, Sessions, Attendance, Placement Tests, Waitlists | ✅ DONE |
| **Stage 3** | Finance (Invoices, Payments, Installments, Refunds), Enrollments, Promo Codes, Certificates | ⏳ TODO |
| **Stage 4** | LMS (Modules, Lessons, Resources, Assignments, Quizzes, Gradebook), HR, Activities, Knowledge Base | ⏳ TODO |
| **Stage 5** | Live Chat (WebSocket, Monitoring, Compliance Engine), Reports, Notifications, Integrations (Zoom, OnMeet, EasyKash) | ⏳ TODO |

## API Endpoints

All endpoints are prefixed with `/api/v1`.

### Auth (Public)
- `POST /api/v1/auth/register` — Register new user
- `POST /api/v1/auth/login` — Login
- `POST /api/v1/auth/refresh` — Refresh token

### Protected Endpoints (require Bearer token)
All other endpoints require JWT authentication.

## Roles & Permissions

Pre-seeded roles:
- `super_admin` — Full system control
- `branch_manager` — Branch oversight
- `sales` — CRM, leads, payments
- `finance` — Invoicing, reconciliation
- `academic` — Course & group management
- `teacher` — LMS, attendance, grading, chat
- `student` — Self-service portal
- `moderator` — Chat oversight
- `hr` — Employee records & payroll
- `auditor` — Read-only access

## Development

### Run tests
```bash
npm test
npm run test:e2e
```

### Generate migration
```bash
npm run migration:generate -- src/database/migrations/AddNewTable
```

### Run migration
```bash
npm run migration:run
```

## License

Proprietary — Speak Up English Academy. All rights reserved.
