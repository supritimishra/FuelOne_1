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

// Tables to clear in order (respecting foreign key constraints)
const TABLES_TO_CLEAR = [
  // Transaction tables (most dependent)
  'guest_sales',
  'credit_sales', 
  'lubricant_sales',
  'swipe_transactions',
  'expenses',
  'recoveries',
  'business_transactions',
  'vendor_transactions',
  'interest_transactions',
  'vendor_invoices',
  'sale_entries',
  'lub_sales',
  'liquid_purchases',
  'lub_purchases',
  'tanker_sales',
  'employee_cash_recovery',
  'day_cash_movements',
  'day_settlements',
  'opening_stock',
  
  // Assignment/Sheet tables
  'day_assignings',
  'nozzle_assignings', 
  'sheet_records',
  'attendance',
  'duty_pay',
  'daily_sale_rates',
  'sales_officer_inspections',
  'credit_requests',
  'feedback',
  
  // Master data tables (least dependent)
  'fuel_products',
  'lubricants',
  'credit_customers',
  'employees',
  'expense_types',
  'business_parties',
  'vendors',
  'swipe_machines',
  'expiry_items',
  'tanks',
  'nozzles',
  'duty_shifts',
  'print_templates',
  'denominations',
  'organization_details',
  'app_config',
  'system_settings',
  'activity_logs',
  'user_logs',
  'password_reset_tokens'
];

async function clearAllTenantData() {
  console.log('🧹 Starting tenant data cleanup...\n');

  try {
    // Get all active tenants
    const tenants = await masterPool.query(`
      SELECT id, organization_name, connection_string
      FROM tenants
      WHERE status = 'active'
      ORDER BY created_at DESC
    `);

    console.log(`📦 Found ${tenants.rows.length} active tenants to clean:\n`);

    for (const tenant of tenants.rows) {
      console.log(`${'='.repeat(60)}`);
      console.log(`🏢 Cleaning tenant: ${tenant.organization_name}`);
      console.log(`🆔 ID: ${tenant.id}`);
      console.log(`${'='.repeat(60)}`);

      try {
        // Connect to tenant database
        const tenantPool = new Pool({
          connectionString: tenant.connection_string,
          ssl: { rejectUnauthorized: false },
        });

        // Clear each table
        for (const tableName of TABLES_TO_CLEAR) {
          try {
            // Check if table exists first
            const tableExists = await tenantPool.query(`
              SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = '${tableName}'
              );
            `);

            if (tableExists.rows[0].exists) {
              // Clear the table
              await tenantPool.query(`TRUNCATE TABLE "${tableName}" CASCADE;`);
              console.log(`  ✅ Cleared table: ${tableName}`);
            } else {
              console.log(`  ⚠️  Table not found: ${tableName} (skipping)`);
            }
          } catch (error) {
            console.log(`  ❌ Error clearing ${tableName}:`, error.message);
          }
        }

        await tenantPool.end();
        console.log(`✅ Successfully cleaned tenant: ${tenant.organization_name}\n`);

      } catch (error) {
        console.error(`🚨 Error connecting to tenant DB for ${tenant.organization_name}:`, error.message);
        console.log(`   Skipping this tenant...\n`);
      }
    }

    console.log('🎉 Tenant data cleanup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Login as admin@gmail.com (password: admin123)');
    console.log('2. Add sample data in various sections');
    console.log('3. Test with jay@gmail.com and rakhyhalder96625@gmail.com');
    console.log('4. Verify data isolation across all 52 sections');

  } catch (error) {
    console.error('💥 Fatal error during cleanup:', error);
    process.exit(1);
  } finally {
    await masterPool.end();
  }
}

// Run the cleanup
clearAllTenantData()
  .then(() => {
    console.log('\n✨ Cleanup script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
