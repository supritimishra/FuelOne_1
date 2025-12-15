-- ============================================================================
-- SEED SAMPLE DATA FOR TESTING
-- This creates minimal master data to test the petrol pump system
-- ============================================================================

-- ============================================================================
-- 1. FUEL PRODUCTS
-- ============================================================================
INSERT INTO fuel_products (product_name, unit, is_active) VALUES
('Petrol', 'Liters', true),
('Diesel', 'Liters', true),
('Premium Petrol', 'Liters', true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 2. TANKS (Linked to Fuel Products)
-- ============================================================================
DO $$
DECLARE
  v_petrol_id uuid;
  v_diesel_id uuid;
BEGIN
  -- Get product IDs
  SELECT id INTO v_petrol_id FROM fuel_products WHERE product_name = 'Petrol' LIMIT 1;
  SELECT id INTO v_diesel_id FROM fuel_products WHERE product_name = 'Diesel' LIMIT 1;
  
  -- Create tanks
  INSERT INTO tanks (tank_number, fuel_product_id, capacity, current_stock, is_active) VALUES
  ('Tank-1', v_petrol_id, 10000, 5000, true),
  ('Tank-2', v_petrol_id, 10000, 7500, true),
  ('Tank-3', v_diesel_id, 15000, 8000, true),
  ('Tank-4', v_diesel_id, 15000, 6500, true)
  ON CONFLICT DO NOTHING;
END $$;

-- ============================================================================
-- 3. NOZZLES (Linked to Tanks)
-- ============================================================================
DO $$
DECLARE
  v_tank1_id uuid;
  v_tank2_id uuid;
  v_tank3_id uuid;
  v_tank4_id uuid;
BEGIN
  -- Get tank IDs
  SELECT id INTO v_tank1_id FROM tanks WHERE tank_number = 'Tank-1' LIMIT 1;
  SELECT id INTO v_tank2_id FROM tanks WHERE tank_number = 'Tank-2' LIMIT 1;
  SELECT id INTO v_tank3_id FROM tanks WHERE tank_number = 'Tank-3' LIMIT 1;
  SELECT id INTO v_tank4_id FROM tanks WHERE tank_number = 'Tank-4' LIMIT 1;
  
  -- Create nozzles
  INSERT INTO nozzles (nozzle_number, tank_id, is_active) VALUES
  ('N-1', v_tank1_id, true),
  ('N-2', v_tank1_id, true),
  ('N-3', v_tank2_id, true),
  ('N-4', v_tank2_id, true),
  ('N-5', v_tank3_id, true),
  ('N-6', v_tank3_id, true),
  ('N-7', v_tank4_id, true),
  ('N-8', v_tank4_id, true)
  ON CONFLICT DO NOTHING;
END $$;

-- ============================================================================
-- 4. EMPLOYEES
-- ============================================================================
INSERT INTO employees (employee_name, mobile_number, designation, is_active) VALUES
('Ramesh Kumar', '9876543210', 'Operator', true),
('Suresh Patel', '9876543211', 'Operator', true),
('Mahesh Singh', '9876543212', 'Manager', true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 5. VENDORS
-- ============================================================================
INSERT INTO vendors (vendor_name, current_balance, is_active) VALUES
('Indian Oil Corporation', 0, true),
('Bharat Petroleum', 0, true),
('Hindustan Petroleum', 0, true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 6. CREDIT CUSTOMERS
-- ============================================================================
INSERT INTO credit_customers (
  organization_name,
  phone_number,
  email,
  address,
  credit_limit,
  current_balance,
  is_active
) VALUES
('ABC Transport Ltd', '9876501234', 'abc@transport.com', 'Delhi', 500000, 0, true),
('XYZ Logistics', '9876501235', 'xyz@logistics.com', 'Mumbai', 300000, 0, true),
('Global Freight Services', '9876501236', 'global@freight.com', 'Bangalore', 750000, 0, true),
('Speed Couriers', '9876501237', 'speed@couriers.com', 'Chennai', 200000, 0, true),
('Prime Movers', '9876501238', 'prime@movers.com', 'Pune', 400000, 0, true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 7. EXPENSE TYPES
-- ============================================================================
INSERT INTO expense_types (expense_type_name, is_active) VALUES
('Electricity Bill', true),
('Staff Salary', true),
('Maintenance', true),
('Office Supplies', true),
('Transportation', true),
('Miscellaneous', true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 8. LUBRICANTS
-- ============================================================================
INSERT INTO lubricants (
  lubricant_name,
  unit,
  mrp_rate,
  sale_rate,
  current_stock,
  minimum_stock,
  is_active
) VALUES
('Castrol GTX 20W-50', 'Liters', 350, 500, 100, 20, true),
('Mobil 1 5W-30', 'Liters', 450, 650, 80, 15, true),
('Shell Helix HX7', 'Liters', 400, 550, 60, 15, true),
('Servo Pride 15W-40', 'Liters', 280, 400, 120, 25, true),
('Engine Coolant', 'Liters', 150, 250, 50, 10, true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 9. SWIPE MACHINES (for card payments)
-- ============================================================================
INSERT INTO swipe_machines (machine_name, machine_type, provider, bank_type, is_active) VALUES
('HDFC POS-1', 'Card', 'HDFC Bank', 'HDFC Bank', true),
('ICICI POS-1', 'Card', 'ICICI Bank', 'ICICI Bank', true),
('SBI POS-1', 'Card', 'State Bank of India', 'State Bank of India', true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check data created
SELECT 'Fuel Products' as entity, COUNT(*) as count FROM fuel_products
UNION ALL
SELECT 'Tanks', COUNT(*) FROM tanks
UNION ALL
SELECT 'Nozzles', COUNT(*) FROM nozzles
UNION ALL
SELECT 'Employees', COUNT(*) FROM employees
UNION ALL
SELECT 'Vendors', COUNT(*) FROM vendors
UNION ALL
SELECT 'Credit Customers', COUNT(*) FROM credit_customers
UNION ALL
SELECT 'Expense Types', COUNT(*) FROM expense_types
UNION ALL
SELECT 'Lubricants', COUNT(*) FROM lubricants
UNION ALL
SELECT 'Swipe Machines', COUNT(*) FROM swipe_machines;

-- ============================================================================
-- READY TO TEST!
-- ============================================================================
-- You can now:
-- 1. Create Guest Sales → Tank stock will auto-reduce
-- 2. Create Credit Sales → Customer balance will auto-increase
-- 3. Record Recoveries → Customer balance will auto-decrease
-- 4. Create Tanker Purchases → Tank stock will auto-increase
-- 5. Make Vendor Payments → Vendor balance will auto-update
-- ============================================================================
