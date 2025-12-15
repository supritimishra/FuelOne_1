-- Add duties column to duty_shifts
ALTER TABLE duty_shifts
  ADD COLUMN IF NOT EXISTS duties integer;
