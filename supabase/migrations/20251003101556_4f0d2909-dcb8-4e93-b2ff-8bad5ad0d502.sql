-- Fix Critical RLS Policies - Restrict Public Data Exposure
-- This migration tightens security by replacing USING (true) policies with role-based access control

-- 1. CRITICAL: Organization Details (API keys, bank info) - Super Admin Only
DROP POLICY IF EXISTS "Everyone can view organization details" ON organization_details;
CREATE POLICY "Only super admins can view organization details"
  ON organization_details FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'));

-- 2. CRITICAL: Employees (salary info) - Admin and Manager Only
DROP POLICY IF EXISTS "Everyone can view employees" ON employees;
CREATE POLICY "Only admins and managers can view employees"
  ON employees FOR SELECT
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'manager'));

-- 3. Credit Customers (PII) - Admin, Manager, and DSM
DROP POLICY IF EXISTS "Everyone can view credit customers" ON credit_customers;
CREATE POLICY "Only authorized staff can view credit customers"
  ON credit_customers FOR SELECT
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'dsm'));

-- 4. Vendors (business relationships) - Admin, Manager, and DSM
DROP POLICY IF EXISTS "Everyone can view vendors" ON vendors;
CREATE POLICY "Only authorized staff can view vendors"
  ON vendors FOR SELECT
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'dsm'));

-- 5. Guest Sales (customer mobile numbers) - Admin, Manager, and DSM
DROP POLICY IF EXISTS "Everyone can view guest sales" ON guest_sales;
CREATE POLICY "Only authorized staff can view guest sales"
  ON guest_sales FOR SELECT
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'dsm'));

-- 6. Operational Tables - Admin, Manager, and DSM
DROP POLICY IF EXISTS "Everyone can view sale entries" ON sale_entries;
CREATE POLICY "Only authorized staff can view sale entries"
  ON sale_entries FOR SELECT
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'dsm'));

DROP POLICY IF EXISTS "Everyone can view credit sales" ON credit_sales;
CREATE POLICY "Only authorized staff can view credit sales"
  ON credit_sales FOR SELECT
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'dsm'));

DROP POLICY IF EXISTS "Everyone can view lubricant sales" ON lubricant_sales;
CREATE POLICY "Only authorized staff can view lubricant sales"
  ON lubricant_sales FOR SELECT
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'dsm'));

DROP POLICY IF EXISTS "Everyone can view swipe transactions" ON swipe_transactions;
CREATE POLICY "Only authorized staff can view swipe transactions"
  ON swipe_transactions FOR SELECT
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'dsm'));

DROP POLICY IF EXISTS "Everyone can view tanker sales" ON tanker_sales;
CREATE POLICY "Only authorized staff can view tanker sales"
  ON tanker_sales FOR SELECT
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'dsm'));

DROP POLICY IF EXISTS "Everyone can view expenses" ON expenses;
CREATE POLICY "Only authorized staff can view expenses"
  ON expenses FOR SELECT
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'dsm'));

DROP POLICY IF EXISTS "Everyone can view recoveries" ON recoveries;
CREATE POLICY "Only authorized staff can view recoveries"
  ON recoveries FOR SELECT
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'dsm'));

DROP POLICY IF EXISTS "Everyone can view employee cash recovery" ON employee_cash_recovery;
CREATE POLICY "Only authorized staff can view employee cash recovery"
  ON employee_cash_recovery FOR SELECT
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'dsm'));

DROP POLICY IF EXISTS "Everyone can view day settlements" ON day_settlements;
CREATE POLICY "Only authorized staff can view day settlements"
  ON day_settlements FOR SELECT
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'dsm'));

DROP POLICY IF EXISTS "Everyone can view daily sale rates" ON daily_sale_rates;
CREATE POLICY "Only authorized staff can view daily sale rates"
  ON daily_sale_rates FOR SELECT
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'dsm'));

DROP POLICY IF EXISTS "Everyone can view vendor invoices" ON vendor_invoices;
CREATE POLICY "Only authorized staff can view vendor invoices"
  ON vendor_invoices FOR SELECT
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'dsm'));

DROP POLICY IF EXISTS "Everyone can view vendor transactions" ON vendor_transactions;
CREATE POLICY "Only authorized staff can view vendor transactions"
  ON vendor_transactions FOR SELECT
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'dsm'));

DROP POLICY IF EXISTS "Everyone can view business transactions" ON business_transactions;
CREATE POLICY "Only authorized staff can view business transactions"
  ON business_transactions FOR SELECT
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'dsm'));

DROP POLICY IF EXISTS "Everyone can view credit requests" ON credit_requests;
CREATE POLICY "Only authorized staff can view credit requests"
  ON credit_requests FOR SELECT
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'dsm'));

DROP POLICY IF EXISTS "Everyone can view sales officer inspections" ON sales_officer_inspections;
CREATE POLICY "Only authorized staff can view sales officer inspections"
  ON sales_officer_inspections FOR SELECT
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'dsm'));

DROP POLICY IF EXISTS "Everyone can view interest transactions" ON interest_transactions;
CREATE POLICY "Only authorized staff can view interest transactions"
  ON interest_transactions FOR SELECT
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'dsm'));

-- 7. HR/Admin Tables - Admin and Manager Only
DROP POLICY IF EXISTS "Everyone can view attendance" ON attendance;
CREATE POLICY "Only admins and managers can view attendance"
  ON attendance FOR SELECT
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'manager'));

DROP POLICY IF EXISTS "Everyone can view duty shifts" ON duty_shifts;
CREATE POLICY "Only admins and managers can view duty shifts"
  ON duty_shifts FOR SELECT
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'manager'));

DROP POLICY IF EXISTS "Everyone can view expense types" ON expense_types;
CREATE POLICY "Only admins and managers can view expense types"
  ON expense_types FOR SELECT
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'manager'));

-- 8. Configuration Tables - Admin, Manager, and DSM
DROP POLICY IF EXISTS "Everyone can view fuel products" ON fuel_products;
CREATE POLICY "Only authorized staff can view fuel products"
  ON fuel_products FOR SELECT
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'dsm'));

DROP POLICY IF EXISTS "Everyone can view lubricants" ON lubricants;
CREATE POLICY "Only authorized staff can view lubricants"
  ON lubricants FOR SELECT
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'dsm'));

DROP POLICY IF EXISTS "Everyone can view tanks" ON tanks;
CREATE POLICY "Only authorized staff can view tanks"
  ON tanks FOR SELECT
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'dsm'));

DROP POLICY IF EXISTS "Everyone can view nozzles" ON nozzles;
CREATE POLICY "Only authorized staff can view nozzles"
  ON nozzles FOR SELECT
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'dsm'));

DROP POLICY IF EXISTS "Everyone can view expiry items" ON expiry_items;
CREATE POLICY "Only authorized staff can view expiry items"
  ON expiry_items FOR SELECT
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'dsm'));

-- 9. CRITICAL: Auto-assign default role to new users
-- This trigger ensures all new users get a 'dsm' role by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Assign 'dsm' role to new user
  -- First user can be manually promoted to super_admin via database
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'dsm');
  
  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add comment for documentation
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically assigns dsm role to new users. First user should be manually promoted to super_admin via database.';
