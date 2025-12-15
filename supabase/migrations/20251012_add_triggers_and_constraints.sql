-- ============================================================================
-- PETROL PUMP ACCOUNTING SYSTEM - TRIGGERS & CONSTRAINTS
-- This migration adds practical functionality for stock management,
-- credit tracking, and accounting integrity
-- ============================================================================

-- ============================================================================
-- 1. STOCK MANAGEMENT TRIGGERS
-- ============================================================================

-- Trigger: Auto-update tank stock on guest sale
CREATE OR REPLACE FUNCTION update_tank_stock_on_guest_sale()
RETURNS TRIGGER AS $$
DECLARE
  v_tank_id uuid;
BEGIN
  -- Get tank_id from nozzle (if nozzle_id provided) or fuel_product
  IF NEW.nozzle_id IS NOT NULL THEN
    SELECT tank_id INTO v_tank_id 
    FROM nozzles 
    WHERE id = NEW.nozzle_id;
  ELSE
    -- Get first active tank for this fuel product
    SELECT id INTO v_tank_id 
    FROM tanks 
    WHERE fuel_product_id = NEW.fuel_product_id 
      AND is_active = true 
    LIMIT 1;
  END IF;

  -- Reduce tank stock
  IF v_tank_id IS NOT NULL THEN
    UPDATE tanks 
    SET current_stock = current_stock - NEW.quantity,
        updated_at = now()
    WHERE id = v_tank_id;
    
    -- Check if stock went negative
    IF (SELECT current_stock FROM tanks WHERE id = v_tank_id) < 0 THEN
      RAISE EXCEPTION 'Insufficient stock in tank. Sale quantity: %, Available: %', 
        NEW.quantity, 
        (SELECT current_stock + NEW.quantity FROM tanks WHERE id = v_tank_id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_tank_stock_on_guest_sale
AFTER INSERT ON guest_sales
FOR EACH ROW
EXECUTE FUNCTION update_tank_stock_on_guest_sale();

-- Trigger: Auto-update tank stock on credit sale
CREATE OR REPLACE FUNCTION update_tank_stock_on_credit_sale()
RETURNS TRIGGER AS $$
DECLARE
  v_tank_id uuid;
BEGIN
  -- Get first active tank for this fuel product
  SELECT id INTO v_tank_id 
  FROM tanks 
  WHERE fuel_product_id = NEW.fuel_product_id 
    AND is_active = true 
  LIMIT 1;

  -- Reduce tank stock
  IF v_tank_id IS NOT NULL THEN
    UPDATE tanks 
    SET current_stock = current_stock - NEW.quantity,
        updated_at = now()
    WHERE id = v_tank_id;
    
    IF (SELECT current_stock FROM tanks WHERE id = v_tank_id) < 0 THEN
      RAISE EXCEPTION 'Insufficient stock in tank';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_tank_stock_on_credit_sale
AFTER INSERT ON credit_sales
FOR EACH ROW
EXECUTE FUNCTION update_tank_stock_on_credit_sale();

-- Trigger: Auto-update tank stock on tanker purchase (receipt)
CREATE OR REPLACE FUNCTION update_tank_stock_on_tanker_purchase()
RETURNS TRIGGER AS $$
BEGIN
  -- Increase tank stock on fuel receipt
  IF NEW.tank_id IS NOT NULL THEN
    UPDATE tanks 
    SET current_stock = current_stock + NEW.tanker_sale_quantity,
        updated_at = now()
    WHERE id = NEW.tank_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_tank_stock_on_tanker_purchase
AFTER INSERT ON tanker_sales
FOR EACH ROW
EXECUTE FUNCTION update_tank_stock_on_tanker_purchase();

-- ============================================================================
-- 2. CREDIT CUSTOMER BALANCE TRIGGERS
-- ============================================================================

-- Trigger: Update customer balance on credit sale
CREATE OR REPLACE FUNCTION update_customer_balance_on_sale()
RETURNS TRIGGER AS $$
DECLARE
  v_credit_limit numeric;
  v_current_balance numeric;
BEGIN
  -- Get customer's credit limit and current balance
  SELECT credit_limit, current_balance 
  INTO v_credit_limit, v_current_balance
  FROM credit_customers
  WHERE id = NEW.credit_customer_id;

  -- Check if adding this sale would exceed credit limit
  IF (v_current_balance + NEW.total_amount) > v_credit_limit THEN
    RAISE EXCEPTION 'Credit limit exceeded. Limit: ₹%, Current: ₹%, Sale: ₹%', 
      v_credit_limit, v_current_balance, NEW.total_amount;
  END IF;

  -- Update customer balance
  UPDATE credit_customers
  SET current_balance = current_balance + NEW.total_amount,
      updated_at = now()
  WHERE id = NEW.credit_customer_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_customer_balance_on_sale
AFTER INSERT ON credit_sales
FOR EACH ROW
EXECUTE FUNCTION update_customer_balance_on_sale();

-- Trigger: Update customer balance on recovery (payment received)
CREATE OR REPLACE FUNCTION update_customer_balance_on_recovery()
RETURNS TRIGGER AS $$
BEGIN
  -- Reduce customer balance
  UPDATE credit_customers
  SET current_balance = current_balance - NEW.amount,
      last_payment_date = NEW.recovery_date,
      updated_at = now()
  WHERE id = NEW.credit_customer_id;

  -- Ensure balance doesn't go negative
  IF (SELECT current_balance FROM credit_customers WHERE id = NEW.credit_customer_id) < 0 THEN
    RAISE EXCEPTION 'Recovery amount exceeds outstanding balance';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_customer_balance_on_recovery
AFTER INSERT ON recoveries
FOR EACH ROW
EXECUTE FUNCTION update_customer_balance_on_recovery();

-- ============================================================================
-- 3. LUBRICANT STOCK TRIGGERS
-- ============================================================================

-- Trigger: Update lubricant stock on sale
CREATE OR REPLACE FUNCTION update_lub_stock_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE lubricants
  SET current_stock = current_stock - NEW.quantity,
      updated_at = now()
  WHERE id = NEW.lubricant_id;

  IF (SELECT current_stock FROM lubricants WHERE id = NEW.lubricant_id) < 0 THEN
    RAISE EXCEPTION 'Insufficient lubricant stock';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_lub_stock_on_sale
AFTER INSERT ON lub_sales
FOR EACH ROW
EXECUTE FUNCTION update_lub_stock_on_sale();

-- Trigger: Update lubricant stock on purchase
CREATE OR REPLACE FUNCTION update_lub_stock_on_purchase()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE lubricants
  SET current_stock = current_stock + NEW.quantity,
      updated_at = now()
  WHERE id = NEW.lubricant_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_lub_stock_on_purchase
AFTER INSERT ON lub_purchases
FOR EACH ROW
EXECUTE FUNCTION update_lub_stock_on_purchase();

-- Trigger: Update lubricant stock on loss/wastage
CREATE OR REPLACE FUNCTION update_lub_stock_on_loss()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE lubricants
  SET current_stock = current_stock - NEW.quantity,
      updated_at = now()
  WHERE id = NEW.lubricant_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_lub_stock_on_loss
AFTER INSERT ON lub_losses
FOR EACH ROW
EXECUTE FUNCTION update_lub_stock_on_loss();

-- ============================================================================
-- 4. VENDOR BALANCE TRACKING
-- ============================================================================

-- Add vendor balance column if not exists
ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS current_balance numeric(12,2) DEFAULT 0;

-- Trigger: Update vendor balance on purchase (increases payable)
CREATE OR REPLACE FUNCTION update_vendor_balance_on_purchase()
RETURNS TRIGGER AS $$
BEGIN
  -- Increase vendor payable on purchase
  UPDATE vendors
  SET current_balance = current_balance + NEW.total_amount,
      updated_at = now()
  WHERE id = NEW.vendor_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_vendor_balance_on_tanker_purchase
AFTER INSERT ON tanker_sales
FOR EACH ROW
EXECUTE FUNCTION update_vendor_balance_on_purchase();

CREATE TRIGGER trg_update_vendor_balance_on_lub_purchase
AFTER INSERT ON lub_purchases
FOR EACH ROW
EXECUTE FUNCTION update_vendor_balance_on_purchase();

-- Trigger: Update vendor balance on payment transaction
CREATE OR REPLACE FUNCTION update_vendor_balance_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.transaction_type = 'Debit' THEN
    -- Payment made to vendor (reduces payable)
    UPDATE vendors
    SET current_balance = current_balance - NEW.amount,
        updated_at = now()
    WHERE id = NEW.vendor_id;
  ELSIF NEW.transaction_type = 'Credit' THEN
    -- Additional charge/purchase (increases payable)
    UPDATE vendors
    SET current_balance = current_balance + NEW.amount,
        updated_at = now()
    WHERE id = NEW.vendor_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_vendor_balance_on_transaction
AFTER INSERT ON vendor_transactions
FOR EACH ROW
EXECUTE FUNCTION update_vendor_balance_on_transaction();

-- ============================================================================
-- 5. USEFUL VIEWS FOR REPORTING
-- ============================================================================

-- View: Real-time tank stock with product details
CREATE OR REPLACE VIEW v_tank_stock_summary AS
SELECT 
  t.id,
  t.tank_number,
  fp.product_name,
  t.current_stock,
  t.capacity,
  ROUND((t.current_stock / NULLIF(t.capacity, 0) * 100)::numeric, 2) as fill_percentage,
  CASE 
    WHEN t.current_stock < (t.capacity * 0.2) THEN 'Low'
    WHEN t.current_stock < (t.capacity * 0.5) THEN 'Medium'
    ELSE 'Good'
  END as stock_status
FROM tanks t
LEFT JOIN fuel_products fp ON t.fuel_product_id = fp.id
WHERE t.is_active = true;

-- View: Credit customer outstanding summary
CREATE OR REPLACE VIEW v_credit_customer_summary AS
SELECT 
  cc.id,
  cc.organization_name,
  cc.phone_number,
  cc.credit_limit,
  cc.current_balance as outstanding,
  cc.credit_limit - cc.current_balance as available_credit,
  ROUND((cc.current_balance / NULLIF(cc.credit_limit, 0) * 100)::numeric, 2) as utilization_percent,
  cc.last_payment_date,
  CASE 
    WHEN cc.current_balance >= cc.credit_limit * 0.9 THEN 'Critical'
    WHEN cc.current_balance >= cc.credit_limit * 0.75 THEN 'High'
    WHEN cc.current_balance >= cc.credit_limit * 0.5 THEN 'Medium'
    ELSE 'Low'
  END as risk_level
FROM credit_customers cc
WHERE cc.is_active = true
ORDER BY cc.current_balance DESC;

-- View: Daily sales summary
CREATE OR REPLACE VIEW v_daily_sales_summary AS
SELECT 
  sale_date,
  'Guest' as sale_type,
  COUNT(*) as transaction_count,
  SUM(quantity) as total_quantity,
  SUM(total_amount) as total_amount
FROM guest_sales
GROUP BY sale_date
UNION ALL
SELECT 
  sale_date,
  'Credit' as sale_type,
  COUNT(*) as transaction_count,
  SUM(quantity) as total_quantity,
  SUM(total_amount) as total_amount
FROM credit_sales
GROUP BY sale_date
ORDER BY sale_date DESC;

-- View: Vendor outstanding summary
CREATE OR REPLACE VIEW v_vendor_outstanding AS
SELECT 
  v.id,
  v.vendor_name,
  v.current_balance as outstanding,
  COUNT(vt.id) as transaction_count,
  MAX(vt.created_at) as last_transaction_date
FROM vendors v
LEFT JOIN vendor_transactions vt ON v.id = vt.vendor_id
WHERE v.is_active = true
GROUP BY v.id, v.vendor_name, v.current_balance
ORDER BY v.current_balance DESC;

-- ============================================================================
-- 6. HELPER FUNCTIONS
-- ============================================================================

-- Function: Get available credit for a customer
CREATE OR REPLACE FUNCTION get_available_credit(customer_id uuid)
RETURNS numeric AS $$
DECLARE
  v_limit numeric;
  v_balance numeric;
BEGIN
  SELECT credit_limit, current_balance 
  INTO v_limit, v_balance
  FROM credit_customers
  WHERE id = customer_id;
  
  RETURN v_limit - v_balance;
END;
$$ LANGUAGE plpgsql;

-- Function: Get total sales for a date range
CREATE OR REPLACE FUNCTION get_total_sales(start_date date, end_date date)
RETURNS numeric AS $$
DECLARE
  v_total numeric;
BEGIN
  SELECT COALESCE(SUM(total), 0) INTO v_total
  FROM (
    SELECT SUM(total_amount) as total FROM guest_sales 
    WHERE sale_date BETWEEN start_date AND end_date
    UNION ALL
    SELECT SUM(total_amount) as total FROM credit_sales 
    WHERE sale_date BETWEEN start_date AND end_date
  ) sales;
  
  RETURN v_total;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate stock variation
CREATE OR REPLACE FUNCTION calculate_stock_variation(
  p_tank_id uuid,
  p_date date
)
RETURNS TABLE(
  opening_stock numeric,
  receipts numeric,
  total_stock numeric,
  meter_sales numeric,
  expected_closing numeric,
  actual_closing numeric,
  variation numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(dos.opening_stock, 0) as opening_stock,
    COALESCE(
      (SELECT SUM(tanker_sale_quantity) 
       FROM tanker_sales 
       WHERE tank_id = p_tank_id AND sale_date = p_date), 
      0
    ) as receipts,
    COALESCE(dos.opening_stock, 0) + COALESCE(
      (SELECT SUM(tanker_sale_quantity) 
       FROM tanker_sales 
       WHERE tank_id = p_tank_id AND sale_date = p_date), 
      0
    ) as total_stock,
    COALESCE(
      (SELECT SUM(quantity) FROM guest_sales gs
       JOIN nozzles n ON gs.nozzle_id = n.id
       WHERE n.tank_id = p_tank_id AND gs.sale_date = p_date),
      0
    ) + COALESCE(
      (SELECT SUM(quantity) FROM credit_sales cs
       JOIN tanks t ON cs.fuel_product_id = t.fuel_product_id
       WHERE t.id = p_tank_id AND cs.sale_date = p_date),
      0
    ) as meter_sales,
    COALESCE(dos.opening_stock, 0) + COALESCE(
      (SELECT SUM(tanker_sale_quantity) 
       FROM tanker_sales 
       WHERE tank_id = p_tank_id AND sale_date = p_date), 
      0
    ) - (
      COALESCE(
        (SELECT SUM(quantity) FROM guest_sales gs
         JOIN nozzles n ON gs.nozzle_id = n.id
         WHERE n.tank_id = p_tank_id AND gs.sale_date = p_date),
        0
      ) + COALESCE(
        (SELECT SUM(quantity) FROM credit_sales cs
         JOIN tanks t ON cs.fuel_product_id = t.fuel_product_id
         WHERE t.id = p_tank_id AND cs.sale_date = p_date),
        0
      )
    ) as expected_closing,
    (SELECT current_stock FROM tanks WHERE id = p_tank_id) as actual_closing,
    (SELECT current_stock FROM tanks WHERE id = p_tank_id) - (
      COALESCE(dos.opening_stock, 0) + COALESCE(
        (SELECT SUM(tanker_sale_quantity) 
         FROM tanker_sales 
         WHERE tank_id = p_tank_id AND sale_date = p_date), 
        0
      ) - (
        COALESCE(
          (SELECT SUM(quantity) FROM guest_sales gs
           JOIN nozzles n ON gs.nozzle_id = n.id
           WHERE n.tank_id = p_tank_id AND gs.sale_date = p_date),
          0
        ) + COALESCE(
          (SELECT SUM(quantity) FROM credit_sales cs
           JOIN tanks t ON cs.fuel_product_id = t.fuel_product_id
           WHERE t.id = p_tank_id AND cs.sale_date = p_date),
          0
        )
      )
    ) as variation
  FROM day_opening_stocks dos
  WHERE dos.tank_id = p_tank_id AND dos.stock_date = p_date
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_guest_sales_date ON guest_sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_credit_sales_date ON credit_sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_credit_sales_customer ON credit_sales(credit_customer_id);
CREATE INDEX IF NOT EXISTS idx_recoveries_customer ON recoveries(credit_customer_id);
CREATE INDEX IF NOT EXISTS idx_recoveries_date ON recoveries(recovery_date);
CREATE INDEX IF NOT EXISTS idx_tanker_sales_tank ON tanker_sales(tank_id);
CREATE INDEX IF NOT EXISTS idx_tanker_sales_vendor ON tanker_sales(vendor_id);
CREATE INDEX IF NOT EXISTS idx_lub_sales_date ON lub_sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
