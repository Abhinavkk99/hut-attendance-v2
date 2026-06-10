# The Hut Participation Portal — Project Report

> A consolidated report covering methodology, research, design, implementation,
> security analysis, and testing. Detailed material lives in the companion documents
> referenced throughout: [DESIGN.md](DESIGN.md), [TESTING.md](TESTING.md),
> [REFERENCES.md](REFERENCES.md), and the repository `CHANGELOG.md`.

---

## 1. Introduction

The Hut Participation Portal is a web application that helps a South Australian
community organisation register participants, enrol them in programs, record
attendance, and report on participation. It targets three kinds of users — **Staff**,
**Managers**, and **Administrators** — each with a different level of access.

This report documents the work undertaken on the portal: aligning it with an updated
reference design, implementing a participation-lifecycle feature set, and performing
a security review of the user-approval system with subsequent hardening.

### 1.1 Objectives

1. Bring the application in line with an updated reference version that introduced a
   participation-history capability.
2. Implement that capability (enrol / withdraw / deactivate / reactivate) without
   losing data the organisation needs for reporting.
3. Review the security of the account-approval flow and remediate any weaknesses.
4. Produce supporting documentation to professional standards.

---

## 2. Methodology

The work followed a structured, evidence-based approach rather than ad-hoc changes.

### 2.1 Comparative analysis (alignment task)

A newer reference build of the application was provided. To decide what to change,
a **file-by-file comparison** was performed between the current codebase and the
reference:

1. **Inventory** — listed and diffed the file trees to find added/removed files.
2. **Change sizing** — measured line-count deltas per file to locate the substantive
   differences (e.g. the reference's much larger Training, Reports, and profile pages).
3. **Functional extraction** — for each significantly changed file, the *functional*
   differences (data fields, database queries, business logic) were separated from
   cosmetic ones (styling, comments), and the **direction** of each change was noted
   (present in reference vs present in current).
4. **Conflict identification** — places where the current app was *ahead* of the
   reference were catalogued so they would not be regressed.
5. **Prioritisation** — changes were grouped into themes; the *participation-lifecycle
   foundation* was identified as the backbone other features depend on and was
   implemented first.

This produced a clear, justified work list before any code was written.

### 2.2 Security review

The approval feature was reviewed using a **threat-modelling** mindset — asking "how
could an attacker abuse this?" — across the relevant code and database policies:

- the sign-up path (`SignUp.tsx`) and the database trigger that creates profiles;
- the authentication/approval gate (`AuthContext.tsx`);
- the row-level-security (RLS) policies on every table (`supabase-setup.sql`);
- the approval UI (`Approvals.tsx`) and its route protection.

Findings were classified by severity and mapped to standard categories (broken
access control, privilege escalation). Reference: OWASP Top 10 access-control guidance.

### 2.3 Implementation & verification

Changes were made incrementally and verified by:
- a production build (`npm run build`),
- a TypeScript type-check pass (`tsc --noEmit`, since Vite does not type-check),
- and the manual test cases in [TESTING.md](TESTING.md).

All work was tracked in Git with descriptive commit messages (see `CHANGELOG.md`).

---

## 3. Background & Research

- **Architecture pattern:** the app is a single-page application backed by Supabase
  (PostgreSQL + Auth + RLS), a common "backend-as-a-service" pattern that removes the
  need for a bespoke server while still enforcing security at the database layer.
- **Authorisation model:** Role-Based Access Control (RBAC) — a widely used industry
  pattern — implemented through three roles and enforced by database policies.
- **Row-Level Security:** PostgreSQL RLS allows per-row authorisation rules. Research
  into Supabase's RLS guidance highlighted a known pitfall — policies that query the
  same table they protect can recurse infinitely — which directly informed the use of
  `SECURITY DEFINER` helper functions in the fix (see §6).
- **Soft-delete / audit history:** retaining records with status flags rather than
  deleting them is standard practice where historical reporting and auditability are
  required, which is the case for community-program participation data.

See [REFERENCES.md](REFERENCES.md) for the full list of libraries and sources.

---

## 4. Design Summary

The system is a client-side React application talking directly to Supabase. Its
data model centres on **participants**, **programs**, and the **enrolments** linking
them, with **attendance records**, **staff assignments**, and a **participation
history** log. Access is governed by the three-tier role model.

The full design — architecture diagram, entity-relationship diagram, role matrix,
workflow/sequence diagrams, key decisions and assumptions — is documented in
[DESIGN.md](DESIGN.md). Key design decisions are summarised there in §7; the most
significant are:

- RLS (not the UI) is the authoritative security boundary.
- A soft-delete lifecycle preserves history.
- Roles are assigned server-side, never from user input.
- Dates are normalised to noon UTC to avoid timezone day-shift bugs.

---

## 5. Implementation Summary

The participation-lifecycle foundation was implemented across the database and four
pages:

| Area | Change |
|------|--------|
| Database | New migration adding lifecycle columns, a `participation_history` table, and triggers that auto-log changes. |
| Participant profile | Hard-delete replaced with soft **withdraw / deactivate / reactivate / re-enrol**, each with a date and confirmation; a "Past Programs" section. |
| Add to Program | Enrolment-date picker; stores `start_date` and active status. |
| Attendance | Lists programs for the chosen date (bug fix); shows only active enrolees. |
| Participant search | Active/Inactive classification based on active enrolments. |

Conflicting improvements already present in the current app were deliberately
**preserved** (e.g. an additional participant field, schema-resilient database writes,
a safeguard that detects permission-blocked approvals). Full details are in
`CHANGELOG.md`.

---

## 6. Security Analysis & Hardening

The review of the approval feature found four issues, all since fixed
(`security-fixes.sql` + route guards). Summarised:

| # | Issue | Severity | Fix |
|---|-------|----------|-----|
| 1 | Sign-up trusted a client-supplied role, allowing self-assigned **admin** | High | Trigger hardcodes `role='staff'`; roles elevated only in the database |
| 2 | Participant data tables were world-accessible (`USING (true)`), so the public anon key alone could read/write personal data | Critical | Approval- and role-scoped RLS policies on every table |
| 3 | Any logged-in user could view all profiles and the approval list | Medium | Profile visibility restricted to owner or admin |
| 4 | Denying a sign-up left an orphaned authentication account | Low | Trigger removes the `auth.users` row on profile deletion |

A notable implementation detail: the role/approval checks were placed in
`SECURITY DEFINER` helper functions (`is_approved()`, `has_role()`) so that policies
on the `profiles` table do not recursively invoke themselves — avoiding the
infinite-recursion pitfall identified during research (§3).

A non-technical summary of these issues, suitable for stakeholders, is available on
request.

---

## 7. Testing

Testing is **manual**, organised as a structured test plan covering authentication
and approval, role-based access (both UI guards and database policies), participant
registration, the enrolment lifecycle, search classification, and attendance. Each
case lists pre-conditions, steps, and the expected result for the tester to record.

The plan also captures **debugging notes** for the seven defects found and fixed
during development (including the attendance date bug, the timezone day-shift, and
the two security defects). Static verification — a clean production build and a
TypeScript type-check pass — was performed and recorded.

Full detail: [TESTING.md](TESTING.md).

---

## 8. Conclusion & Future Work

The portal now has a robust participation-lifecycle capability with a full audit
trail, and the account-approval flow has been hardened so that authorisation is
enforced at the database level rather than only in the interface.

Deferred / future work (scoped but not yet implemented):

- The fitness/health-information capture workflow.
- The expanded demographic reporting and spreadsheet export.
- An interactive training walkthrough.
- Automated (unit/integration) test coverage to complement the manual plan.

**Operational note:** the security fixes and lifecycle features require the SQL
scripts to be applied to the live database in order (see [DESIGN.md](DESIGN.md) §9);
the application code changes are already deployed via Git.

---

## 9. References

See [REFERENCES.md](REFERENCES.md) for the complete list of libraries (with versions
and licences), design-system sources, tools, and documentation consulted.
