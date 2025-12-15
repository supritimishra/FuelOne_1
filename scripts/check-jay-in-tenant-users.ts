import { Pool } from 'pg';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.local.env') });

const masterDbUrl = process.env.DATABASE_URL;

if (!masterDbUrl) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

async function checkJayInTenantUsers() {
  const pool = new Pool({
    connectionString: masterDbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('\n🔍 Looking up jay@gmail.com in tenant_users table...\n');
    
    const result = await pool.query(
      `SELECT * FROM tenant_users WHERE user_email = $1`,
      ['jay@gmail.com']
    );

    console.log(`Found ${result.rows.length} record(s) for jay@gmail.com:\n`);
    
    result.rows.forEach((row: any, index: number) => {
      console.log(`Record ${index + 1}:`);
      console.log(`  ID: ${row.id}`);
      console.log(`  Tenant ID: ${row.tenant_id}`);
      console.log(`  User Email: ${row.user_email}`);
      console.log(`  User ID: ${row.user_id}`);
      console.log(`  Created At: ${row.created_at}`);
      console.log('');
    });

    // Also check which tenant this is
    if (result.rows.length > 0) {
      const tenantId = result.rows[0].tenant_id;
      const tenantResult = await pool.query(
        `SELECT id, organization_name FROM tenants WHERE id = $1`,
        [tenantId]
      );
      
      if (tenantResult.rows.length > 0) {
        console.log(`✅ Tenant: ${tenantResult.rows[0].organization_name} (${tenantId})`);
      }
    }

    await pool.end();
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkJayInTenantUsers();

