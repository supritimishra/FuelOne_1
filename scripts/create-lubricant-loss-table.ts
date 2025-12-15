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

// SQL to create lubricant_loss table
const createLubricantLossTable = `
CREATE TABLE IF NOT EXISTS lubricant_loss (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loss_date DATE NOT NULL DEFAULT CURRENT_DATE,
  lubricant_id UUID NOT NULL REFERENCES lubricants(id),
  quantity NUMERIC(12,3) NOT NULL,
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);
`;

async function createLubricantLossTableForAllTenants() {
  console.log('🔧 Creating lubricant_loss table for all tenants...\n');

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
      console.log(`🏢 Creating table for tenant: ${tenant.organization_name}`);
      console.log(`🆔 ID: ${tenant.id}`);
      console.log(`${'='.repeat(60)}`);

      try {
        // Connect to tenant database
        const tenantPool = new Pool({
          connectionString: tenant.connection_string,
          ssl: { rejectUnauthorized: false },
        });

        // Create the lubricant_loss table
        await tenantPool.query(createLubricantLossTable);
        console.log(`✅ Successfully created lubricant_loss table for ${tenant.organization_name}`);

        await tenantPool.end(); // Close tenant pool connection
      } catch (error: any) {
        console.error(`🚨 Error creating table for ${tenant.organization_name}:`, error.message);
      }
    }
    console.log('\n🎉 Lubricant loss table creation completed!\n');
  } catch (error: any) {
    console.error('Fatal error during master database operation:', error.message);
  } finally {
    await masterPool.end(); // Close master pool connection
    console.log('✨ Script finished');
  }
}

createLubricantLossTableForAllTenants();
