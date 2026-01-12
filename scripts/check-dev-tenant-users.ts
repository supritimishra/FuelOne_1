import { Pool } from 'pg';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.local.env') });

const masterDbUrl = process.env.DATABASE_URL;

if (!masterDbUrl) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

async function checkDevTenantUsers() {
  const pool = new Pool({
    connectionString: masterDbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // Dev's tenant
    const devTenantId = '1cde4287-730a-42b6-a3b7-7a2aed67fd1c';
    console.log(`\n🔍 Checking Dev's Tenant: ${devTenantId}\n`);
    
    const tenantResult = await pool.query(
      `SELECT id, organization_name, tenant_db_name, connection_string 
       FROM tenants 
       WHERE id = $1`,
      [devTenantId]
    );

    if (tenantResult.rows.length === 0) {
      console.error(`❌ Tenant not found`);
      process.exit(1);
    }

    const tenant = tenantResult.rows[0];
    console.log(`📊 Tenant: ${tenant.organization_name}`);
    console.log(`   Database: ${tenant.tenant_db_name}\n`);

    const tenantPool = new Pool({
      connectionString: tenant.connection_string,
      ssl: { rejectUnauthorized: false },
    });

    try {
      // List all users in dev's tenant
      const usersResult = await tenantPool.query(
        `SELECT u.id, u.email, u.username, u.full_name, u.created_at,
                COALESCE(json_agg(json_build_object('role', ur.role)) FILTER (WHERE ur.role IS NOT NULL), '[]'::json) as roles
         FROM users u
         LEFT JOIN user_roles ur ON u.id = ur.user_id
         GROUP BY u.id, u.email, u.username, u.full_name, u.created_at
         ORDER BY u.email`
      );

      console.log(`👥 Users in Dev's Tenant (${usersResult.rows.length} total):\n`);
      usersResult.rows.forEach((user: any) => {
        const roles = Array.isArray(user.roles) ? user.roles.map((r: any) => r.role).join(', ') : 'none';
        console.log(`   ${user.email.padEnd(40)} ${user.username?.padEnd(15) || 'N/A'.padEnd(15)} ID: ${user.id}`);
        console.log(`   ${' '.repeat(40)} Full Name: ${user.full_name || 'N/A'}, Roles: ${roles}`);
        
        // Check if this looks like Jay
        if (user.email.toLowerCase().includes('jay') || 
            user.username?.toLowerCase().includes('jay') ||
            user.full_name?.toLowerCase().includes('jay')) {
          console.log(`   ⚠️  This might be Jay, but ID doesn't match!`);
        }
        console.log('');
      });

      // Check if there's a user with email jay@gmail.com
      const jayCheck = usersResult.rows.find((u: any) => u.email.toLowerCase() === 'jay@gmail.com');
      if (jayCheck) {
        console.log(`\n✅ Found jay@gmail.com in dev's tenant!`);
        console.log(`   This is the user that should be selected in Developer Mode.`);
        console.log(`   User ID: ${jayCheck.id}`);
      } else {
        console.log(`\n❌ jay@gmail.com NOT FOUND in dev's tenant!`);
        console.log(`   This means Jay is in a different tenant and won't appear in Developer Mode.`);
      }

      await tenantPool.end();
    } catch (err: any) {
      console.error(`❌ Error: ${err.message}`);
      process.exit(1);
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

checkDevTenantUsers();

