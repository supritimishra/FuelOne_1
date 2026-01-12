-- Extend employees table to match UI and fix inserts
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS join_date date,
  ADD COLUMN IF NOT EXISTS employee_number text,
  ADD COLUMN IF NOT EXISTS phone_no text,
  ADD COLUMN IF NOT EXISTS id_proof_no text,
  ADD COLUMN IF NOT EXISTS designation text,
  ADD COLUMN IF NOT EXISTS salary_type text, -- 'Per Duty','Per Month','Monthly','Daily','Hourly'
  ADD COLUMN IF NOT EXISTS salary numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS has_pf boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_esi boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_income_tax boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_employees_name ON employees(employee_name);
