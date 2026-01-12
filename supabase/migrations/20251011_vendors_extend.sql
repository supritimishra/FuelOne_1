-- Extend vendors table for new UI fields
ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS opening_date date,
  ADD COLUMN IF NOT EXISTS opening_type text CHECK (opening_type IN ('Payable','Receivable')),
  ADD COLUMN IF NOT EXISTS description text;

CREATE INDEX IF NOT EXISTS idx_vendors_name ON vendors(vendor_name);
