-- Add missing columns to credit_sales to support UI fields
ALTER TABLE credit_sales
  ADD COLUMN IF NOT EXISTS shift text,
  ADD COLUMN IF NOT EXISTS discount numeric(12,2),
  ADD COLUMN IF NOT EXISTS indent_no text,
  ADD COLUMN IF NOT EXISTS misc_charges numeric(12,2),
  ADD COLUMN IF NOT EXISTS bill_no text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS meter_reading text,
  ADD COLUMN IF NOT EXISTS mileage numeric(12,2),
  ADD COLUMN IF NOT EXISTS advance numeric(12,2);

-- Optional index for quick filtering
CREATE INDEX IF NOT EXISTS idx_credit_sales_sale_date ON credit_sales(sale_date);

