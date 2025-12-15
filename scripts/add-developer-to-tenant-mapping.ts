import { Pool } from 'pg';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.local.env') });

const masterDbUrl = process.env.DATABASE_URL;

if (!masterDbUrl) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

async function addDeveloperToTenantMapping() {
  const pool = new Pool({
    connectionString: masterDbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const tenantId = '1cde4287-730a-42b6-a3b7-7a2aed67fd1c';
    
    // Get tenant info
    const tenantResult = await pool.query(
      `SELECT id, organization_name FROM tenants WHERE id = $1`,
      [tenantId]
    );

    if (tenantResult.rows.length === 0) {
      console.error(`❌ Tenant not found`);
      process.exit(1);
    }

    const tenant = tenantResult.rows[0];
    console.log(`\n🔍 Tenant: ${tenant.organization_name}\n`);

    // Get developer user from tenant database
    const tenantResult2 = await pool.query(
      `SELECT connection_string FROM tenants WHERE id = $1`,
      [tenantId]
    );

    const tenantPool = new Pool({
      connectionString: tenantResult2.rows[0].connection_string,
      ssl: { rejectUnauthorized: false },
    });

    const userResult = await tenantPool.query(
      `SELECT id, email, username FROM users WHERE username = $1 OR email LIKE $2`,
      ['dev', 'dev@%']
    );

    if (userResult.rows.length === 0) {
      console.error('❌ Developer user not found in tenant database');
      await tenantPool.end();
      process.exit(1);
    }

    const devUser = userResult.rows[0];
    console.log('✅ Developer user found:');
    console.log(`   ID: ${devUser.id}`);
    console.log(`   Email: ${devUser.email}`);
    console.log(`   Username: ${devUser.username}\n`);

    await tenantPool.end();

    // Add to tenant_users mapping for both email and username
    console.log('📝 Adding to tenant_users mapping...\n');

    // Add email mapping
    const emailResult = await pool.query(
      `INSERT INTO tenant_users (tenant_id, user_email, user_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (tenant_id, user_email) DO UPDATE SET user_id = $3
       RETURNING id`,
      [tenantId, devUser.email.toLowerCase(), devUser.id]
    );

    console.log(`✅ Added email mapping: ${devUser.email}`);

    // Also add username mapping (if username is different from email)
    if (devUser.username && devUser.username.toLowerCase() !== devUser.email.toLowerCase()) {
      const usernameResult = await pool.query(
        `INSERT INTO tenant_users (tenant_id, user_email, user_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (tenant_id, user_email) DO UPDATE SET user_id = $3
         RETURNING id`,
        [tenantId, devUser.username.toLowerCase(), devUser.id]
      );

      console.log(`✅ Added username mapping: ${devUser.username}`);
    }

    console.log('\n✅ Developer user is now mapped to tenant!');
    console.log('\n💡 You can now login with:');
    console.log('   - Email: dev@developer.local');
    console.log('   - OR Username: dev');
    console.log('   - Password: dev123\n');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.constraint) {
      console.error(`   Constraint: ${error.constraint}`);
    }
    if (error.detail) {
      console.error(`   Detail: ${error.detail}`);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

addDeveloperToTenantMapping();

