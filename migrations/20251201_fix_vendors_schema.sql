
-- Add missing columns to vendors table
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS opening_date date;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS opening_type text;
