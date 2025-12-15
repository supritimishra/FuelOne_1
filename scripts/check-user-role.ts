import { Pool } from 'pg';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.local.env') });

const masterDbUrl = process.env.DATABASE_URL;

if (!masterDbUrl) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

async function checkUserRole() {
  const pool = new Pool({
    connectionString: masterDbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const tenantId = '1cde4287-730a-42b6-a3b7-7a2aed67fd1c';
    const tenantResult = await pool.query(
      `SELECT connection_string FROM tenants WHERE id = $1`,
      [tenantId]
    );

    if (tenantResult.rows.length === 0) {
      console.error(`❌ Tenant not found`);
      process.exit(1);
    }

    const tenantPool = new Pool({
      connectionString: tenantResult.rows[0].connection_string,
      ssl: { rejectUnauthorized: false },
    });

    // Get all users with their roles
    const usersResult = await tenantPool.query(`
      SELECT 
        u.id,
        u.email,
        u.full_name,
        COALESCE(ur.role, 'No role') as role
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      ORDER BY u.email
    `);

    console.log('\n👥 Users in your tenant:\n');
    console.log('=' .repeat(80));
    
    usersResult.rows.forEach((user: any, idx: number) => {
      const isSuperAdmin = user.role === 'super_admin';
      const roleDisplay = user.role === 'No role' ? '⚠️  No role assigned' : user.role;
      const status = isSuperAdmin ? '✅ Can access Developer Mode' : '❌ Cannot access Developer Mode';
      
      console.log(`\n${idx + 1}. ${user.email}`);
      console.log(`   Name: ${user.full_name || 'N/A'}`);
      console.log(`   Role: ${roleDisplay}`);
      console.log(`   Status: ${status}`);
    });

    const superAdmins = usersResult.rows.filter((u: any) => u.role === 'super_admin');
    
    if (superAdmins.length === 0) {
      console.log('\n\n⚠️  WARNING: No super_admin users found!');
      console.log('💡 To make a user a super_admin, run this SQL in your tenant database:');
      console.log('\n   UPDATE user_roles SET role = \'super_admin\' WHERE user_id = \'<USER_ID>\';\n');
      console.log('   Or insert if no role exists:');
      console.log('\n   INSERT INTO user_roles (user_id, role) VALUES (\'<USER_ID>\', \'super_admin\');\n');
    }

    await tenantPool.end();
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

checkUserRole();

