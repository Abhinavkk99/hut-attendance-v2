-- Quick update script to add recurrence_type and event_date columns to existing programs table
-- Run this in your Supabase SQL Editor if you already have a programs table

-- Add recurrence_type column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'programs' AND column_name = 'recurrence_type'
  ) THEN
    ALTER TABLE programs ADD COLUMN recurrence_type TEXT DEFAULT 'weekly' CHECK (recurrence_type IN ('weekly', 'fortnightly', 'one-time'));
    
    -- Update existing programs to have 'weekly' as default
    UPDATE programs SET recurrence_type = 'weekly' WHERE recurrence_type IS NULL;
    
    RAISE NOTICE 'Added recurrence_type column to programs table';
  ELSE
    RAISE NOTICE 'recurrence_type column already exists';
  END IF;
  
  -- Add event_date column for one-time events
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'programs' AND column_name = 'event_date'
  ) THEN
    ALTER TABLE programs ADD COLUMN event_date DATE;
    RAISE NOTICE 'Added event_date column to programs table';
  ELSE
    RAISE NOTICE 'event_date column already exists';
  END IF;
  
  -- Make days nullable/optional for one-time events
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'programs' AND column_name = 'days' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE programs ALTER COLUMN days DROP NOT NULL;
    ALTER TABLE programs ALTER COLUMN days SET DEFAULT '{}';
    RAISE NOTICE 'Made days column nullable for one-time events';
  ELSE
    RAISE NOTICE 'days column is already nullable';
  END IF;
END $$;

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'programs'
ORDER BY ordinal_position;
