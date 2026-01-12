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

async function createDeveloperUser() {
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

    const { connection_string, organization_name } = tenantResult.rows[0];
    console.log(`\n🔍 Connecting to tenant: ${organization_name}\n`);

    const tenantPool = new Pool({
      connectionString: connection_string,
      ssl: { rejectUnauthorized: false },
    });

    try {
      // Check if developer user already exists
      const existingUser = await tenantPool.query(
        `SELECT id, email, username FROM users WHERE username = $1 OR email = $2`,
        ['dev', 'dev@developer.local']
      );

      if (existingUser.rows.length > 0) {
        console.log('⚠️  Developer user already exists:');
        console.log(`   Username: ${existingUser.rows[0].username || 'N/A'}`);
        console.log(`   Email: ${existingUser.rows[0].email}`);
        console.log(`   ID: ${existingUser.rows[0].id}`);
        
        // Check if they have super_admin role
        const roleCheck = await tenantPool.query(
          `SELECT role FROM user_roles WHERE user_id = $1`,
          [existingUser.rows[0].id]
        );
        
        if (roleCheck.rows.length > 0) {
          console.log(`   Role: ${roleCheck.rows[0].role}`);
        } else {
          console.log('   Role: None (will be set to super_admin)');
          // Add super_admin role
          await tenantPool.query(
            `INSERT INTO user_roles (user_id, role) VALUES ($1, 'super_admin') ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin'`,
            [existingUser.rows[0].id]
          );
          console.log('   ✅ Updated role to super_admin');
        }
        
        // Update password to dev123
        const hashedPassword = await bcrypt.hash('dev123', 10);
        await tenantPool.query(
          `UPDATE users SET password_hash = $1 WHERE id = $2`,
          [hashedPassword, existingUser.rows[0].id]
        );
        console.log('   ✅ Password updated to dev123');
        
        console.log('\n✅ Developer account ready!');
        console.log('   Username: dev');
        console.log('   Password: dev123');
        console.log('   You can now login with these credentials.\n');
        
        await tenantPool.end();
        return;
      }

      // Create new developer user
      console.log('📝 Creating developer user...\n');
      
      const hashedPassword = await bcrypt.hash('dev123', 10);
      const insertResult = await tenantPool.query(
        `INSERT INTO users (email, username, password_hash, full_name)
         VALUES ($1, $2, $3, $4)
         RETURNING id, email, username, full_name`,
        ['dev@developer.local', 'dev', hashedPassword, 'Developer Account']
      );

      const newUser = insertResult.rows[0];
      console.log('✅ Developer user created:');
      console.log(`   ID: ${newUser.id}`);
      console.log(`   Username: ${newUser.username}`);
      console.log(`   Email: ${newUser.email}`);
      console.log(`   Full Name: ${newUser.full_name}\n`);

      // Add super_admin role
      await tenantPool.query(
        `INSERT INTO user_roles (user_id, role) VALUES ($1, 'super_admin')`,
        [newUser.id]
      );
      console.log('✅ Role set to super_admin\n');

      console.log('✅ Developer account created successfully!');
      console.log('   Username: dev');
      console.log('   Password: dev123');
      console.log('   Role: super_admin');
      console.log('   You can now login with these credentials.\n');

      await tenantPool.end();
    } catch (err: any) {
      console.error(`❌ Error: ${err.message}`);
      if (err.constraint) {
        console.error(`   Constraint: ${err.constraint}`);
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

createDeveloperUser();

