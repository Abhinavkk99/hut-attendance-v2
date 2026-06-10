# Test Plan & Results — The Hut Participation Portal

## 1. Purpose & Scope

This document defines manual test cases for the portal, covering authentication,
role-based access, the participation lifecycle, attendance, and the security
hardening. It also records debugging notes for defects found and fixed during
development.

> **How to read the Result column:** "Expected" describes the correct behaviour.
> Record the **Actual** outcome and mark **Pass/Fail** when you execute each case.
> Cases are written to be executed manually in a browser against a Supabase
> instance with all three SQL scripts applied (see DESIGN.md §9).

## 2. Test Environment

| Item | Value |
|------|-------|
| Build command | `npm run build` |
| Dev server | `npm run dev` |
| Browser | Chrome / Firefox (latest) |
| Backend | Supabase project with `supabase-setup.sql`, `historical-participation-tracking.sql`, `security-fixes.sql` applied |
| Test accounts | One each of: unapproved user, Staff, Manager, Admin |

## 3. Test Data Setup

1. Create an Admin: sign up, then in Supabase set `role='admin'`, `approved=true`.
2. Create a Manager and a Staff account; approve both; set roles accordingly.
3. Assign the Staff account to at least one program (`program_staff`).
4. Register 2–3 participants and enrol them in programs.

## 4. Test Cases

### 4.1 Authentication & Approval

| ID | Pre-condition | Steps | Expected Result | Actual | P/F |
|----|---------------|-------|-----------------|--------|-----|
| AUTH-01 | New user | Sign up with name/email/password | Account created; message indicates approval pending | | |
| AUTH-02 | Unapproved account | Attempt login | Login blocked with "pending approval" message; not taken to a dashboard | | |
| AUTH-03 | Admin logged in | Open Approvals; approve the pending user | User disappears from pending list | | |
| AUTH-04 | Newly approved user | Log in | Login succeeds; lands on a dashboard | | |
| AUTH-05 | Admin | Deny a pending user | User removed from list; profile deleted; email freed for re-registration | | |
| AUTH-06 | Logged in | Click Sign out | Session ends; redirected to /login; back button does not restore the app | | |

### 4.2 Role-Based Access (UI guards)

| ID | Role | Steps | Expected Result | Actual | P/F |
|----|------|-------|-----------------|--------|-----|
| RBAC-01 | Staff | Inspect sidebar | Only Attendance + Training (plus dashboard) visible | | |
| RBAC-02 | Manager | Inspect sidebar | Staff items + Register + Add to Program | | |
| RBAC-03 | Admin | Inspect sidebar | All items incl. Participants, Programs, Reports, Approvals | | |
| RBAC-04 | Staff | Manually type `/reports` in the URL | Redirected away (to home), not shown the page | | |
| RBAC-05 | Manager | Manually type `/approvals` in the URL | Redirected away, not shown the page | | |
| RBAC-06 | Staff | Manually type `/programs` in the URL | Redirected away | | |

### 4.3 Role-Based Access (database — the real boundary)

| ID | Role | Steps | Expected Result | Actual | P/F |
|----|------|-------|-----------------|--------|-----|
| RLS-01 | Unauthenticated (anon key only) | Query `participants` directly via the Supabase REST endpoint | Request returns no rows / permission denied | | |
| RLS-02 | Staff | Attempt to insert a participant via the API | Rejected by RLS (managers/admins only) | | |
| RLS-03 | Manager | Insert a participant via the app | Succeeds | | |
| RLS-04 | Staff | Attempt to read another user's profile via the API | Returns only own profile | | |
| RLS-05 | Approved Staff | Read programs / mark attendance | Succeeds | | |

### 4.4 Participant Registration

| ID | Pre-condition | Steps | Expected Result | Actual | P/F |
|----|---------------|-------|-----------------|--------|-----|
| REG-01 | Manager | Complete the multi-step registration with all required fields | Participant saved; appears in search | | |
| REG-02 | Manager | Submit with a required field blank | Validation prevents submission; field flagged | | |
| REG-03 | Manager | Register against a DB missing an optional column | Insert still succeeds (schema-resilient retry strips unknown columns) | | |

### 4.5 Enrolment & Participation Lifecycle

| ID | Pre-condition | Steps | Expected Result | Actual | P/F |
|----|---------------|-------|-----------------|--------|-----|
| LIFE-01 | Manager, participant exists | Add to Program with an enrolment date | Enrolment created; `start_date`/`is_active=true` stored | | |
| LIFE-02 | Participant enrolled in all programs | Open Add to Program | Programs already enrolled are hidden; message shown | | |
| LIFE-03 | Participant with active enrolment | On profile, Withdraw from one program (pick date) | Program moves to "Past Programs"; attendance history retained | | |
| LIFE-04 | Participant with a past program | Re-enroll from "Past Programs" | Program returns to active; end date/reason cleared | | |
| LIFE-05 | Active participant | Deactivate profile (pick date) | Profile marked inactive; all active enrolments ended; banner shown | | |
| LIFE-06 | Inactive participant | Reactivate profile | Profile active again; programs ended *by deactivation* restored; individually-withdrawn ones stay inactive | | |
| LIFE-07 | After any lifecycle action | Check `participation_history` in DB | A matching row (enrollment/withdrawal/deactivation/reactivation) was logged automatically | | |

### 4.6 Search & Classification

| ID | Pre-condition | Steps | Expected Result | Actual | P/F |
|----|---------------|-------|-----------------|--------|-----|
| SRCH-01 | Admin | Open Participants; search by name/email/phone | Matching participants listed | | |
| SRCH-02 | Participant with ≥1 active enrolment | Check classification | Listed under **Active** | | |
| SRCH-03 | Participant whose enrolments are all withdrawn | Check classification | Listed under **Inactive** | | |

### 4.7 Attendance

| ID | Pre-condition | Steps | Expected Result | Actual | P/F |
|----|---------------|-------|-----------------|--------|-----|
| ATT-01 | Staff assigned to a program | Open Attendance | Only assigned programs appear | | |
| ATT-02 | Manager/Admin | Open Attendance | All programs appear | | |
| ATT-03 | Any | Change the session date to a different weekday | Program list updates to that day's programs (regression test for ATT bug — see §5) | | |
| ATT-04 | Program with active + withdrawn enrolees | Open roster | Only active enrolees shown | | |
| ATT-05 | Roster loaded | Mark some present, save | `attendance_records` created with correct date/status; success shown | | |

## 5. Debugging Notes (defects found & fixed)

| # | Defect | Root cause | Fix | Verified by |
|---|--------|-----------|-----|-------------|
| D-1 | Attendance always showed *today's* programs even when a different session date was picked | Program list was filtered once by `new Date().getDay()` and never recomputed on date change | Derived the program list reactively from the selected date's day-of-week; clear selection if the chosen program isn't on that day | ATT-03 |
| D-2 | Enrolment / withdrawal dates could store the wrong calendar day | A bare `YYYY-MM-DD` parsed as UTC midnight shifts a day in some timezones | Normalise all chosen dates to **noon UTC** before storing | LIFE-01, LIFE-03 |
| D-3 | Withdrawing a participant destroyed their history | Action used a hard `DELETE` on the enrolment row | Replaced with soft-delete (`is_active=false` + end date + reason); history preserved and logged | LIFE-03, LIFE-07 |
| D-4 | Inactive participants misclassified as Active in search | Classification counted *all* enrolments, including withdrawn ones | Count only `is_active=true` enrolments | SRCH-03 |
| D-5 | **Security:** a user could register themselves as admin via the public API | Sign-up trigger trusted a client-supplied `role` value | Trigger now hardcodes `role='staff'`; roles elevated only in the DB | RLS-02, AUTH-04 |
| D-6 | **Security:** participant data reachable with the public anon key | Data tables had open `USING (true)` policies | Replaced with approval/role-scoped RLS | RLS-01, RLS-02 |
| D-7 | Risk of RLS infinite recursion when policies query `profiles` | A policy on `profiles` selecting from `profiles` | Role/approval checks moved into `SECURITY DEFINER` helper functions that bypass RLS | RLS-04, RLS-05 |

## 6. Build & Static Verification (performed)

| Check | Command | Result |
|-------|---------|--------|
| Production build compiles | `npm run build` | ✅ Pass — bundle produced, no errors |
| Type checking of changed files | `tsc --noEmit` (with project flags) | ✅ Pass — no type errors in edited files |

> Note: the project uses Vite/esbuild, which does not type-check during build, so a
> separate `tsc` pass was run to validate types. There is no automated unit-test
> suite in this project; the cases above are executed manually.

## 7. Known Limitations / Out of Scope

- No automated (unit/integration) tests are configured; testing is manual.
- Deactivating an `auth.users` account on "Deny" relies on a database trigger; in a
  hardened production setup this is often done via a service-role function instead.
- Reporting demographics depend on the optional participant fields being captured at
  registration.
