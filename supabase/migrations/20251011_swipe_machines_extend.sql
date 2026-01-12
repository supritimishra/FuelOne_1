-- Extend swipe_machines to support attach type and vendor linking
ALTER TABLE swipe_machines
  ADD COLUMN IF NOT EXISTS attach_type text CHECK (attach_type IN ('Bank','Vendor')),
  ADD COLUMN IF NOT EXISTS bank_type text,
  ADD COLUMN IF NOT EXISTS vendor_id uuid REFERENCES vendors(id);

CREATE INDEX IF NOT EXISTS idx_swipe_machines_attach ON swipe_machines(attach_type);
