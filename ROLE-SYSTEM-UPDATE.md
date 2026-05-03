# Role System Update Guide

## Overview
The Hut Participation Portal now has a **3-tier role system** instead of the previous 2-tier system.

## New Roles

### 1. **Staff** (Limited Access)
- **Can Access:**
  - ✅ Mark Attendance (ONLY for programs they are assigned to)
  - ✅ Staff Training
  
- **Cannot Access:**
  - ❌ Register Participant
  - ❌ Add to Program
  - ❌ Find Participant
  - ❌ View Programs
  - ❌ View Reports
  - ❌ User Approvals

### 2. **Manager** (Moderate Access)
- **Can Access:**
  - ✅ Mark Attendance (all programs)
  - ✅ Staff Training
  - ✅ Register Participant
  - ✅ Add to Program
  
- **Cannot Access:**
  - ❌ Find Participant (full search)
  - ❌ View Programs (cannot add/edit/delete programs)
  - ❌ View Reports
  - ❌ User Approvals

### 3. **Admin** (Full Access)
- **Can Access:**
  - ✅ Everything - Full system access
  - ✅ Mark Attendance (all programs)
  - ✅ Staff Training
  - ✅ Register Participant
  - ✅ Add to Program
  - ✅ Find Participant
  - ✅ View Programs (add/edit/delete programs & assign staff)
  - ✅ View Reports
  - ✅ User Approvals

---

## Database Setup

**There is now ONLY ONE script to run for both new and existing databases:**

1. **Open your Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `/supabase-setup.sql`
4. Click **Run** to execute

This script is now **IDEMPOTENT** - you can run it multiple times safely! It will:
- ✅ Create tables if they don't exist
- ✅ Add missing columns to existing tables
- ✅ Update the role constraint from 2 roles to 3 roles
- ✅ Convert any existing 'volunteer' users to 'staff' role
- ✅ Keep existing 'staff' users as 'staff' (you can promote them manually)

**No matter if you're starting fresh or updating an existing database, just run `/supabase-setup.sql` and you're done!**

---

## Manual Role Assignment

After running the migration, you'll need to manually assign roles to users:

1. Go to **Supabase Dashboard** → **Table Editor**
2. Select the **profiles** table
3. Find users and update their `role` column to:
   - `staff` - for limited access users
   - `manager` - for moderate access users  
   - `admin` - for full access users

---

## Key Features

### Staff Role - Program-Specific Attendance
Staff members can ONLY see and mark attendance for programs they are assigned to. This is enforced by:

- Attendance page filters programs based on `program_staff` assignments
- Staff must be assigned to a program through the "View Programs" page (by an admin)
- If a staff member has no program assignments, they will see no programs

### Navigation Filtering
The sidebar navigation automatically shows/hides menu items based on the user's role:

- **Staff**: Only see "Mark Attendance" and "Staff Training"
- **Manager**: See Staff items + "Register Participant" and "Add to Program"
- **Admin**: See all navigation items

### Dashboard Access Control
The main dashboard also filters available actions based on role permissions.

---

## Important Notes

1. **Default Role**: New user signups still default to the first role alphabetically, so you may want to update the signup logic to default to 'staff' instead of 'admin'

2. **Supabase Admins Only**: Only Supabase database administrators can change user roles (this is intentional for security)

3. **Program Staff Assignment**: Admins must assign staff to specific programs through the "View Programs" page

4. **Testing**: Make sure to test each role level to ensure proper access control

---

## Testing Checklist

### Test Staff Role:
- [ ] Can only see "Mark Attendance" and "Staff Training" in navigation
- [ ] Can only see programs they are assigned to in attendance page
- [ ] Cannot access any admin/manager pages

### Test Manager Role:
- [ ] Can see Staff items + "Register Participant" and "Add to Program"
- [ ] Can mark attendance for ALL programs
- [ ] Can add participants and enroll them in programs
- [ ] Cannot access programs management or reports

### Test Admin Role:
- [ ] Can see all navigation items
- [ ] Can access all pages
- [ ] Can manage programs, assign staff, view reports
- [ ] Can approve users

---

## Troubleshooting

### "Column role check constraint violation"
- Make sure you ran the complete `/supabase-setup.sql` file
- The roles must be exactly 'staff', 'manager', or 'admin' (lowercase)

### "Staff can see all programs"
- Make sure the Attendance page update was applied correctly
- Check that the user's role is exactly 'staff' (lowercase) in the database

### "Navigation items not filtering"
- Check that the Layout component updates were applied
- Verify the user's role is being passed correctly from AuthContext

---

## Need Help?

If you encounter any issues, check:
1. User's exact role value in the profiles table (must be 'staff', 'manager', or 'admin')
2. Program staff assignments in the program_staff table
3. Browser console for any JavaScript errors