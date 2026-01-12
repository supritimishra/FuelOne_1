-- Ensure swipe_machines table has is_active column
ALTER TABLE swipe_machines
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

UPDATE swipe_machines SET is_active = COALESCE(is_active, true) WHERE is_active IS NULL;
