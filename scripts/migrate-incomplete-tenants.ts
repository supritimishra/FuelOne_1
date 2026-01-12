#!/usr/bin/env tsx

import { Pool } from 'pg';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config({ path: path.resolve(process.cwd(), '.local.env') });

const masterPool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

// Complete schema migration SQL
const SCHEMA_MIGRATION_SQL = `
-- Create all missing tables for incomplete tenants

-- Transaction tables
CREATE TABLE IF NOT EXISTS guest_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name VARCHAR(255),
  vehicle_number VARCHAR(50),
  product_id UUID,
  quantity DECIMAL(10,2),
  rate DECIMAL(10,2),
  amount DECIMAL(10,2),
  payment_method VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS credit_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID,
  product_id UUID,
  quantity DECIMAL(10,2),
  rate DECIMAL(10,2),
  amount DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lubricant_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name VARCHAR(255),
  product_id UUID,
  quantity DECIMAL(10,2),
  rate DECIMAL(10,2),
  amount DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS swipe_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_number VARCHAR(50),
  amount DECIMAL(10,2),
  transaction_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_type_id UUID,
  amount DECIMAL(10,2),
  description TEXT,
  date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recoveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID,
  amount DECIMAL(10,2),
  recovery_date DATE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS business_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID,
  transaction_type VARCHAR(50),
  amount DECIMAL(10,2),
  description TEXT,
  date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vendor_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID,
  transaction_type VARCHAR(50),
  amount DECIMAL(10,2),
  description TEXT,
  date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS interest_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID,
  principal_amount DECIMAL(10,2),
  interest_rate DECIMAL(5,2),
  interest_amount DECIMAL(10,2),
  transaction_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Master data tables
CREATE TABLE IF NOT EXISTS fuel_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name VARCHAR(255) NOT NULL,
  short_name VARCHAR(50),
  lfrn VARCHAR(50),
  gst_percent DECIMAL(5,2) DEFAULT 0,
  tds_percent DECIMAL(5,2) DEFAULT 0,
  weight_loss_percent DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lubricants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name VARCHAR(255) NOT NULL,
  short_name VARCHAR(50),
  category VARCHAR(100),
  price DECIMAL(10,2),
  stock_quantity DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS credit_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  credit_limit DECIMAL(10,2) DEFAULT 0,
  current_balance DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_name VARCHAR(255) NOT NULL,
  employee_id VARCHAR(50) UNIQUE,
  phone VARCHAR(20),
  email VARCHAR(255),
  position VARCHAR(100),
  salary DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expense_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS business_parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_name VARCHAR(255) NOT NULL,
  party_type VARCHAR(50),
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS swipe_machines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_name VARCHAR(255) NOT NULL,
  machine_id VARCHAR(50) UNIQUE,
  location VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expiry_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  expiry_date DATE,
  quantity DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tanks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tank_name VARCHAR(255) NOT NULL,
  capacity DECIMAL(10,2),
  current_level DECIMAL(10,2) DEFAULT 0,
  product_id UUID,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS nozzles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nozzle_name VARCHAR(255) NOT NULL,
  nozzle_number VARCHAR(50),
  tank_id UUID,
  product_id UUID,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS duty_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_name VARCHAR(255) NOT NULL,
  start_time TIME,
  end_time TIME,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS print_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name VARCHAR(255) NOT NULL,
  template_content TEXT,
  template_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS guest_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_name VARCHAR(255) NOT NULL,
  vehicle_number VARCHAR(50),
  purpose VARCHAR(255),
  entry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  exit_time TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS denominations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  denomination_value DECIMAL(10,2) NOT NULL,
  denomination_type VARCHAR(50),
  count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS organization_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  gst_number VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Additional tables for complete schema
CREATE TABLE IF NOT EXISTS vendor_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID,
  invoice_number VARCHAR(100),
  invoice_date DATE,
  amount DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sale_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name VARCHAR(255),
  product_id UUID,
  quantity DECIMAL(10,2),
  rate DECIMAL(10,2),
  amount DECIMAL(10,2),
  sale_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lub_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name VARCHAR(255),
  product_id UUID,
  quantity DECIMAL(10,2),
  rate DECIMAL(10,2),
  amount DECIMAL(10,2),
  sale_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS liquid_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID,
  product_id UUID,
  quantity DECIMAL(10,2),
  rate DECIMAL(10,2),
  amount DECIMAL(10,2),
  purchase_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lub_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID,
  product_id UUID,
  quantity DECIMAL(10,2),
  rate DECIMAL(10,2),
  amount DECIMAL(10,2),
  purchase_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tanker_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name VARCHAR(255),
  product_id UUID,
  quantity DECIMAL(10,2),
  rate DECIMAL(10,2),
  amount DECIMAL(10,2),
  sale_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employee_cash_recovery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID,
  amount DECIMAL(10,2),
  recovery_date DATE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS day_cash_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movement_type VARCHAR(50),
  amount DECIMAL(10,2),
  description TEXT,
  movement_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS day_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_date DATE,
  total_sales DECIMAL(10,2),
  total_expenses DECIMAL(10,2),
  net_amount DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS opening_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID,
  quantity DECIMAL(10,2),
  date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS day_assignings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID,
  shift_id UUID,
  assign_date DATE,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS nozzle_assignings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nozzle_id UUID,
  employee_id UUID,
  assign_date DATE,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sheet_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_name VARCHAR(255),
  record_data JSONB,
  record_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID,
  attendance_date DATE,
  check_in_time TIME,
  check_out_time TIME,
  status VARCHAR(20) DEFAULT 'present',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS duty_pay (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID,
  shift_id UUID,
  pay_amount DECIMAL(10,2),
  pay_date DATE,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS daily_sale_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID,
  rate DECIMAL(10,2),
  rate_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sales_officer_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  officer_name VARCHAR(255),
  inspection_date DATE,
  inspection_details TEXT,
  status VARCHAR(20) DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS credit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID,
  request_amount DECIMAL(10,2),
  request_date DATE,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name VARCHAR(255),
  feedback_text TEXT,
  rating INTEGER,
  feedback_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System tables
CREATE TABLE IF NOT EXISTS app_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key VARCHAR(255) UNIQUE NOT NULL,
  config_value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(255) UNIQUE NOT NULL,
  setting_value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  activity_type VARCHAR(100),
  activity_description TEXT,
  activity_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  log_type VARCHAR(100),
  log_message TEXT,
  log_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_guest_sales_customer_name ON guest_sales(customer_name);
CREATE INDEX IF NOT EXISTS idx_credit_sales_customer_id ON credit_sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_lubricant_sales_product_id ON lubricant_sales(product_id);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_type_id ON expenses(expense_type_id);
CREATE INDEX IF NOT EXISTS idx_fuel_products_product_name ON fuel_products(product_name);
CREATE INDEX IF NOT EXISTS idx_lubricants_product_name ON lubricants(product_name);
CREATE INDEX IF NOT EXISTS idx_credit_customers_customer_name ON credit_customers(customer_name);
CREATE INDEX IF NOT EXISTS idx_employees_employee_name ON employees(employee_name);
CREATE INDEX IF NOT EXISTS idx_vendors_vendor_name ON vendors(vendor_name);
CREATE INDEX IF NOT EXISTS idx_tanks_tank_name ON tanks(tank_name);
CREATE INDEX IF NOT EXISTS idx_nozzles_nozzle_name ON nozzles(nozzle_name);
`;

async function migrateIncompleteTenants() {
  console.log('🔧 Starting migration for incomplete tenants...\n');

  try {
    // Get all active tenants
    const tenants = await masterPool.query(`
      SELECT id, organization_name, connection_string
      FROM tenants
      WHERE status = 'active'
      ORDER BY created_at DESC
    `);

    console.log(`📦 Found ${tenants.rows.length} active tenants:\n`);

    for (const tenant of tenants.rows) {
      console.log(`${'='.repeat(60)}`);
      console.log(`🏢 Checking tenant: ${tenant.organization_name}`);
      console.log(`🆔 ID: ${tenant.id}`);
      console.log(`${'='.repeat(60)}`);

      try {
        // Connect to tenant database
        const tenantPool = new Pool({
          connectionString: tenant.connection_string,
          ssl: { rejectUnauthorized: false },
        });

        // Check how many tables exist
        const tableCount = await tenantPool.query(`
          SELECT COUNT(*) as count
          FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE'
        `);

        const currentTableCount = parseInt(tableCount.rows[0].count);
        console.log(`📊 Current table count: ${currentTableCount}`);

        if (currentTableCount < 50) {
          console.log(`⚠️  Tenant has incomplete schema (${currentTableCount} tables). Migrating...`);
          
          // Execute schema migration
          await tenantPool.query(SCHEMA_MIGRATION_SQL);
          
          // Verify migration
          const newTableCount = await tenantPool.query(`
            SELECT COUNT(*) as count
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE'
          `);
          
          const finalTableCount = parseInt(newTableCount.rows[0].count);
          console.log(`✅ Migration completed! New table count: ${finalTableCount}`);
          
          if (finalTableCount >= 50) {
            console.log(`🎉 Schema migration successful for ${tenant.organization_name}`);
          } else {
            console.log(`⚠️  Schema migration incomplete for ${tenant.organization_name}`);
          }
        } else {
          console.log(`✅ Tenant already has complete schema (${currentTableCount} tables)`);
        }

        await tenantPool.end();
      } catch (error) {
        console.error(`🚨 Error migrating tenant ${tenant.organization_name}:`, error.message);
      }
    }

    console.log('\n✅ Migration process completed!');
  } catch (error) {
    console.error('🚨 Error during migration:', error);
  } finally {
    await masterPool.end();
  }
}

// Run the migration
migrateIncompleteTenants().catch(console.error);
