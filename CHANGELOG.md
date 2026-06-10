# Changelog

All notable changes to this project are recorded here. Changes are tracked in Git;
this file summarises them in human-readable form. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added
- **Participation-lifecycle tracking** (`historical-participation-tracking.sql`):
  `is_active` / `deactivated_at` / `reactivated_at` on participants;
  `start_date` / `end_date` / `is_active` / `withdrawal_reason` / `enrollment_data`
  on enrolments; a `participation_history` table; and database triggers that
  automatically log enrolment, withdrawal, deactivation and reactivation events.
- **Soft-delete lifecycle actions** on the participant profile: withdraw from a
  single program, deactivate a profile, reactivate a profile, and re-enrol an
  individual past program — each with an effective-date picker and confirmation.
- **Enrolment date picker** on *Add to Program*, storing `start_date` and marking
  the enrolment active.
- **Role-based route guards** (`ProtectedRoute roles={...}`) restricting admin/
  manager pages as defence-in-depth over database policies.
- Documentation suite under `docs/` (design, testing, references) plus `CLAUDE.md`.

### Changed
- **Attendance** now lists programs for the *selected* session date (not always
  today) and shows only **active** enrolees.
- **Participant search** classifies Active/Inactive using only active enrolments.
- TypeScript types in `src/lib/supabase.ts` extended with lifecycle fields and a
  `ParticipationHistory` interface.

### Fixed (Security)
- Sign-up no longer trusts a client-supplied role; all new accounts are created as
  unapproved **Staff** (prevents self-assigned admin via the public API).
- Replaced open `USING (true)` row-level-security policies on participant, program,
  enrolment, attendance and staff tables with **approval- and role-scoped** policies
  (`security-fixes.sql`), so the public anon key alone can no longer read or write
  participant data.
- Restricted profile visibility to the owner or an admin.
- Orphaned `auth.users` rows are now removed when a profile is denied/deleted.

### Fixed (Defects)
- Attendance ignored the chosen session date (always showed today's programs).
- Enrolment/withdrawal dates could shift by a day across timezones (now normalised
  to noon UTC).
- Withdrawing a participant previously hard-deleted the enrolment and its history;
  it is now a reversible soft action.

## Commit history (Git)

| Commit | Summary |
|--------|---------|
| `a05ba80` | fix(security): harden signup, RLS, and route access control |
| `9feeed2` | docs: add CLAUDE.md guide and document participation-lifecycle migration |
| `2c56e24` | feat: participation-lifecycle foundation (migration + lifecycle pages) |
| `aafb5f4` | initial commit |
| `9904d40` | first commit |
