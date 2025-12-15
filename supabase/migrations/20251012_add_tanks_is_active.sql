-- Ensure tanks has is_active column
ALTER TABLE tanks
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Backfill existing NULLs
UPDATE tanks SET is_active = COALESCE(is_active, true) WHERE is_active IS NULL;
