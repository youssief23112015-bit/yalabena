# Speak Up Academy TMS — Frontend

Training Management System frontend for Speak Up English Academy.

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS + shadcn/ui components
- TanStack Query (React Query)
- Zustand (state management)
- React Hook Form + Zod (forms & validation)
- i18next (English / Arabic, RTL/LTR)
- Axios (API client)
- Lucide React (icons)

## Features Implemented

- ✅ JWT Authentication (login, register, refresh)
- ✅ Session restoration on page refresh
- ✅ Protected routes
- ✅ RTL/LTR language switching (Arabic / English)
- ✅ Responsive sidebar + topbar layout
- ✅ Toast notifications
- ✅ Centralized API client with error handling
- ✅ Real backend API integration (no mock data)
- ✅ Branches (list, view)
- ✅ Users (list, view)
- ✅ Roles (list, view with permissions)
- ✅ Leads (full CRUD)
- ✅ Students (list, search, branch filter)
- ✅ Courses (full CRUD)
- ✅ Groups (full CRUD with course/branch relations)
- ✅ Sessions (full CRUD with group filter)

## Project Structure

```
src/
├── api/           # API service modules (one per backend module)
├── components/
│   ├── ui/        # Reusable UI components (shadcn style)
│   ├── layout/    # AppShell, Sidebar, Topbar
│   └── common/    # DataTable, PageWrapper
├── hooks/         # Custom hooks (use-toast)
├── lib/           # Utilities, i18n config
├── locales/       # Translation files (en, ar)
├── pages/         # Page components
├── routes/        # Route guards
├── store/         # Zustand stores
└── types/         # TypeScript types
```

## Quick Start

```bash
npm install
npm run dev
```

See [SETUP.md](./SETUP.md) for detailed instructions.
See [API_CONTRACT.md](./API_CONTRACT.md) for backend API documentation.

## License

Proprietary — Speak Up English Academy. All rights reserved.
