-- Complete setup script for feature permissions
-- Safe to run multiple times - uses IF NOT EXISTS checks
-- Run this in Supabase SQL Editor on tenant database: petropal_tenant_0eb0ceca8df8

-- Create feature_permissions table
CREATE TABLE IF NOT EXISTS "feature_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"feature_key" text NOT NULL,
	"label" text NOT NULL,
	"feature_group" text,
	"description" text,
	"default_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now()
);

-- Create unique index on feature_key
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'feature_permissions_feature_key_idx') THEN
        CREATE UNIQUE INDEX "feature_permissions_feature_key_idx" ON "feature_permissions" USING btree ("feature_key");
    END IF;
END $$;

-- Create user_feature_access table
CREATE TABLE IF NOT EXISTS "user_feature_access" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"feature_id" uuid NOT NULL,
	"allowed" boolean NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Add foreign key constraints (if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_feature_access_user_id_users_id_fk') THEN
        ALTER TABLE "user_feature_access" ADD CONSTRAINT "user_feature_access_user_id_users_id_fk" 
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_feature_access_feature_id_feature_permissions_id_fk') THEN
        ALTER TABLE "user_feature_access" ADD CONSTRAINT "user_feature_access_feature_id_feature_permissions_id_fk" 
        FOREIGN KEY ("feature_id") REFERENCES "public"."feature_permissions"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;

-- Create unique index on user_id + feature_id combination
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'user_feature_access_user_feature_idx') THEN
        CREATE UNIQUE INDEX "user_feature_access_user_feature_idx" ON "user_feature_access" USING btree ("user_id","feature_id");
    END IF;
END $$;

-- Insert feature data (only if features don't already exist)
INSERT INTO "feature_permissions" ("feature_key", "label", "feature_group", "description", "default_enabled") 
SELECT * FROM (VALUES
  ('dashboard', 'Dashboard', 'core', 'Main dashboard overview', true),
  ('fuel_products', 'Fuel Products', 'master', 'Manage primary fuel products', true),
  ('lubricants', 'Lubricants', 'master', 'Manage lubricant catalogue', true),
  ('credit_customers', 'Credit Customer', 'master', 'Manage credit customer accounts', true),
  ('employees', 'Employees', 'master', 'Manage employee master data', true),
  ('expense_types', 'Expense Types', 'master', 'Configure expense type catalogue', true),
  ('business_parties', 'Busi. Crd/Debit Party', 'master', 'Manage business credit/debit parties', true),
  ('vendors', 'Vendor', 'master', 'Vendor master management', true),
  ('swipe_machines', 'Swipe Machines', 'master', 'Manage swipe machine catalogue', true),
  ('expiry_items', 'Expiry Items', 'master', 'Track products nearing expiry', true),
  ('tank_nozzle', 'Tank & Nozzel', 'master', 'Configure tanks and nozzles', true),
  ('pump_settings', 'Pump Setting', 'master', 'Pump configuration settings', true),
  ('duty_pay_shift', 'DutyPay Shift', 'master', 'Configure duty pay shift timings', true),
  ('print_templates', 'Print Templates', 'master', 'Manage print template layouts', true),
  ('guest_entry', 'Guest Entry', 'master', 'Manage guest entry records', true),
  ('denominations', 'Denominations', 'master', 'Maintain cash denominations', true),
  ('liquid_purchase', 'Liquid Purchase', 'invoice', 'Record liquid purchase invoices', true),
  ('lubs_purchase', 'Lubs Purchase', 'invoice', 'Record lubricant purchase invoices', true),
  ('day_assignings', 'Day Assignings', 'day_business', 'Assign day duties and roles', true),
  ('daily_sale_rate', 'Daily Sale Rate', 'day_business', 'Maintain daily sale rates', true),
  ('sale_entry', 'Sale Entry', 'day_business', 'Enter daily meter sales', true),
  ('lub_sale', 'Lub Sale', 'day_business', 'Capture lubricant sales', true),
  ('swipe', 'Swipe', 'day_business', 'Record swipe transactions', true),
  ('credit_sale', 'Credit Sale', 'day_business', 'Record credit sales', true),
  ('expenses', 'Expenses', 'day_business', 'Track daily expenses', true),
  ('recovery', 'Recovery', 'day_business', 'Manage credit recoveries', true),
  ('employee_cash_recovery', 'Emp Cash Recovery', 'day_business', 'Track employee cash recovery', true),
  ('day_opening_stock', 'DayOpening Stock', 'day_business', 'Manage day opening stock', true),
  ('day_settlement', 'Day Settlement', 'day_business', 'Manage day settlement process', true),
  ('statement_generation', 'Statement Generation', 'reports', 'Generate account statements', true),
  ('stock_report', 'Stock Report', 'product_stock', 'View product stock report', true),
  ('lub_loss', 'Lub Loss', 'product_stock', 'Capture lubricant loss', true),
  ('lubs_stock', 'Lubs Stock', 'product_stock', 'View lubricant stock levels', true),
  ('minimum_stock', 'Minimum Stock', 'product_stock', 'Monitor minimum stock levels', true),
  ('shift_sheet_entry', 'Shift Sheet Entry', 'day_business', 'Manage shift sheet entries', true),
  ('business_crdr_transactions', 'Busi. Cr/Dr Trxns', 'relational', 'Track business credit/debit transactions', true),
  ('vendor_transactions', 'Vendor Transaction', 'relational', 'Track vendor transactions', true),
  ('reports', 'Reports', 'reports', 'Access consolidated reports', true),
  ('generate_sale_invoice', 'Generate SaleInvoice', 'invoice', 'Generate sales invoices', true),
  ('generated_invoices', 'Generated Invoices', 'invoice', 'View generated invoices', true),
  ('credit_limit_reports', 'Credit Limit Reports', 'reports', 'View credit limit analysis', true),
  ('interest_transactions', 'Interest Trans', 'relational', 'Manage interest transactions', true),
  ('sheet_records', 'Sheet Records', 'relational', 'Maintain sheet records', true),
  ('day_cash_report', 'Day cash report', 'reports', 'View daily cash report', true),
  ('tanker_sale', 'Tanker sale', 'relational', 'Manage tanker sales', true),
  ('guest_sales', 'Guest Sales', 'relational', 'View guest sales', true),
  ('attendance', 'Attendance', 'relational', 'Track attendance', true),
  ('duty_pay', 'Duty Pay', 'relational', 'Manage duty pay', true),
  ('sales_officer', 'Sales Officer', 'relational', 'Manage sales officer records', true),
  ('credit_requests', 'Credit Requests', 'credit', 'Handle credit requests', true),
  ('feedback', 'Feedback', 'support', 'Manage user feedback', true),
  ('developer_mode', 'Developer Mode', 'admin', 'Configure developer mode access controls', true)
) AS v(feature_key, label, feature_group, description, default_enabled)
WHERE NOT EXISTS (
  SELECT 1 FROM "feature_permissions" WHERE "feature_key" = v.feature_key
);

-- Verify the setup
DO $$
DECLARE
  feature_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO feature_count FROM "feature_permissions";
  RAISE NOTICE '✅ Migration complete! Created % features in feature_permissions table.', feature_count;
END $$;

