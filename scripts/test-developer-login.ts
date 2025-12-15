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

async function testDeveloperLogin() {
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

    const { connection_string } = tenantResult.rows[0];
    const tenantPool = new Pool({
      connectionString: connection_string,
      ssl: { rejectUnauthorized: false },
    });

    try {
      // Try to find user by username
      console.log('\n🔍 Testing developer login...\n');
      console.log('Searching for user with username: "dev"\n');

      const userResult = await tenantPool.query(
        `SELECT id, email, username, password_hash, full_name 
         FROM users 
         WHERE username = $1 OR email = $1 OR LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1)`,
        ['dev']
      );

      if (userResult.rows.length === 0) {
        console.log('❌ User not found with username "dev"');
        console.log('\n📋 Checking all users in database:\n');
        
        const allUsers = await tenantPool.query(
          `SELECT id, email, username, full_name FROM users ORDER BY email`
        );
        
        allUsers.rows.forEach((user: any) => {
          console.log(`  - Email: ${user.email}, Username: ${user.username || 'NULL'}, Full Name: ${user.full_name || 'N/A'}`);
        });
        
        await tenantPool.end();
        process.exit(1);
      }

      const user = userResult.rows[0];
      console.log('✅ User found:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Username: ${user.username || 'NULL'}`);
      console.log(`   Full Name: ${user.full_name || 'N/A'}`);
      console.log(`   Password Hash: ${user.password_hash ? 'Present' : 'Missing'}\n`);

      // Test password verification
      if (!user.password_hash) {
        console.log('❌ Password hash is missing!');
        console.log('💡 Updating password...\n');
        
        const hashedPassword = await bcrypt.hash('dev123', 10);
        await tenantPool.query(
          `UPDATE users SET password_hash = $1 WHERE id = $2`,
          [hashedPassword, user.id]
        );
        console.log('✅ Password updated!\n');
        
        // Verify the password works
        const isValid = await bcrypt.compare('dev123', hashedPassword);
        console.log(`✅ Password verification test: ${isValid ? 'PASSED' : 'FAILED'}\n`);
      } else {
        // Test password verification
        const isValid = await bcrypt.compare('dev123', user.password_hash);
        console.log(`🔐 Password verification test: ${isValid ? '✅ PASSED' : '❌ FAILED'}\n`);
        
        if (!isValid) {
          console.log('⚠️  Password mismatch! Updating password...\n');
          const hashedPassword = await bcrypt.hash('dev123', 10);
          await tenantPool.query(
            `UPDATE users SET password_hash = $1 WHERE id = $2`,
            [hashedPassword, user.id]
          );
          console.log('✅ Password updated to dev123!\n');
        }
      }

      // Check user role
      const roleResult = await tenantPool.query(
        `SELECT role FROM user_roles WHERE user_id = $1`,
        [user.id]
      );

      if (roleResult.rows.length === 0) {
        console.log('⚠️  No role assigned. Setting to super_admin...\n');
        await tenantPool.query(
          `INSERT INTO user_roles (user_id, role) VALUES ($1, 'super_admin')`,
          [user.id]
        );
        console.log('✅ Role set to super_admin\n');
      } else {
        console.log(`✅ Role: ${roleResult.rows[0].role}\n`);
      }

      // Test the exact query the login route would use
      console.log('🧪 Testing login query logic...\n');
      const loginQueryResult = await tenantPool.query(
        `SELECT id, email, username, password_hash 
         FROM users 
         WHERE LOWER(email) = LOWER($1) OR LOWER(username) = LOWER($1)
         LIMIT 1`,
        ['dev']
      );

      if (loginQueryResult.rows.length > 0) {
        console.log('✅ Login query would find this user!');
        console.log(`   Found with: ${loginQueryResult.rows[0].email === 'dev' ? 'email match' : 'username match'}\n`);
      } else {
        console.log('❌ Login query would NOT find this user!\n');
      }

      console.log('✅ Developer account is ready for login!');
      console.log('   Login with:');
      console.log('   - Username: dev');
      console.log('   - OR Email: dev');
      console.log('   - OR Email: dev@developer.local');
      console.log('   - Password: dev123\n');

      await tenantPool.end();
    } catch (err: any) {
      console.error(`❌ Error: ${err.message}`);
      console.error(err);
      process.exit(1);
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testDeveloperLogin();

