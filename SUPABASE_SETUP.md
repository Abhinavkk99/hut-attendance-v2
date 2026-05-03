# Supabase Authentication Setup Guide

## Step 1: Create the Profiles Table

Run this SQL in your Supabase SQL Editor (Dashboard → SQL Editor → New Query):

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('staff', 'volunteer')),
  full_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own profile
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Create policy to allow authenticated users to read all profiles (optional - adjust based on your needs)
CREATE POLICY "Authenticated users can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Create an index on email for faster lookups
CREATE INDEX profiles_email_idx ON profiles(email);
```

## Step 2: Create a Function to Auto-Create Profiles

This function will automatically create a profile when a new user is created:

```sql
-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'volunteer'),
    COALESCE(new.raw_user_meta_data->>'full_name', new.email)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Step 3: Create Test Users

### Option A: Using Supabase Dashboard (Easiest)

1. Go to **Authentication → Users** in your Supabase dashboard
2. Click **"Add User"** → **"Create new user"**
3. Fill in the form:
   - **Email:** `staff@thehut.com`
   - **Password:** `password123` (or your preferred password)
   - **Auto Confirm User:** ✅ Check this box
   - **User Metadata (JSON):**
     ```json
     {
       "role": "staff",
       "full_name": "Staff Member"
     }
     ```
4. Click **"Create user"**

Repeat for a volunteer user:
   - **Email:** `volunteer@thehut.com`
   - **Password:** `password123`
   - **Auto Confirm User:** ✅ Check this box
   - **User Metadata (JSON):**
     ```json
     {
       "role": "volunteer",
       "full_name": "Volunteer Member"
     }
     ```

### Option B: Using SQL

Run this in SQL Editor (replace passwords with secure ones):

```sql
-- NOTE: This is for testing only. In production, users should sign up through the app
-- or you should use the Supabase Dashboard to create users.

-- The trigger will automatically create the profile entries
-- when these users are created through the Supabase Auth system.

-- Use the dashboard method above instead of this SQL approach
-- as it properly handles password hashing and user creation.
```

## Step 4: Verify Setup

Run this query to check if profiles were created:

```sql
SELECT * FROM profiles;
```

You should see your staff and volunteer users listed.

## Step 5: Test Login

1. Go to your app login page
2. Try logging in with:
   - **Staff:** `staff@thehut.com` / `password123`
   - **Volunteer:** `volunteer@thehut.com` / `password123`

Staff users will be redirected to `/dashboard`
Volunteer users will be redirected to `/volunteer-dashboard`

## Step 6: Add More Users (Production)

To add more users in production:

1. Go to Supabase Dashboard → **Authentication → Users**
2. Click **"Invite user"** or **"Add user"**
3. Set the role in User Metadata:
   ```json
   {
     "role": "staff",
     "full_name": "John Doe"
   }
   ```
   OR
   ```json
   {
     "role": "volunteer",
     "full_name": "Jane Smith"
   }
   ```

## Security Notes

### Row Level Security (RLS) Policies

The current setup allows:
- ✅ Users can read their own profile
- ✅ All authenticated users can view all profiles (useful for staff to see volunteer names)

To restrict profile viewing to staff only, replace the second policy with:

```sql
-- Drop the existing policy
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON profiles;

-- Create new policy that only allows staff to view all profiles
CREATE POLICY "Staff can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR 
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'staff'
  );
```

### Email Confirmation

For production, you should:
1. Enable email confirmation in Supabase Dashboard → **Authentication → Settings**
2. Configure email templates
3. Set up your email provider (SMTP)

## Troubleshooting

### Error: "Profile not found"
- Check if the profile was created in the `profiles` table
- Verify the trigger is working
- Manually insert a profile if needed:
  ```sql
  INSERT INTO profiles (id, email, role, full_name)
  VALUES (
    'USER_UUID_FROM_AUTH_USERS',
    'user@example.com',
    'staff',
    'User Name'
  );
  ```

### Error: "Invalid login credentials"
- Verify email/password are correct
- Check if user exists in Authentication → Users
- Ensure "Auto Confirm User" was checked when creating the user

### Users can't access certain features
- Check the `role` field in the `profiles` table
- Verify it's either 'staff' or 'volunteer' (lowercase)
- Update if needed:
  ```sql
  UPDATE profiles SET role = 'staff' WHERE email = 'user@example.com';
  ```

## Database Schema Reference

### Profiles Table Structure
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key, references auth.users |
| email | TEXT | User's email (unique) |
| role | TEXT | Either 'staff' or 'volunteer' |
| full_name | TEXT | User's display name |
| created_at | TIMESTAMP | When profile was created |

## Next Steps

After setting up authentication:
1. ✅ Create profiles table
2. ✅ Create test users
3. ✅ Test login functionality
4. 🔜 Deploy to production (Vercel/Netlify)
5. 🔜 Configure email confirmation for production
6. 🔜 Add password reset functionality (if needed)

---

**Need Help?** Check the Supabase documentation at https://supabase.com/docs/guides/auth
