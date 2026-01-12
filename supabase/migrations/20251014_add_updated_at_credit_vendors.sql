-- Add updated_at columns used by triggers
ALTER TABLE credit_customers
  ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now();

ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now();
