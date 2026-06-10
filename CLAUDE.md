# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

The Hut Participation Portal: a single-page React app for registering participants in community programs, marking attendance, and managing staff. Originally exported from Figma Make; Supabase provides auth and the database. There is no backend server — the React client talks to Supabase directly.

## Commands

```bash
npm i            # install dependencies
npm run dev      # start Vite dev server
npm run build    # production build (vite build)
```

There is no lint, test, or typecheck script — `tsc` is not wired into the build, so type errors do not fail `npm run build`. There is no test framework.

## Stack

Vite 6 + React 18 + TypeScript, `react-router` 7 (data router via `createBrowserRouter`), Tailwind CSS v4 (via `@tailwindcss/vite`, configured in CSS not a JS config), shadcn/ui components (Radix primitives), `@supabase/supabase-js`. `@mui/material` is also a dependency but the app UI is built on shadcn/Tailwind.

## Vite specifics (vite.config.ts)

- `@` is aliased to `src/`.
- A custom `figmaAssetResolver` plugin resolves `figma:asset/<file>` imports to `src/assets/<file>` — this is how the logo and Figma-exported images are imported. Do not "fix" these to relative paths.
- Do not remove the React or Tailwind plugins even if Tailwind looks unused (Figma Make requirement).

## Architecture

- **Entry:** `src/main.tsx` → `src/app/App.tsx` (RouterProvider) → `src/app/routes.tsx`.
- **Routing & auth gating** live entirely in `src/app/routes.tsx`. `RootLayout` wraps everything in `AuthProvider`. Every real page is wrapped in `<ProtectedRoute>`, which redirects unauthenticated users to `/login`. `RootRedirect` and `LoginRoute` send users to a dashboard by role.
- **Auth state:** `src/app/context/AuthContext.tsx` is the single source of truth. On mount and on login it calls Supabase Auth, then loads the matching row from the `profiles` table. Login is blocked unless `profile.approved` is true. The in-context `user` object exposes `{ id, name, role, email }`.
- **Pages** in `src/app/pages/` query Supabase directly (`supabase.from('...').select()` etc.) inside `useEffect` — there is no shared data/service layer or API client. Follow this pattern when adding features.
- **Shared chrome:** `src/app/components/Layout.tsx` renders the sidebar/topbar and computes the visible nav by role.
- **UI primitives:** `src/app/components/ui/` is the shadcn/ui set. `cn()` lives in `src/app/components/ui/utils.ts`.

## Roles & access control (important)

Three roles in `profiles.role`: `staff`, `manager`, `admin` (a 3-tier system that replaced an older `staff`/`volunteer` one — see `ROLE-SYSTEM-UPDATE.md`). Access widens from staff → manager → admin.

- Access control is **UI-only**, enforced in two places: nav filtering in `Layout.tsx` (`managerOnly` / `adminOnly` flags on menu items) and redirect logic in `routes.tsx`. Routes themselves are not role-gated beyond authentication, so any logged-in user reaching a URL directly can load the page. Rely on Supabase Row Level Security for real authorization.
- Staff can only mark attendance for programs they are assigned to via the `program_staff` table; `Attendance.tsx` filters by these assignments for staff and shows all programs for manager/admin.
- New signups default to `approved = false`; an admin approves them on the Approvals page before they can log in. Roles can only be changed directly in the Supabase dashboard.
- Legacy quirks to be aware of: role `staff` redirects to `/volunteer-dashboard`, and `Layout.tsx` references a `'Participant'` role via `as unknown` casts that isn't in the `Profile` type — leftover from the old system.

## Supabase

- Config is **hardcoded** in `src/config/supabase.config.ts` (project URL + anon key), not read from env vars. `src/lib/supabase.ts` creates the client, exposes `isSupabaseConfigured`, and defines the **canonical DB types** (`Profile`, `Participant`, `Program`, `ProgramEnrollment`, `AttendanceRecord`). Note `src/app/types.ts` contains an older, differently-shaped set of types that does not match the DB — prefer the `lib/supabase.ts` types.
- Schema is managed by hand-run SQL, not migrations. `supabase-setup.sql` is the **idempotent** full setup (run it in the Supabase SQL Editor; safe to re-run). Tables: `profiles`, `participants`, `programs`, `program_enrollments`, `attendance_records`, `program_staff`. Setup details and gotchas (email-confirmation must be disabled, first admin must be approved manually) are in `SUPABASE_SETUP.md` and `ROLE-SYSTEM-UPDATE.md`. Other root `.sql` files (`update-programs-schema.sql`, `clear-participants.sql`) are one-off helper scripts.
- `historical-participation-tracking.sql` is a **required** idempotent migration for the participation-lifecycle layer (run it after `supabase-setup.sql`). It adds `participants.{is_active, deactivated_at, reactivated_at}`, `program_enrollments.{start_date, end_date, is_active, withdrawal_reason, enrollment_data}`, the `participation_history` table, and triggers that auto-log enrollment/withdrawal/profile status changes. `ParticipantProfile` (withdraw/deactivate/reactivate/re-enroll — all **soft**, never hard-delete enrollments), `AddToProgram`, `Attendance`, and `SearchParticipant` depend on these columns; queries will error until the migration is run.

## Documentation

Project documentation lives in `docs/`: `DESIGN.md` (architecture, data model, role matrix, workflows, decisions — with Mermaid diagrams), `TESTING.md` (manual test plan + debugging notes), `REFERENCES.md` (libraries/licences + sources), and `REPORT.md` (consolidated report with methodology). `CHANGELOG.md` (root) summarises tracked changes.

## Domain notes

`src/app/utils/constants.ts` holds South Australia–specific reference data (council regions, Adelaide Hills townships) and date/country option lists used by the participant registration forms. The app is tailored to a South Australian community organisation.
