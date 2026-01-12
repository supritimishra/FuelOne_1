
-- Add representative_name to credit_customers table
ALTER TABLE credit_customers ADD COLUMN IF NOT EXISTS representative_name text;
