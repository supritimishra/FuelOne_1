import { Pool } from 'pg';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.local.env') });

const masterDbUrl = process.env.DATABASE_URL;

if (!masterDbUrl) {
  console.error('❌ DATABASE_URL not found in environment');
  process.exit(1);
}

// The INSERT statement from the migration (only the data part)
const INSERT_FEATURES_SQL = `
INSERT INTO "feature_permissions" ("feature_key", "label", "feature_group", "description", "default_enabled")
SELECT * FROM (VALUES
  ('dashboard', 'Dashboard', 'core', 'Main dashboard overview', true),
  ('fuel_products', 'Fuel Products', 'master', 'Manage fuel products', true),
  ('lubricants', 'Lubricants', 'master', 'Manage lubricants', true),
  ('credit_customers', 'Credit Customer', 'master', 'Manage credit customers', true),
  ('employees', 'Employees', 'master', 'Manage employees', true),
  ('expense_types', 'Expense Types', 'master', 'Manage expense types', true),
  ('business_parties', 'Busi. Crd/Debit Party', 'master', 'Manage business parties', true),
  ('vendors', 'Vendor', 'master', 'Manage vendors', true),
  ('swipe_machines', 'Swipe Machines', 'master', 'Manage swipe machines', true),
  ('expiry_items', 'Expiry Items', 'master', 'Manage expiry items', true),
  ('tank_nozzle', 'Tank & Nozzel', 'master', 'Manage tanks and nozzles', true),
  ('pump_settings', 'Pump Setting', 'master', 'Configure pump settings', true),
  ('duty_pay_shift', 'DutyPay Shift', 'master', 'Manage duty pay shifts', true),
  ('print_templates', 'Print Templates', 'master', 'Manage print templates', true),
  ('guest_entry', 'Guest Entry', 'master', 'Manage guest entries', true),
  ('denominations', 'Denominations', 'master', 'Manage denominations', true),
  ('liquid_purchase', 'Liquid Purchase', 'invoice', 'Process liquid purchases', true),
  ('lubs_purchase', 'Lubs Purchase', 'invoice', 'Process lubricant purchases', true),
  ('day_assignings', 'Day Assignings', 'day_business', 'Manage day assignments', true),
  ('daily_sale_rate', 'Daily Sale Rate', 'day_business', 'View daily sale rates', true),
  ('sale_entry', 'Sale Entry', 'day_business', 'Enter sales', true),
  ('lub_sale', 'Lub Sale', 'day_business', 'Process lubricant sales', true),
  ('swipe', 'Swipe', 'day_business', 'Process swipe transactions', true),
  ('credit_sale', 'Credit Sale', 'day_business', 'Process credit sales', true),
  ('expenses', 'Expenses', 'day_business', 'Manage expenses', true),
  ('recovery', 'Recovery', 'day_business', 'Process recoveries', true),
  ('employee_cash_recovery', 'Employee Cash Recovery', 'day_business', 'Manage employee cash recovery', true),
  ('day_opening_stock', 'Day Opening Stock', 'day_business', 'Manage day opening stock', true),
  ('day_settlement', 'Day Settlement', 'day_business', 'Process day settlements', true),
  ('statement_generation', 'Statement Generation', 'reports', 'Generate statements', true),
  ('stock_report', 'Stock Report', 'product_stock', 'View stock reports', true),
  ('lub_loss', 'Lub Loss', 'product_stock', 'Manage lubricant loss', true),
  ('lubs_stock', 'Lubs Stock', 'product_stock', 'View lubricant stock', true),
  ('minimum_stock', 'Minimum Stock', 'product_stock', 'Manage minimum stock levels', true),
  ('shift_sheet_entry', 'Shift Sheet Entry', 'operations', 'Enter shift sheet data', true),
  ('business_crdr_transactions', 'Busi. Cr/Dr Trxns', 'transactions', 'Manage business credit/debit transactions', true),
  ('vendor_transactions', 'Vendor Transaction', 'transactions', 'Manage vendor transactions', true),
  ('reports', 'Reports', 'reports', 'Access reports', true),
  ('generate_sale_invoice', 'Generate SaleInvoice', 'invoice', 'Generate sale invoices', true),
  ('generated_invoices', 'Generated Invoices', 'invoice', 'View generated invoices', true),
  ('credit_limit_reports', 'Credit Limit Reports', 'reports', 'View credit limit reports', true),
  ('interest_transactions', 'Interest Trans', 'relational', 'Manage interest transactions', true),
  ('sheet_records', 'Sheet Records', 'relational', 'Maintain sheet records', true),
  ('day_cash_report', 'Day cash report', 'reports', 'View daily cash report', true),
  ('tanker_sale', 'Tanker sale', 'relational', 'Manage tanker sales', true),
  ('guest_sales', 'Guest Sales', 'relational', 'View guest sales', true),
  ('attendance', 'Attendance', 'relational', 'Track attendance', true),
  ('duty_pay', 'Duty Pay', 'relational', 'Manage duty pay', true),
  ('sales_officer', 'Sales Officer', 'relational', 'Manage sales officer records', true),
  ('credit_requests', 'Credit Requests', 'credit', 'Handle credit requests', true),
  ('expiry_items', 'Expiry Items', 'relational', 'Manage expiry items', true),
  ('feedback', 'Feedback', 'support', 'Manage user feedback', true),
  ('developer_mode', 'Developer Mode', 'admin', 'Configure developer mode access controls', true)
) AS v(feature_key, label, feature_group, description, default_enabled)
WHERE NOT EXISTS (
  SELECT 1 FROM "feature_permissions" WHERE "feature_key" = v.feature_key
);
`;

async function insertFeatureData() {
  const masterPool = new Pool({
    connectionString: masterDbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('🔍 Finding all active tenants...');
    const tenantsResult = await masterPool.query(
      `SELECT id, organization_name, tenant_db_name, connection_string FROM tenants WHERE status = 'active'`
    );

    if (tenantsResult.rows.length === 0) {
      console.warn('⚠️ No active tenants found.');
      return;
    }

    console.log(`✅ Found ${tenantsResult.rows.length} active tenants.\n`);

    for (const tenant of tenantsResult.rows) {
      console.log(`\n--- Processing tenant: ${tenant.organization_name} (ID: ${tenant.id}, DB: ${tenant.tenant_db_name}) ---`);
      const tenantPool = new Pool({
        connectionString: tenant.connection_string,
        ssl: { rejectUnauthorized: false },
      });

      try {
        // First check if table exists
        const tableCheck = await tenantPool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'feature_permissions'
          );
        `);

        if (!tableCheck.rows[0].exists) {
          console.error(`❌ feature_permissions table does not exist for tenant ${tenant.organization_name}. Please run the full migration first.`);
          await tenantPool.end();
          continue;
        }

        // Check current count
        const countBefore = await tenantPool.query('SELECT COUNT(*) as count FROM feature_permissions');
        const beforeCount = parseInt(countBefore.rows[0].count);

        console.log(`📊 Current feature count: ${beforeCount}`);

        if (beforeCount > 0) {
          console.log(`⚠️  Features already exist. Skipping insertion.`);
          await tenantPool.end();
          continue;
        }

        // Insert the feature data
        console.log('📝 Inserting feature data...');
        await tenantPool.query(INSERT_FEATURES_SQL);

        // Verify the count after insertion
        const countAfter = await tenantPool.query('SELECT COUNT(*) as count FROM feature_permissions');
        const afterCount = parseInt(countAfter.rows[0].count);

        console.log(`✅ Successfully inserted ${afterCount - beforeCount} features (total: ${afterCount})`);
        
        await tenantPool.end();
      } catch (err: any) {
        console.error(`❌ Error processing tenant ${tenant.organization_name}: ${err.message}`);
        if (err.position) {
          console.error(`   Error at position: ${err.position}`);
        }
        await tenantPool.end();
      }
    }

    console.log('\n🎉 Feature data insertion complete for all tenants!');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await masterPool.end();
  }
}

insertFeatureData();

