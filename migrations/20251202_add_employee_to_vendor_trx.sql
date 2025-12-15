ALTER TABLE vendor_transactions 
ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES employees(id);
