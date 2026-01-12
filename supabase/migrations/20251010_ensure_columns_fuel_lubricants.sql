-- Add or align columns for fuel_products to match app
ALTER TABLE fuel_products
  ADD COLUMN IF NOT EXISTS short_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS gst_percentage numeric(5,2),
  ADD COLUMN IF NOT EXISTS tds_percentage numeric(5,2),
  ADD COLUMN IF NOT EXISTS wgt_percentage numeric(5,2),
  ADD COLUMN IF NOT EXISTS lfrn text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Optional: backfill lfrn empty to '' to satisfy NOT NULL
UPDATE fuel_products SET lfrn = COALESCE(lfrn, '') WHERE lfrn IS NULL;

-- Lubricants: ensure columns exist and rename maximum_stock->minimum_stock if needed
ALTER TABLE lubricants
  ADD COLUMN IF NOT EXISTS hsn_code text,
  ADD COLUMN IF NOT EXISTS gst_percentage numeric(5,2),
  ADD COLUMN IF NOT EXISTS mrp_rate numeric(10,2),
  ADD COLUMN IF NOT EXISTS sale_rate numeric(10,2),
  ADD COLUMN IF NOT EXISTS minimum_stock integer,
  ADD COLUMN IF NOT EXISTS current_stock integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- If an old column maximum_stock exists, migrate it to minimum_stock (keep data)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='lubricants' AND column_name='maximum_stock'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='lubricants' AND column_name='minimum_stock'
  ) THEN
    ALTER TABLE lubricants RENAME COLUMN maximum_stock TO minimum_stock;
  END IF;
END$$;

-- Create indexes useful for lookups
CREATE INDEX IF NOT EXISTS idx_fuel_products_name ON fuel_products (product_name);
CREATE INDEX IF NOT EXISTS idx_lubricants_name ON lubricants (lubricant_name);
