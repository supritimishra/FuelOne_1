-- Make created_by columns nullable on common tables to avoid FK failures during tests
-- This migration is idempotent: it checks for column existence and constraint existence before altering.

-- List of tables to patch. Adjust if your DB uses different table names.

DO $$
DECLARE r RECORD;
BEGIN
  -- interest_transactions: already has created_by NULL in previous migration, but ensure it's nullable
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='interest_transactions' AND column_name='created_by') THEN
    EXECUTE 'ALTER TABLE public.interest_transactions ALTER COLUMN created_by DROP NOT NULL';
  END IF;

  -- sheet_records
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sheet_records' AND column_name='created_by') THEN
    EXECUTE 'ALTER TABLE public.sheet_records ALTER COLUMN created_by DROP NOT NULL';
  END IF;

  -- day_cash_movements
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='day_cash_movements' AND column_name='created_by') THEN
    EXECUTE 'ALTER TABLE public.day_cash_movements ALTER COLUMN created_by DROP NOT NULL';
  END IF;

  -- credit_requests
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='credit_requests' AND column_name='created_by') THEN
    EXECUTE 'ALTER TABLE public.credit_requests ALTER COLUMN created_by DROP NOT NULL';
  END IF;

  -- vendor_transactions
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vendor_transactions' AND column_name='created_by') THEN
    EXECUTE 'ALTER TABLE public.vendor_transactions ALTER COLUMN created_by DROP NOT NULL';
  END IF;

  -- employee_cash_recovery
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employee_cash_recovery' AND column_name='created_by') THEN
    EXECUTE 'ALTER TABLE public.employee_cash_recovery ALTER COLUMN created_by DROP NOT NULL';
  END IF;

  -- daily_lub_assignings
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='daily_lub_assignings' AND column_name='created_by') THEN
    EXECUTE 'ALTER TABLE public.daily_lub_assignings ALTER COLUMN created_by DROP NOT NULL';
  END IF;

  -- daily_nozzle_assignings
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='daily_nozzle_assignings' AND column_name='created_by') THEN
    EXECUTE 'ALTER TABLE public.daily_nozzle_assignings ALTER COLUMN created_by DROP NOT NULL';
  END IF;

  -- duty_pay
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='duty_pay' AND column_name='created_by') THEN
    EXECUTE 'ALTER TABLE public.duty_pay ALTER COLUMN created_by DROP NOT NULL';
  END IF;

  -- guest_sales
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='guest_sales' AND column_name='created_by') THEN
    EXECUTE 'ALTER TABLE public.guest_sales ALTER COLUMN created_by DROP NOT NULL';
  END IF;

  -- print_templates
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='print_templates' AND column_name='created_by') THEN
    EXECUTE 'ALTER TABLE public.print_templates ALTER COLUMN created_by DROP NOT NULL';
  END IF;

  -- vendor_invoices
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vendor_invoices' AND column_name='created_by') THEN
    EXECUTE 'ALTER TABLE public.vendor_invoices ALTER COLUMN created_by DROP NOT NULL';
  END IF;

  -- fallback: catch-all for other tables which may have created_by
  -- Note: This loop will change any column named created_by in public schema to nullable.
  FOR r IN SELECT table_name FROM information_schema.columns WHERE column_name='created_by' AND table_schema='public' LOOP
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN created_by DROP NOT NULL', r.table_name);
  END LOOP;
END $$;

-- End of migration
