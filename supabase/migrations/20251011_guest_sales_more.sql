-- Extend guest_sales for redesigned Guest Entry
ALTER TABLE guest_sales
  ADD COLUMN IF NOT EXISTS sale_date date,
  ADD COLUMN IF NOT EXISTS offer_type text,
  ADD COLUMN IF NOT EXISTS gst_tin text;
