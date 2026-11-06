# SpeakUp Backend & LMS Module — NestJS

Complete backend module covering LMS tasks, real-time chat with WebSockets (Socket.io), custom guards, and unit tests.

## Install Dependencies

```bash
npm install pdf-lib
npm install class-validator class-transformer
npm install @nestjs/swagger @nestjs/platform-express
npm install socket.io socket.io-client
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
│   ├── chat/                  # Real-time Chat Gateway & Services
│   │   ├── chat.gateway.ts
│   │   ├── chat.module.ts
│   │   ├── chat.service.ts
│   │   ├── ws-jwt.guard.ts    # WebSocket JWT Authentication Guard
│   │   └── dto/
│   │       └── ...
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

Key Conventions & FeaturesComponentField / MechanismNotesLmsModule / LmsLessonorder_indexPositional ordering (int)   Assignmentdue_at / allow_lateDeadline (timestamptz) & late submission flag   Quizrelease_modeinstant or after_teacher_review   QuizAttemptneeds_manual_reviewSet when Short Answer present   EnrollmentstatusUses EnrollmentStatus enum   Chat Gateway/chat NamespaceReal-time messaging, typing indicators, and room synchronization via Socket.ioWsJwtGuardWebSocket SecurityValidates JWT tokens from handshake auth/headers without crashing client connections on retry
## Running Tests

```bash
npm run test -- lms.service.spec
```

## Notes

- `getGroupIdForStudent` in `lms.service.ts` is a placeholder — adjust to your domain model (e.g., look up via Enrollment).
- `getResourceForDownload` reads from local filesystem — swap for S3/storage service in production.
- Watermark endpoint expects PDF files stored locally at `resource.file_url`.
