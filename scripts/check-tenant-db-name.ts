import { Pool } from 'pg';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.local.env') });

const masterDbUrl = process.env.DATABASE_URL;

if (!masterDbUrl) {
  console.error('❌ DATABASE_URL not found in environment');
  process.exit(1);
}

async function checkTenantDatabase() {
  const pool = new Pool({
    connectionString: masterDbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // Get tenant info
    const tenantId = '1cde4287-730a-42b6-a3b7-7a2aed67fd1c';
    const result = await pool.query(
      `SELECT id, organization_name, tenant_db_name, connection_string 
       FROM tenants 
       WHERE id = $1`,
      [tenantId]
    );

    if (result.rows.length === 0) {
      console.error(`❌ Tenant ${tenantId} not found`);
      process.exit(1);
    }

    const tenant = result.rows[0];
    console.log('\n📊 Tenant Information:');
    console.log('=' .repeat(60));
    console.log(`Tenant ID: ${tenant.id}`);
    console.log(`Organization: ${tenant.organization_name}`);
    console.log(`Database Name: ${tenant.tenant_db_name}`);
    
    // Extract database name from connection string
    try {
      const url = new URL(tenant.connection_string);
      const dbName = url.pathname.split('/').pop();
      console.log(`Database Name from Connection String: ${dbName}`);
      console.log(`Full Connection String: ${tenant.connection_string.substring(0, 80)}...`);
    } catch (e) {
      console.log(`Connection String: ${tenant.connection_string.substring(0, 80)}...`);
    }

    console.log('\n🔍 Testing connection to tenant database...');
    
    // Try to connect to tenant DB and check for feature_permissions
    const tenantPool = new Pool({
      connectionString: tenant.connection_string,
      ssl: { rejectUnauthorized: false },
    });

    try {
      // Check current database name
      const dbNameResult = await tenantPool.query('SELECT current_database() as db_name');
      console.log(`✅ Connected to database: ${dbNameResult.rows[0].db_name}`);
      
      // Check if feature_permissions table exists
      const tableCheck = await tenantPool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'feature_permissions'
        ) as exists;
      `);
      
      console.log(`\n📋 Feature Permissions Table: ${tableCheck.rows[0].exists ? '✅ EXISTS' : '❌ NOT FOUND'}`);
      
      if (tableCheck.rows[0].exists) {
        const countResult = await tenantPool.query('SELECT COUNT(*) as count FROM feature_permissions');
        console.log(`📊 Total features: ${countResult.rows[0].count}`);
      }
      
      await tenantPool.end();
    } catch (err: any) {
      console.error(`❌ Error connecting to tenant DB: ${err.message}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n💡 To fix: Run the migration SQL on the database shown above');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

checkTenantDatabase();

