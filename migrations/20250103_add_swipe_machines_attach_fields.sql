-- Add attach_type, bank_type, and vendor_id columns to swipe_machines table
-- These fields allow linking swipe machines to banks or vendors

ALTER TABLE swipe_machines 
ADD COLUMN IF NOT EXISTS attach_type TEXT,
ADD COLUMN IF NOT EXISTS bank_type TEXT,
ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES vendors(id);

-- Add comments for documentation
COMMENT ON COLUMN swipe_machines.attach_type IS 'Type of attachment: Bank, Vendor, or NULL';
COMMENT ON COLUMN swipe_machines.bank_type IS 'Bank name if attach_type is Bank';
COMMENT ON COLUMN swipe_machines.vendor_id IS 'Vendor ID if attach_type is Vendor';

