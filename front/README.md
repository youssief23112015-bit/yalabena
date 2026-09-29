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
- Socket.io Client (Real-time communication & WebSockets)

## Features Implemented

- ✅ JWT Authentication (login, register, refresh)
- ✅ Session restoration on page refresh
- ✅ Protected routes
- ✅ RTL/LTR language switching (Arabic / English)
- ✅ Responsive sidebar + topbar layout
- ✅ Toast notifications (including chat violation & alert toasts)[cite: 2]
- ✅ Centralized API client with error handling[cite: 2]
- ✅ Real backend API integration (no mock data)[cite: 2]
- ✅ Real-time Chat & WebSockets (Room joining, messaging, typing indicators, presence tracking via `/chat` namespace)
- ✅ Branches (list, view)[cite: 2]
- ✅ Users (list, view)[cite: 2]
- ✅ Roles (list, view with permissions)[cite: 2]
- ✅ Leads (full CRUD)[cite: 2]
- ✅ Students (list, search, branch filter)[cite: 2]
- ✅ Courses (full CRUD)[cite: 2]
- ✅ Groups (full CRUD with course/branch relations)[cite: 2]
- ✅ Sessions (full CRUD with group filter)[cite: 2]


## Project Structure

```
src/
├── api/           # API service modules (one per backend module)[cite: 2]
├── components/
│   ├── ui/        # Reusable UI components (shadcn style)[cite: 2]
│   ├── layout/    # AppShell, Sidebar, Topbar[cite: 2]
│   └── chat/      # ChatLayout, MessageBubble, MessageComposer, ChatConsentModal[cite: 2]
├── hooks/         # Custom hooks (use-toast, useChatToast)[cite: 2]
├── lib/           # Utilities, i18n config, chatSocket (Zustand state integration)[cite: 2]
├── locales/       # Translation files (en, ar)[cite: 2]
├── pages/         # Page components[cite: 2]
├── routes/        # Route guards[cite: 2]
├── store/         # Zustand stores (authStore with persist state storage)[cite: 2]
└── types/         # TypeScript types (chat, user, etc.)[cite: 2]
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
