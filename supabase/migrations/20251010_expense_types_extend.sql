-- Extend expense_types for Effect and Options
ALTER TABLE expense_types
  ADD COLUMN IF NOT EXISTS effect_for text CHECK (effect_for IN ('Employee','Profit')),
  ADD COLUMN IF NOT EXISTS options text,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Optional: rename column if legacy name exists
-- DO NOT run automatically; kept for reference
-- ALTER TABLE expense_types RENAME COLUMN expense_type_name TO expense_name;

CREATE INDEX IF NOT EXISTS idx_expense_types_name ON expense_types(expense_type_name);
