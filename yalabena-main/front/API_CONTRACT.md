# Speak Up Academy TMS — API Contract

> **Source of Truth:** Backend repository at `https://github.com/youssief23112015-bit/new/tree/4ad4c1cd9d0926d02bc567a03093f04eb84c5166/OneDrive/Desktop/newspeakup-main`

## Backend Architecture

| Property | Value |
|----------|-------|
| Framework | NestJS 10 |
| Node Version | 20 |
| Database | PostgreSQL 15 (TypeORM) |
| API Prefix | `/api/v1` |
| Port | 3000 |
| Auth | JWT Bearer Token |
| Response Wrap | `{ success, data, timestamp, path }` |
| Error Format | `{ success: false, statusCode, message, errors?, timestamp, path }` |
| CORS | Enabled, credentials: true |
| Swagger | `http://localhost:3000/docs` |

## Authentication

All protected endpoints require `Authorization: Bearer <access_token>` header.

| Method | Endpoint | Body | Response | Auth |
|--------|----------|------|----------|------|
| POST | `/api/v1/auth/register` | `RegisterDto` | `{ access_token, refresh_token, user }` | Public |
| POST | `/api/v1/auth/login` | `LoginDto` | `{ access_token, refresh_token, user }` | Public |
| POST | `/api/v1/auth/refresh` | `{ refresh_token }` | `{ access_token, refresh_token, user }` | Public |

**Note:** There is NO `/api/v1/auth/me` or `/api/v1/users/me` endpoint. User data comes exclusively from auth responses.

### DTOs

**LoginDto:**
```json
{
  "email": "string (email)",
  "password": "string (min 6)"
}
```

**RegisterDto:**
```json
{
  "email": "string (email)",
  "password": "string (min 6)",
  "first_name": "string",
  "last_name": "string",
  "phone": "string (optional)",
  "branch_id": "uuid (optional)",
  "role_slug": "string (optional)",
  "language": "ar | en (optional, default: ar)"
}
```

## Modules

### Users
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/v1/users` | Bearer |
| GET | `/api/v1/users/:id` | Bearer |
| PATCH | `/api/v1/users/:id/role` | Bearer |

### Roles
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/v1/roles` | Bearer |
| GET | `/api/v1/roles/:id` | Bearer |

### Branches
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/v1/branches` | Bearer |
| GET | `/api/v1/branches/:id` | Bearer |

### Leads
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/v1/leads` | Bearer |
| GET | `/api/v1/leads/:id` | Bearer |
| POST | `/api/v1/leads` | Bearer |
| PATCH | `/api/v1/leads/:id` | Bearer |

**Create Lead Body:**
```json
{
  "first_name": "string (required)",
  "last_name": "string (required)",
  "phone": "string (required)",
  "email": "string (optional)",
  "source": "walk_in | website | referral | other (required)",
  "national_id": "string (optional)",
  "level_interest": "string (optional)",
  "notes": "string (optional)",
  "assigned_to": "uuid (optional)",
  "branch_id": "uuid (optional)"
}
```

### Students
| Method | Endpoint | Query Params | Auth |
|--------|----------|--------------|------|
| GET | `/api/v1/students` | `search`, `branchId` | Bearer |
| GET | `/api/v1/students/:id` | — | Bearer |

### Courses
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/v1/courses` | Bearer |
| GET | `/api/v1/courses/:id` | Bearer |
| POST | `/api/v1/courses` | Bearer |
| PUT | `/api/v1/courses/:id` | Bearer |
| DELETE | `/api/v1/courses/:id` | Bearer |
| POST | `/api/v1/courses/:id/prerequisites` | Bearer |
| DELETE | `/api/v1/courses/:id/prerequisites/:prerequisiteId` | Bearer |

### Groups
| Method | Endpoint | Query Params | Auth |
|--------|----------|--------------|------|
| GET | `/api/v1/groups` | `branchId`, `courseId` | Bearer |
| GET | `/api/v1/groups/:id` | — | Bearer |
| POST | `/api/v1/groups` | — | Bearer |
| PUT | `/api/v1/groups/:id` | — | Bearer |
| DELETE | `/api/v1/groups/:id` | — | Bearer |

### Sessions
| Method | Endpoint | Query Params | Auth |
|--------|----------|--------------|------|
| GET | `/api/v1/sessions` | `groupId` | Bearer |
| GET | `/api/v1/sessions/:id` | — | Bearer |
| POST | `/api/v1/sessions` | — | Bearer |
| PUT | `/api/v1/sessions/:id` | — | Bearer |
| DELETE | `/api/v1/sessions/:id` | — | Bearer |

## Enums (Verified from Backend)

### UserStatus
- `active`
- `inactive`
- `suspended`
- `pending`

### LeadStatus
- `new`
- `contacted`
- `interested`
- `test_scheduled`
- `enrolled`
- `lost`

### LeadSource
- `walk_in`
- `website`
- `referral`
- `other`

### CourseStatus
- `active`
- `inactive`
- `archived`

## Roles (Pre-seeded)

- `super_admin`
- `branch_manager`
- `sales`
- `finance`
- `academic`
- `teacher`
- `student`
- `moderator`
- `hr`
- `auditor`

## Error Handling

| Status | Meaning | Frontend Action |
|--------|---------|-----------------|
| 400 | Bad Request | Show validation errors |
| 401 | Unauthorized | Clear auth, redirect to login |
| 403 | Forbidden | Show access denied message |
| 404 | Not Found | Show not found message |
| 409 | Conflict | Show conflict message (e.g., duplicate) |
| 422 | Validation Error | Show field-level errors |
| 500 | Server Error | Show generic error, retry option |
