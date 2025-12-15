-- Ensure credit_sales.total_amount is populated and make balance trigger robust

-- 1) Trigger function to populate total_amount when omitted
CREATE OR REPLACE FUNCTION ensure_total_amount_credit_sales()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.total_amount IS NULL THEN
    NEW.total_amount := COALESCE(NEW.quantity * NEW.price_per_unit, 0);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if not exists (use DO block to guard existence)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_ensure_credit_total'
  ) THEN
    CREATE TRIGGER trg_ensure_credit_total
    BEFORE INSERT OR UPDATE ON credit_sales
    FOR EACH ROW
    EXECUTE FUNCTION ensure_total_amount_credit_sales();
  END IF;
END$$;

-- 2) Replace update_customer_balance_on_sale to use computed total as fallback
CREATE OR REPLACE FUNCTION update_customer_balance_on_sale()
RETURNS TRIGGER AS $$
DECLARE
  v_credit_limit numeric;
  v_current_balance numeric;
  v_total numeric;
BEGIN
  v_total := COALESCE(NEW.total_amount, NEW.quantity * NEW.price_per_unit, 0);

  SELECT credit_limit, current_balance INTO v_credit_limit, v_current_balance
  FROM credit_customers
  WHERE id = NEW.credit_customer_id;

  IF (v_current_balance + v_total) > v_credit_limit THEN
    RAISE EXCEPTION 'Credit limit exceeded. Limit: ₹%, Current: ₹%, Sale: ₹%', v_credit_limit, v_current_balance, v_total;
  END IF;

  UPDATE credit_customers
  SET current_balance = current_balance + v_total,
      updated_at = now()
  WHERE id = NEW.credit_customer_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
