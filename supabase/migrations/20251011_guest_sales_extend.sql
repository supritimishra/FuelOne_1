-- Add customer_name to guest_sales
ALTER TABLE guest_sales
  ADD COLUMN IF NOT EXISTS customer_name text;
