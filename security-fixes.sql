-- ============================================================================
-- SECURITY FIXES
-- Run this in the Supabase SQL Editor AFTER supabase-setup.sql and
-- historical-participation-tracking.sql. Idempotent — safe to re-run.
--
-- Fixes:
--   1. Privilege escalation: signup no longer trusts a client-supplied role.
--   2. Open data tables: replaces "USING (true)" policies with approval/role
--      checks, so the anon key alone can no longer read/write participant data.
--   3. Profile disclosure: profiles are readable only by the owner or an admin.
--   4. Deny cleanup: deleting a profile also removes the orphaned auth user.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER so they read profiles WITHOUT triggering
-- the profiles RLS policies — this avoids infinite recursion).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_approved()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND approved = true
  );
$$;

CREATE OR REPLACE FUNCTION public.has_role(required_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND approved = true
      AND role = ANY(required_roles)
  );
$$;

-- ----------------------------------------------------------------------------
-- FIX 1: signup must not trust a client-supplied role. Everyone starts as
-- 'staff' + unapproved; elevate roles manually in the DB only.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, full_name, approved)
  VALUES (
    new.id,
    new.email,
    'staff',                                                   -- never from metadata
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    false
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ----------------------------------------------------------------------------
-- FIX 3: profiles — owner can read own row; admins can read all (for Approvals).
-- No more "all authenticated can view all profiles".
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles for approvals" ON profiles;
DROP POLICY IF EXISTS "Admins can delete unapproved profiles" ON profiles;
DROP POLICY IF EXISTS "Staff can update profiles for approvals" ON profiles;
DROP POLICY IF EXISTS "Staff can delete unapproved profiles" ON profiles;
DROP POLICY IF EXISTS "Owner or admin can view profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;

CREATE POLICY "Owner or admin can view profiles"
  ON profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(ARRAY['admin']));

CREATE POLICY "Admins can update profiles"
  ON profiles FOR UPDATE TO authenticated
  USING (public.has_role(ARRAY['admin']))
  WITH CHECK (public.has_role(ARRAY['admin']));

CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE TO authenticated
  USING (public.has_role(ARRAY['admin']));

-- ----------------------------------------------------------------------------
-- FIX 2: data tables — replace the open "for all users" policies with
-- approval/role-scoped policies. Only approved, authenticated users get in.
-- ----------------------------------------------------------------------------

-- participants: read = any approved user; write = manager/admin; delete = admin
DROP POLICY IF EXISTS "Enable read access for all users" ON participants;
DROP POLICY IF EXISTS "Enable insert access for all users" ON participants;
DROP POLICY IF EXISTS "Enable update access for all users" ON participants;
DROP POLICY IF EXISTS "Enable delete access for all users" ON participants;
DROP POLICY IF EXISTS "participants_select" ON participants;
DROP POLICY IF EXISTS "participants_insert" ON participants;
DROP POLICY IF EXISTS "participants_update" ON participants;
DROP POLICY IF EXISTS "participants_delete" ON participants;

CREATE POLICY "participants_select" ON participants
  FOR SELECT TO authenticated USING (public.is_approved());
CREATE POLICY "participants_insert" ON participants
  FOR INSERT TO authenticated WITH CHECK (public.has_role(ARRAY['manager','admin']));
CREATE POLICY "participants_update" ON participants
  FOR UPDATE TO authenticated
  USING (public.has_role(ARRAY['manager','admin']))
  WITH CHECK (public.has_role(ARRAY['manager','admin']));
CREATE POLICY "participants_delete" ON participants
  FOR DELETE TO authenticated USING (public.has_role(ARRAY['admin']));

-- programs: read = any approved user; write = admin only
DROP POLICY IF EXISTS "Enable read access for all users" ON programs;
DROP POLICY IF EXISTS "Enable insert access for all users" ON programs;
DROP POLICY IF EXISTS "Enable update access for all users" ON programs;
DROP POLICY IF EXISTS "Enable delete access for all users" ON programs;
DROP POLICY IF EXISTS "programs_select" ON programs;
DROP POLICY IF EXISTS "programs_insert" ON programs;
DROP POLICY IF EXISTS "programs_update" ON programs;
DROP POLICY IF EXISTS "programs_delete" ON programs;

CREATE POLICY "programs_select" ON programs
  FOR SELECT TO authenticated USING (public.is_approved());
CREATE POLICY "programs_insert" ON programs
  FOR INSERT TO authenticated WITH CHECK (public.has_role(ARRAY['admin']));
CREATE POLICY "programs_update" ON programs
  FOR UPDATE TO authenticated
  USING (public.has_role(ARRAY['admin'])) WITH CHECK (public.has_role(ARRAY['admin']));
CREATE POLICY "programs_delete" ON programs
  FOR DELETE TO authenticated USING (public.has_role(ARRAY['admin']));

-- program_enrollments: read = approved; insert/update = manager/admin; delete = admin
DROP POLICY IF EXISTS "Enable read access for all users" ON program_enrollments;
DROP POLICY IF EXISTS "Enable insert access for all users" ON program_enrollments;
DROP POLICY IF EXISTS "Enable update access for all users" ON program_enrollments;
DROP POLICY IF EXISTS "Enable delete access for all users" ON program_enrollments;
DROP POLICY IF EXISTS "program_enrollments_select" ON program_enrollments;
DROP POLICY IF EXISTS "program_enrollments_insert" ON program_enrollments;
DROP POLICY IF EXISTS "program_enrollments_update" ON program_enrollments;
DROP POLICY IF EXISTS "program_enrollments_delete" ON program_enrollments;

CREATE POLICY "program_enrollments_select" ON program_enrollments
  FOR SELECT TO authenticated USING (public.is_approved());
CREATE POLICY "program_enrollments_insert" ON program_enrollments
  FOR INSERT TO authenticated WITH CHECK (public.has_role(ARRAY['manager','admin']));
CREATE POLICY "program_enrollments_update" ON program_enrollments
  FOR UPDATE TO authenticated
  USING (public.has_role(ARRAY['manager','admin']))
  WITH CHECK (public.has_role(ARRAY['manager','admin']));
CREATE POLICY "program_enrollments_delete" ON program_enrollments
  FOR DELETE TO authenticated USING (public.has_role(ARRAY['admin']));

-- attendance_records: read + insert = any approved user (all roles mark
-- attendance); update/delete = admin only.
DROP POLICY IF EXISTS "Enable read access for all users" ON attendance_records;
DROP POLICY IF EXISTS "Enable insert access for all users" ON attendance_records;
DROP POLICY IF EXISTS "Enable update access for all users" ON attendance_records;
DROP POLICY IF EXISTS "Enable delete access for all users" ON attendance_records;
DROP POLICY IF EXISTS "attendance_records_select" ON attendance_records;
DROP POLICY IF EXISTS "attendance_records_insert" ON attendance_records;
DROP POLICY IF EXISTS "attendance_records_update" ON attendance_records;
DROP POLICY IF EXISTS "attendance_records_delete" ON attendance_records;

CREATE POLICY "attendance_records_select" ON attendance_records
  FOR SELECT TO authenticated USING (public.is_approved());
CREATE POLICY "attendance_records_insert" ON attendance_records
  FOR INSERT TO authenticated WITH CHECK (public.is_approved());
CREATE POLICY "attendance_records_update" ON attendance_records
  FOR UPDATE TO authenticated
  USING (public.has_role(ARRAY['manager','admin']))
  WITH CHECK (public.has_role(ARRAY['manager','admin']));
CREATE POLICY "attendance_records_delete" ON attendance_records
  FOR DELETE TO authenticated USING (public.has_role(ARRAY['admin']));

-- program_staff: read = approved (staff look up own assignments); write = admin
DROP POLICY IF EXISTS "Enable read access for all users" ON program_staff;
DROP POLICY IF EXISTS "Enable insert access for all users" ON program_staff;
DROP POLICY IF EXISTS "Enable update access for all users" ON program_staff;
DROP POLICY IF EXISTS "Enable delete access for all users" ON program_staff;
DROP POLICY IF EXISTS "program_staff_select" ON program_staff;
DROP POLICY IF EXISTS "program_staff_insert" ON program_staff;
DROP POLICY IF EXISTS "program_staff_update" ON program_staff;
DROP POLICY IF EXISTS "program_staff_delete" ON program_staff;

CREATE POLICY "program_staff_select" ON program_staff
  FOR SELECT TO authenticated USING (public.is_approved());
CREATE POLICY "program_staff_insert" ON program_staff
  FOR INSERT TO authenticated WITH CHECK (public.has_role(ARRAY['admin']));
CREATE POLICY "program_staff_update" ON program_staff
  FOR UPDATE TO authenticated
  USING (public.has_role(ARRAY['admin'])) WITH CHECK (public.has_role(ARRAY['admin']));
CREATE POLICY "program_staff_delete" ON program_staff
  FOR DELETE TO authenticated USING (public.has_role(ARRAY['admin']));

-- participation_history (created by historical-participation-tracking.sql).
-- Tighten read to approved users. Inserts come from SECURITY DEFINER triggers,
-- which bypass RLS, so no client INSERT policy is needed. Guarded so this file
-- still runs if the migration hasn't been applied yet.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'participation_history') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Allow authenticated users to read participation history" ON participation_history';
    EXECUTE 'DROP POLICY IF EXISTS "Allow authenticated users to insert participation history" ON participation_history';
    EXECUTE 'DROP POLICY IF EXISTS "participation_history_select" ON participation_history';
    EXECUTE 'CREATE POLICY "participation_history_select" ON participation_history
               FOR SELECT TO authenticated USING (public.is_approved())';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- FIX 4: when a profile is deleted (e.g. "Deny" on the Approvals page), also
-- delete the orphaned auth.users row so the email is freed and no ghost account
-- lingers. Runs as definer so it can touch the auth schema.
-- Remove this trigger if you'd rather keep auth users after profile deletion.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_profile_deleted()
RETURNS trigger AS $$
BEGIN
  DELETE FROM auth.users WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_profile_deleted ON profiles;
CREATE TRIGGER on_profile_deleted
  AFTER DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_profile_deleted();
