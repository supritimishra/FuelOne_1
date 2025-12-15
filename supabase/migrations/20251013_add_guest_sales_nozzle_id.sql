-- Add nozzle_id to guest_sales so guest sale records can reference the nozzle used
ALTER TABLE guest_sales
  ADD COLUMN IF NOT EXISTS nozzle_id uuid REFERENCES nozzles(id);

-- No backfill required; keep nullable to avoid breaking existing data
