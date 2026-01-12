
-- Add remaining missing columns to vendors table
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
