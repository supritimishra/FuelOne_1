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

async function runMigrationForJayTenant() {
  const pool = new Pool({
    connectionString: masterDbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // Jay's tenant ID from the error logs
    const tenantId = 'f1f5c217-7b39-4031-9d76-b7da090bad65';
    
    console.log(`\n🔍 Looking for tenant: ${tenantId}\n`);
    
    const result = await pool.query(
      `SELECT id, organization_name, tenant_db_name, connection_string 
       FROM tenants 
       WHERE id = $1`,
      [tenantId]
    );

    if (result.rows.length === 0) {
      console.error(`❌ Tenant ${tenantId} not found`);
      console.log('\n💡 Available tenants:');
      const allTenants = await pool.query(`SELECT id, organization_name, tenant_db_name FROM tenants`);
      allTenants.rows.forEach((t: any) => {
        console.log(`   - ${t.id} (${t.organization_name}) - DB: ${t.tenant_db_name}`);
      });
      process.exit(1);
    }

    const tenant = result.rows[0];
    console.log('📊 Tenant Information:');
    console.log('='.repeat(60));
    console.log(`Tenant ID: ${tenant.id}`);
    console.log(`Organization: ${tenant.organization_name}`);
    console.log(`Database Name: ${tenant.tenant_db_name}`);
    console.log('='.repeat(60));
    console.log('\n');

    // Read migration file
    const migrationPath = path.resolve(process.cwd(), 'migrations/20251101_complete_feature_permissions_setup.sql');
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Migration file not found: ${migrationPath}`);
      process.exit(1);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    console.log(`📝 Loaded migration file: ${migrationPath}\n`);

    // Connect to tenant database
    const tenantPool = new Pool({
      connectionString: tenant.connection_string,
      ssl: { rejectUnauthorized: false },
    });

    try {
      // First check if table already exists
      const checkResult = await tenantPool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'feature_permissions'
        ) as exists;
      `);
      
      if (checkResult.rows[0].exists) {
        console.log('⚠️  feature_permissions table already exists');
        const countResult = await tenantPool.query('SELECT COUNT(*) as count FROM feature_permissions');
        console.log(`📊 Current feature count: ${countResult.rows[0].count}`);
        console.log('📝 Running migration anyway (it uses IF NOT EXISTS, so it\'s safe)...\n');
      } else {
        console.log('✅ feature_permissions table does not exist - migration needed\n');
      }

      console.log('🚀 Running migration...\n');
      await tenantPool.query(migrationSQL);
      console.log('✅ Migration completed successfully!\n');

      // Verify
      const countResult = await tenantPool.query('SELECT COUNT(*) as count FROM feature_permissions');
      console.log(`📊 Total features in database: ${countResult.rows[0].count}`);
      
      // Check user_feature_access table
      const ufaCheck = await tenantPool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'user_feature_access'
        ) as exists;
      `);
      console.log(`📊 user_feature_access table: ${ufaCheck.rows[0].exists ? '✅ EXISTS' : '❌ MISSING'}`);
      
      await tenantPool.end();
      
      console.log('\n✅ Migration complete! Jay should now be able to see feature permissions.');
      console.log('💡 Jay may need to refresh the browser (F5) to see changes.');
      
    } catch (err: any) {
      console.error(`❌ Migration error: ${err.message}`);
      if (err.position) {
        console.error(`   Error at position: ${err.position}`);
      }
      if (err.detail) {
        console.error(`   Detail: ${err.detail}`);
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

runMigrationForJayTenant();

