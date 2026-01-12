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

async function runMigrationOnAllTenants() {
  const pool = new Pool({
    connectionString: masterDbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // Get all active tenants
    console.log('\n🔍 Fetching all tenants...\n');
    const tenantsResult = await pool.query(`
      SELECT id, organization_name, tenant_db_name, connection_string, status
      FROM tenants
      WHERE status = 'active'
      ORDER BY organization_name
    `);

    if (tenantsResult.rows.length === 0) {
      console.log('❌ No active tenants found');
      process.exit(1);
    }

    console.log(`✅ Found ${tenantsResult.rows.length} active tenant(s)\n`);

    // Read migration file
    const migrationPath = path.resolve(process.cwd(), 'migrations/20251101_complete_feature_permissions_setup.sql');
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Migration file not found: ${migrationPath}`);
      process.exit(1);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    console.log(`📝 Migration file loaded: ${migrationPath}\n`);

    // Run migration on each tenant
    const results: Array<{ tenant: any; success: boolean; error?: string }> = [];

    for (const tenant of tenantsResult.rows) {
      console.log(`\n${'='.repeat(70)}`);
      console.log(`📊 Processing: ${tenant.organization_name}`);
      console.log(`   Tenant ID: ${tenant.id}`);
      console.log(`   Database: ${tenant.tenant_db_name}`);
      console.log(`${'='.repeat(70)}`);

      const tenantPool = new Pool({
        connectionString: tenant.connection_string,
        ssl: { rejectUnauthorized: false },
      });

      try {
        // Check if table already exists
        const checkResult = await tenantPool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'feature_permissions'
          ) as exists;
        `);
        
        if (checkResult.rows[0].exists) {
          const countResult = await tenantPool.query('SELECT COUNT(*) as count FROM feature_permissions');
          console.log(`   ⚠️  Table already exists with ${countResult.rows[0].count} features`);
          console.log(`   📝 Running migration anyway (safe - uses IF NOT EXISTS)...`);
        } else {
          console.log(`   ✅ Table does not exist - migration needed`);
        }

        // Run migration
        await tenantPool.query(migrationSQL);
        
        // Verify
        const countResult = await tenantPool.query('SELECT COUNT(*) as count FROM feature_permissions');
        console.log(`   ✅ Migration complete! Created ${countResult.rows[0].count} features`);
        
        results.push({ tenant, success: true });
        await tenantPool.end();
        
      } catch (err: any) {
        const errorMsg = err.message || String(err);
        console.error(`   ❌ Migration failed: ${errorMsg}`);
        results.push({ tenant, success: false, error: errorMsg });
        await tenantPool.end();
      }
    }

    // Summary
    console.log(`\n${'='.repeat(70)}`);
    console.log('📊 Migration Summary:');
    console.log(`${'='.repeat(70)}`);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tenants:');
      results.filter(r => !r.success).forEach(r => {
        console.log(`   - ${r.tenant.organization_name} (${r.tenant.id})`);
        console.log(`     Error: ${r.error}`);
      });
    }
    
    console.log(`\n✅ Migration process complete!\n`);
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrationOnAllTenants();

