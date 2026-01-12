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

async function verifyDataCleared() {
  console.log('🔍 Verifying data has been cleared from all tenants...\n');

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

        // Check key tables for data
        const tablesToCheck = [
          'lubricants',
          'fuel_products', 
          'credit_customers',
          'employees',
          'expense_types',
          'vendors',
          'business_parties'
        ];

        let hasData = false;
        for (const tableName of tablesToCheck) {
          try {
            const result = await tenantPool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
            const count = parseInt(result.rows[0].count);
            if (count > 0) {
              console.log(`❌ ${tableName}: ${count} records found`);
              hasData = true;
            } else {
              console.log(`✅ ${tableName}: 0 records (cleared)`);
            }
          } catch (error) {
            console.log(`⚠️  ${tableName}: Table not found or error - ${error.message}`);
          }
        }

        if (!hasData) {
          console.log(`✅ All tables cleared for ${tenant.organization_name}`);
        } else {
          console.log(`❌ Some data still exists for ${tenant.organization_name}`);
        }

        await tenantPool.end();
      } catch (error) {
        console.error(`🚨 Error connecting to tenant DB for ${tenant.organization_name}:`, error.message);
      }
    }

    console.log('\n🎉 Data verification completed!');
  } catch (error) {
    console.error('🚨 Error during verification:', error);
  } finally {
    await masterPool.end();
  }
}

verifyDataCleared().catch(console.error);
