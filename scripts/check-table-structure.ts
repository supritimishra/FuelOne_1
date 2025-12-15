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

async function checkTableStructure() {
  console.log('🔍 Checking table structure for all tenants...\n');

  try {
    // Get all active tenants
    const tenants = await masterPool.query(`
      SELECT id, organization_name, connection_string
      FROM tenants
      WHERE status = 'active'
      ORDER BY created_at DESC
    `);

    console.log(`📦 Checking ${tenants.rows.length} active tenants:\n`);

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

        // Get all tables in the tenant database
        const tables = await tenantPool.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          ORDER BY table_name
        `);

        console.log(`📋 Found ${tables.rows.length} tables:`);
        tables.rows.forEach(table => {
          console.log(`  - ${table.table_name}`);
        });

        // Check a few key tables for data
        const keyTables = ['fuel_products', 'lubricants', 'credit_customers', 'employees', 'expense_types'];
        console.log(`\n🔍 Checking key tables for data:`);
        
        for (const tableName of keyTables) {
          try {
            const result = await tenantPool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
            console.log(`  - ${tableName}: ${result.rows[0].count} records`);
          } catch (error) {
            console.log(`  - ${tableName}: Table not found or error`);
          }
        }

        await tenantPool.end();
        console.log(`✅ Completed check for ${tenant.organization_name}\n`);

      } catch (error) {
        console.error(`🚨 Error connecting to tenant DB for ${tenant.organization_name}:`, error.message);
      }
    }

  } catch (error) {
    console.error('🚨 Error:', error);
  } finally {
    await masterPool.end();
  }

  console.log('🎉 Table structure check completed!');
  process.exit(0);
}

checkTableStructure();
