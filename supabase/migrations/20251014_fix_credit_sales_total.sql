-- This migration was an attempted in-place conversion of credit_sales.total_amount to a
-- generated column but failed because the column had dependent objects. It has been
-- superseded by `20251014b_ensure_credit_total_and_fix_trigger.sql` which provides
-- a safe approach (BEFORE INSERT/UPDATE trigger to populate total_amount and a
-- resilient customer-balance update function).

-- No-op placeholder to record that the intent was handled by a later, safer migration.

