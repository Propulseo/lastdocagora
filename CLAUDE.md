# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DOCAGORA is a Portuguese-language medical appointment booking platform serving three user roles: patients, healthcare professionals, and administrators. Built with Next.js 16 (App Router), Supabase, and TypeScript.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint (eslint-config-next with core-web-vitals + TypeScript)
```

No test framework is configured yet.

## Architecture

### Tech Stack

- **Framework:** Next.js 16.1.6 with App Router and React 19
- **Database/Auth:** Supabase (SSR client via `@supabase/ssr`)
- **UI:** shadcn/ui (new-york style, neutral base) + Tailwind CSS v4 + Lucide icons
- **Forms:** react-hook-form + zod v4
- **State:** zustand for client state, nuqs for URL query params
- **Dates:** date-fns

### Path Alias

`@/*` maps to `./src/*` (configured in tsconfig.json).

### Route Groups & Role-Based Access

The app uses Next.js route groups for role separation — each has its own layout with server-side auth checks:

| Route Group | URL Prefix | Roles Allowed | Layout Location |
|---|---|---|---|
| `(auth)` | `/login`, `/register` | Public | `src/app/(auth)/layout.tsx` |
| `(admin)` | `/admin/*` | admin | `src/app/(admin)/layout.tsx` |
| `(professional)` | `/pro/*` | professional, admin | `src/app/(professional)/layout.tsx` |
| `(patient)` | `/patient/*` | patient, admin | `src/app/(patient)/layout.tsx` |

The root page (`src/app/page.tsx`) is a server component that redirects authenticated users to their role-specific dashboard and unauthenticated users to `/login`.

### Middleware & Authentication Flow

`middleware.ts` at root delegates to `src/lib/supabase/middleware.ts` which:
1. Refreshes the Supabase session on every request
2. Enforces RBAC — blocks access to role-specific routes for unauthorized users
3. Redirects authenticated users away from auth pages to their dashboard

Public routes: `/login`, `/register`, `/`.

### Supabase Integration

- **Browser client:** `src/lib/supabase/client.ts` — use in client components
- **Server client:** `src/lib/supabase/server.ts` — use in server components/actions (creates client per request via cookies)
- **DB types:** `src/lib/supabase/types.ts` — auto-generated TypeScript types for the full database schema
- **Environment variables required:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Database Schema (Key Tables)

Core: `users`, `patients`, `professionals`, `appointments`, `availability`, `services`
Payments: `payments`, `appointment_ratings`
Communication: `notifications`, `appointment_notifications`, `message_templates`, `reminder_rules`
Content: `content_pages`, `faqs`, `documents`
Admin: `support_tickets`, `ticket_messages`, `system_settings`
Views: `platform_stats`, `professional_monthly_stats`, `top_professionals`

Custom types in `src/types/index.ts` define enums: `UserRole`, `AppointmentStatus`, `PaymentStatus`, `VerificationStatus`, `ConsultationType`, `PracticeType`, etc.

### Navigation Config

Each role's sidebar navigation is config-driven:
- `src/config/admin-nav.ts`
- `src/config/patient-nav.ts`
- `src/config/professional-nav.ts`

Sidebar components live alongside their route group layouts (e.g., `src/app/(admin)/_components/admin-sidebar.tsx`).

### UI Patterns

- **Server components** for layouts and data-fetching pages; **client components** (`"use client"`) for sidebars, forms, and interactive elements
- `cn()` utility from `src/lib/utils.ts` combines clsx + tailwind-merge for conditional classes
- Toast notifications via Sonner (`sonner` package)
- All UI text is in Portuguese (pt)
- shadcn/ui components in `src/components/ui/` — add new ones via `npx shadcn@latest add <component>`

### Development Status

Early stage (v0.1.0). Admin dashboard and patient dashboard have real implementations. Most professional pages and some patient pages are placeholders. No tests yet.
