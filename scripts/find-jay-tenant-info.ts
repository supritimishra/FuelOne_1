import { Pool } from 'pg';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.local.env') });

const masterDbUrl = process.env.DATABASE_URL;

if (!masterDbUrl) {
  console.error('❌ DATABASE_URL not found in environment');
  process.exit(1);
}

async function findJayTenant() {
  const pool = new Pool({
    connectionString: masterDbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // Find tenant by Jay's email
    console.log('\n🔍 Searching for Jay\'s tenant...\n');
    
    // First, find which tenant Jay belongs to
    const tenantUserResult = await pool.query(`
      SELECT DISTINCT t.id, t.organization_name, t.tenant_db_name, t.connection_string
      FROM tenants t
      INNER JOIN tenant_users tu ON t.id = tu.tenant_id
      WHERE tu.user_email = 'jay@gmail.com'
    `);

    if (tenantUserResult.rows.length === 0) {
      console.log('❌ No tenant found for jay@gmail.com');
      console.log('\n💡 Searching by tenant ID from error logs: f1f5c217-7b39-4031-9d76-b7da090bad65\n');
      
      const directTenantResult = await pool.query(
        `SELECT id, organization_name, tenant_db_name, connection_string 
         FROM tenants 
         WHERE id = $1`,
        ['f1f5c217-7b39-4031-9d76-b7da090bad65']
      );
      
      if (directTenantResult.rows.length === 0) {
        console.error('❌ Tenant f1f5c217-7b39-4031-9d76-b7da090bad65 not found');
        console.log('\n📋 All available tenants:');
        const allTenants = await pool.query(`SELECT id, organization_name, tenant_db_name FROM tenants`);
        allTenants.rows.forEach((t: any) => {
          console.log(`   - ${t.id}`);
          console.log(`     Organization: ${t.organization_name}`);
          console.log(`     DB Name: ${t.tenant_db_name}`);
          console.log('');
        });
        process.exit(1);
      }
      
      const tenant = directTenantResult.rows[0];
      console.log('✅ Found tenant!');
      console.log('='.repeat(70));
      console.log(`Tenant ID: ${tenant.id}`);
      console.log(`Organization: ${tenant.organization_name}`);
      console.log(`Database Name: ${tenant.tenant_db_name}`);
      
      // Extract database name from connection string
      try {
        const url = new URL(tenant.connection_string);
        const dbName = url.pathname.split('/').pop();
        console.log(`\n📊 Database Name: ${dbName}`);
        console.log(`\n🔗 Connection String (first 100 chars):`);
        console.log(`   ${tenant.connection_string.substring(0, 100)}...`);
      } catch (e) {
        console.log(`\n🔗 Connection String: ${tenant.connection_string.substring(0, 100)}...`);
      }
      
      console.log('\n' + '='.repeat(70));
      console.log('\n📝 TO FIX: Run the migration SQL in Supabase SQL Editor');
      console.log('   1. Go to Supabase Dashboard');
      console.log(`   2. Select the database: ${tenant.tenant_db_name}`);
      console.log('   3. Open SQL Editor');
      console.log('   4. Copy the SQL from: migrations/20251101_complete_feature_permissions_setup.sql');
      console.log('   5. Paste and Run');
      console.log('\n   OR use the script: npx tsx scripts/run-migration-for-jay-tenant.ts');
      
      return;
    }

    const tenant = tenantUserResult.rows[0];
    console.log('✅ Found Jay\'s tenant!');
    console.log('='.repeat(70));
    console.log(`Tenant ID: ${tenant.id}`);
    console.log(`Organization: ${tenant.organization_name}`);
    console.log(`Database Name: ${tenant.tenant_db_name}`);
    
    // Extract database name from connection string
    try {
      const url = new URL(tenant.connection_string);
      const dbName = url.pathname.split('/').pop();
      console.log(`\n📊 Database Name: ${dbName}`);
      console.log(`\n🔗 Connection String (first 100 chars):`);
      console.log(`   ${tenant.connection_string.substring(0, 100)}...`);
    } catch (e) {
      console.log(`\n🔗 Connection String: ${tenant.connection_string.substring(0, 100)}...`);
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('\n📝 TO FIX: Run the migration SQL in Supabase SQL Editor');
    console.log('   1. Go to Supabase Dashboard');
    console.log(`   2. Select the database: ${tenant.tenant_db_name}`);
    console.log('   3. Open SQL Editor');
    console.log('   4. Copy the SQL from: migrations/20251101_complete_feature_permissions_setup.sql');
    console.log('   5. Paste and Run');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Network error - cannot connect to database.');
      console.log('   Please run the migration manually in Supabase SQL Editor.');
      console.log('   Tenant ID: f1f5c217-7b39-4031-9d76-b7da090bad65');
      console.log('   Migration file: migrations/20251101_complete_feature_permissions_setup.sql');
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

findJayTenant();

