import { Pool } from 'pg';
import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';

config({ path: path.resolve(process.cwd(), '.local.env') });

const masterDbUrl = process.env.DATABASE_URL;

if (!masterDbUrl) {
  console.error('❌ DATABASE_URL not found in environment');
  process.exit(1);
}

async function runMigration() {
  const pool = new Pool({
    connectionString: masterDbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // Get tenant connection string
    const tenantId = '1cde4287-730a-42b6-a3b7-7a2aed67fd1c';
    const result = await pool.query(
      `SELECT connection_string, tenant_db_name FROM tenants WHERE id = $1`,
      [tenantId]
    );

    if (result.rows.length === 0) {
      console.error(`❌ Tenant ${tenantId} not found`);
      process.exit(1);
    }

    const { connection_string, tenant_db_name } = result.rows[0];
    console.log(`\n🔍 Connecting to tenant database: ${tenant_db_name}\n`);

    // Read migration file
    const migrationPath = path.resolve(process.cwd(), 'migrations/20251101_complete_feature_permissions_setup.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Connect to tenant database
    const tenantPool = new Pool({
      connectionString: connection_string,
      ssl: { rejectUnauthorized: false },
    });

    try {
      console.log('📝 Running migration...\n');
      await tenantPool.query(migrationSQL);
      console.log('✅ Migration completed successfully!\n');

      // Verify
      const countResult = await tenantPool.query('SELECT COUNT(*) as count FROM feature_permissions');
      console.log(`📊 Total features created: ${countResult.rows[0].count}`);
      
      await tenantPool.end();
    } catch (err: any) {
      console.error(`❌ Migration error: ${err.message}`);
      if (err.position) {
        console.error(`   Error at position: ${err.position}`);
      }
      process.exit(1);
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();

