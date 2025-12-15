import { Pool } from 'pg';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.local.env') });

const masterDbUrl = process.env.DATABASE_URL;

if (!masterDbUrl) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

async function listAllUsers() {
  const pool = new Pool({
    connectionString: masterDbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const tenantId = '1cde4287-730a-42b6-a3b7-7a2aed67fd1c';
    const tenantResult = await pool.query(
      `SELECT connection_string, organization_name, tenant_db_name FROM tenants WHERE id = $1`,
      [tenantId]
    );

    if (tenantResult.rows.length === 0) {
      console.error(`❌ Tenant not found`);
      process.exit(1);
    }

    const tenant = tenantResult.rows[0];
    console.log(`\n🏢 Tenant: ${tenant.organization_name}`);
    console.log(`📊 Database: ${tenant.tenant_db_name}\n`);
    console.log('='.repeat(80));

    const tenantPool = new Pool({
      connectionString: tenant.connection_string,
      ssl: { rejectUnauthorized: false },
    });

    // Get ALL users with their roles
    const usersResult = await tenantPool.query(`
      SELECT 
        u.id,
        u.email,
        u.username,
        u.full_name,
        u.created_at,
        COALESCE(json_agg(json_build_object('role', ur.role)) FILTER (WHERE ur.role IS NOT NULL), '[]'::json) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      GROUP BY u.id, u.email, u.username, u.full_name, u.created_at
      ORDER BY u.email
    `);

    console.log(`\n👥 Total Users Found: ${usersResult.rows.length}\n`);
    console.log('='.repeat(80));

    for (const user of usersResult.rows) {
      const roles = user.roles && Array.isArray(user.roles) 
        ? user.roles.map((r: any) => r.role).filter(Boolean)
        : [];
      
      console.log(`\n📧 Email: ${user.email}`);
      if (user.username) console.log(`   Username: ${user.username}`);
      if (user.full_name) console.log(`   Name: ${user.full_name}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Roles: ${roles.length > 0 ? roles.join(', ') : '(no roles assigned)'}`);
      console.log(`   Created: ${user.created_at || 'N/A'}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log(`\n✅ Total: ${usersResult.rows.length} user(s) in database\n`);

    await tenantPool.end();
    await pool.end();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

listAllUsers();

