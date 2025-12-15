import { Pool } from 'pg';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.local.env') });

const masterDbUrl = process.env.DATABASE_URL;

if (!masterDbUrl) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

async function findWrongUser() {
  const pool = new Pool({
    connectionString: masterDbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const wrongUserId = '0fc0d08e-f0ae-4276-8627-6581a0d0aacc';
    console.log(`\n🔍 Searching for user ID: ${wrongUserId}\n`);

    // Search across all tenants
    const tenantsResult = await pool.query(
      `SELECT id, organization_name, tenant_db_name, connection_string FROM tenants WHERE status = 'active'`
    );

    console.log(`Found ${tenantsResult.rows.length} active tenants\n`);

    for (const tenant of tenantsResult.rows) {
      const tenantPool = new Pool({
        connectionString: tenant.connection_string,
        ssl: { rejectUnauthorized: false },
      });

      try {
        const userResult = await tenantPool.query(
          `SELECT id, email, username, full_name FROM users WHERE id = $1`,
          [wrongUserId]
        );

        if (userResult.rows.length > 0) {
          const user = userResult.rows[0];
          console.log(`✅ FOUND USER!`);
          console.log(`   Tenant: ${tenant.organization_name} (${tenant.id})`);
          console.log(`   User ID: ${user.id}`);
          console.log(`   Email: ${user.email}`);
          console.log(`   Username: ${user.username || 'N/A'}`);
          console.log(`   Full Name: ${user.full_name || 'N/A'}`);
          
          // Check if this user has dashboard override
          const overrideResult = await tenantPool.query(
            `SELECT ufa.allowed, fp.feature_key
             FROM user_feature_access ufa
             JOIN feature_permissions fp ON ufa.feature_id = fp.id
             WHERE ufa.user_id = $1 AND fp.feature_key = 'dashboard'`,
            [wrongUserId]
          );
          
          if (overrideResult.rows.length > 0) {
            console.log(`\n   Dashboard override: allowed=${overrideResult.rows[0].allowed}`);
          } else {
            console.log(`\n   No dashboard override for this user`);
          }
        }
      } catch (err: any) {
        // Ignore errors, continue to next tenant
      } finally {
        await tenantPool.end();
      }
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

findWrongUser();

