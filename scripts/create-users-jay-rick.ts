import { Pool } from 'pg';
import { config } from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';

config({ path: path.resolve(process.cwd(), '.local.env') });

const masterDbUrl = process.env.DATABASE_URL;

if (!masterDbUrl) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

async function createUsers() {
  const pool = new Pool({
    connectionString: masterDbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const tenantId = '1cde4287-730a-42b6-a3b7-7a2aed67fd1c';
    const tenantResult = await pool.query(
      `SELECT connection_string, organization_name FROM tenants WHERE id = $1`,
      [tenantId]
    );

    if (tenantResult.rows.length === 0) {
      console.error(`❌ Tenant not found`);
      process.exit(1);
    }

    const tenant = tenantResult.rows[0];
    console.log(`\n🏢 Tenant: ${tenant.organization_name}`);
    console.log('='.repeat(80));

    const tenantPool = new Pool({
      connectionString: tenant.connection_string,
      ssl: { rejectUnauthorized: false },
    });

    // Users to create
    const usersToCreate = [
      {
        email: 'jay@gmail.com',
        username: 'jay',
        fullName: 'Jay',
        password: 'jay123',
        role: 'manager'
      },
      {
        email: 'rickh5054@gmail.com',
        username: 'rick',
        fullName: 'Rick',
        password: 'rick123',
        role: 'manager'
      }
    ];

    for (const userData of usersToCreate) {
      // Check if user already exists
      const existingUser = await tenantPool.query(
        `SELECT id, email, username FROM users WHERE LOWER(email) = $1 OR username = $2`,
        [userData.email.toLowerCase(), userData.username]
      );

      if (existingUser.rows.length > 0) {
        console.log(`\n⚠️  User ${userData.email} already exists:`, existingUser.rows[0]);
        continue;
      }

      // Hash password
      const passwordHash = await bcrypt.hash(userData.password, 10);

      // Create user
      const userResult = await tenantPool.query(
        `INSERT INTO users (email, username, full_name, password_hash, created_at) 
         VALUES ($1, $2, $3, $4, now()) RETURNING id, email, username, full_name`,
        [userData.email.toLowerCase(), userData.username, userData.fullName, passwordHash]
      );

      const newUser = userResult.rows[0];
      console.log(`\n✅ Created user: ${newUser.email} (${newUser.full_name || newUser.username})`);
      console.log(`   ID: ${newUser.id}`);

      // Assign role
      await tenantPool.query(
        `INSERT INTO user_roles (user_id, role, created_at) VALUES ($1, $2, now())`,
        [newUser.id, userData.role]
      );
      console.log(`   Role: ${userData.role}`);

      // Register in tenant_users mapping
      try {
        await pool.query(
          `INSERT INTO tenant_users (tenant_id, user_email, user_id, created_at) 
           VALUES ($1, $2, $3, now()) 
           ON CONFLICT DO NOTHING`,
          [tenantId, newUser.email.toLowerCase(), newUser.id]
        );
        await pool.query(
          `INSERT INTO tenant_users (tenant_id, user_email, user_id, created_at) 
           VALUES ($1, $2, $3, now()) 
           ON CONFLICT DO NOTHING`,
          [tenantId, newUser.username, newUser.id]
        );
        console.log(`   ✅ Registered in tenant mapping`);
      } catch (mappingError: any) {
        console.warn(`   ⚠️  Could not register in tenant mapping:`, mappingError.message);
      }
    }

    // List all users
    const allUsers = await tenantPool.query(`
      SELECT 
        u.id,
        u.email,
        u.username,
        u.full_name,
        COALESCE(json_agg(json_build_object('role', ur.role)) FILTER (WHERE ur.role IS NOT NULL), '[]'::json) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      GROUP BY u.id, u.email, u.username, u.full_name
      ORDER BY u.email
    `);

    console.log(`\n${'='.repeat(80)}`);
    console.log(`\n👥 All Users in Tenant (${allUsers.rows.length} total):\n`);

    for (const user of allUsers.rows) {
      const roles = user.roles && Array.isArray(user.roles) 
        ? user.roles.map((r: any) => r.role).filter(Boolean)
        : [];
      console.log(`📧 ${user.email}`);
      if (user.username) console.log(`   Username: ${user.username}`);
      if (user.full_name) console.log(`   Name: ${user.full_name}`);
      console.log(`   Roles: ${roles.length > 0 ? roles.join(', ') : '(no roles)'}`);
      console.log('');
    }

    await tenantPool.end();
    await pool.end();
    console.log('✅ Done! Users should now appear in Developer Mode.\n');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createUsers();

