# LMS Module — NestJS Backend

Complete LMS backend module covering all task-schedule items LMS-BE-01 through LMS-BE-12 plus unit tests (LMS-TEST-01).

## Install Dependencies

```bash
npm install pdf-lib
npm install class-validator class-transformer
npm install @nestjs/swagger @nestjs/platform-express
```

## File Structure

```
src/
├── common/
│   ├── decorators/
│   │   ├── roles.decorator.ts
│   │   └── current-user.decorator.ts
│   └── enums/
│       ├── attempt-status.enum.ts
│       ├── enrollment-status.enum.ts
│       ├── question-type.enum.ts
│       ├── release-mode.enum.ts
│       └── submission-status.enum.ts
├── modules/
│   └── lms/
│       ├── dto/
│       │   ├── create-assignment.dto.ts
│       │   ├── create-gradebook-category.dto.ts
│       │   ├── create-gradebook-entry.dto.ts
│       │   ├── create-lesson.dto.ts
│       │   ├── create-module.dto.ts
│       │   ├── create-question.dto.ts
│       │   ├── create-quiz.dto.ts
│       │   ├── create-resource.dto.ts
│       │   ├── grade-submission.dto.ts
│       │   ├── pull-questions.dto.ts
│       │   ├── reorder-modules.dto.ts
│       │   ├── set-release-mode.dto.ts
│       │   ├── submit-attempt.dto.ts
│       │   ├── submit-assignment.dto.ts
│       │   ├── update-assignment.dto.ts
│       │   ├── update-lesson.dto.ts
│       │   └── update-module.dto.ts
│       ├── guards/
│       │   └── enrollment.guard.ts
│       ├── lms.controller.ts
│       ├── lms.module.ts
│       ├── lms.service.spec.ts
│       └── lms.service.ts
└── shared/
    └── entities/
        ├── assignment.entity.ts
        ├── branch.entity.ts
        ├── enrollment.entity.ts
        ├── gradebook-category.entity.ts
        ├── gradebook-entry.entity.ts
        ├── group.entity.ts
        ├── lms-lesson.entity.ts
        ├── lms-module.entity.ts
        ├── lms-resource.entity.ts
        ├── quiz-attempt.entity.ts
        ├── quiz-question.entity.ts
        ├── quiz.entity.ts
        ├── student-survey.entity.ts
        ├── student.entity.ts
        ├── submission.entity.ts
        ├── teacher-evaluation.entity.ts
        └── user.entity.ts
```

## Key Conventions

| Entity | Field | Notes |
|--------|-------|-------|
| LmsModule / LmsLesson | `order_index` | Positional ordering (int) |
| Assignment | `due_at` | Deadline (timestamptz) |
| Assignment | `allow_late` | Boolean, default false |
| Quiz | `release_mode` | `instant` or `after_teacher_review` |
| QuizAttempt | `needs_manual_review` | Set when Short Answer present |
| Enrollment | `status` | Uses `EnrollmentStatus` enum |

## Running Tests

```bash
npm run test -- lms.service.spec
```

## Notes

- `getGroupIdForStudent` in `lms.service.ts` is a placeholder — adjust to your domain model (e.g., look up via Enrollment).
- `getResourceForDownload` reads from local filesystem — swap for S3/storage service in production.
- Watermark endpoint expects PDF files stored locally at `resource.file_url`.
