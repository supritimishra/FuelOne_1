-- Extend credit_customers with fields needed by new UI
ALTER TABLE credit_customers
  ADD COLUMN IF NOT EXISTS registered_date date,
  ADD COLUMN IF NOT EXISTS tin_gst_no text,
  ADD COLUMN IF NOT EXISTS representative_name text,
  ADD COLUMN IF NOT EXISTS organization_address text,
  ADD COLUMN IF NOT EXISTS advance_no text,
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS alt_phone_no text,
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS password_hash text,
  ADD COLUMN IF NOT EXISTS opening_date date,
  ADD COLUMN IF NOT EXISTS balance_type text, -- e.g. 'Due' or 'Excess'
  ADD COLUMN IF NOT EXISTS penalty_interest boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS discount_amount numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS offer_type text;

-- Vehicles table for per-customer vehicles
CREATE TABLE IF NOT EXISTS customer_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_customer_id uuid NOT NULL REFERENCES credit_customers(id) ON DELETE CASCADE,
  vehicle_no text NOT NULL,
  vehicle_type text,
  created_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_vehicles_customer ON customer_vehicles(credit_customer_id);
