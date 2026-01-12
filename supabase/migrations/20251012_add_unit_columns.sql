-- Ensure unit column exists on fuel_products and lubricants
ALTER TABLE fuel_products
  ADD COLUMN IF NOT EXISTS unit text DEFAULT 'Liters';

ALTER TABLE lubricants
  ADD COLUMN IF NOT EXISTS unit text DEFAULT 'Liters';

-- Backfill existing NULLs if any
UPDATE fuel_products SET unit = COALESCE(unit, 'Liters') WHERE unit IS NULL;
UPDATE lubricants SET unit = COALESCE(unit, 'Liters') WHERE unit IS NULL;
