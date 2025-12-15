import { Pool } from 'pg';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.local.env') });

const masterDbUrl = process.env.DATABASE_URL;

if (!masterDbUrl) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

async function verifyTenantFeatures() {
  const pool = new Pool({
    connectionString: masterDbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const tenantId = '1cde4287-730a-42b6-a3b7-7a2aed67fd1c';
    const result = await pool.query(
      `SELECT connection_string, tenant_db_name FROM tenants WHERE id = $1`,
      [tenantId]
    );

    if (result.rows.length === 0) {
      console.error(`❌ Tenant not found`);
      process.exit(1);
    }

    const { connection_string, tenant_db_name } = result.rows[0];
    console.log(`\n🔍 Checking tenant database: ${tenant_db_name}\n`);

    const tenantPool = new Pool({
      connectionString: connection_string,
      ssl: { rejectUnauthorized: false },
    });

    try {
      // Check current database
      const dbResult = await tenantPool.query('SELECT current_database()');
      console.log(`✅ Connected to: ${dbResult.rows[0].current_database}\n`);

      // Check feature_permissions table
      console.log('📋 Checking feature_permissions table...');
      const tableCheck = await tenantPool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'feature_permissions'
        ) as exists;
      `);

      if (!tableCheck.rows[0].exists) {
        console.log('❌ feature_permissions table NOT FOUND');
        console.log('💡 Run the migration SQL on this database');
        process.exit(1);
      }

      console.log('✅ feature_permissions table exists');

      // Check indexes
      const indexCheck = await tenantPool.query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'feature_permissions' 
        AND schemaname = 'public';
      `);
      console.log(`📊 Indexes: ${indexCheck.rows.length}`);
      indexCheck.rows.forEach((row: any) => console.log(`   - ${row.indexname}`));

      // Check data
      const countResult = await tenantPool.query('SELECT COUNT(*) as count FROM feature_permissions');
      const count = parseInt(countResult.rows[0].count);
      console.log(`\n📊 Total features: ${count}`);

      if (count === 0) {
        console.log('⚠️  Table exists but is EMPTY - run the INSERT migration');
      } else {
        console.log('✅ Data populated');
        
        // Show sample
        const sample = await tenantPool.query(`
          SELECT feature_key, label, default_enabled 
          FROM feature_permissions 
          ORDER BY feature_key 
          LIMIT 5
        `);
        console.log('\n📝 Sample features:');
        sample.rows.forEach((row: any) => {
          console.log(`   ${row.feature_key.padEnd(25)} | ${row.label}`);
        });
      }

      // Check user_feature_access table
      console.log('\n📋 Checking user_feature_access table...');
      const ufaCheck = await tenantPool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'user_feature_access'
        ) as exists;
      `);

      if (!ufaCheck.rows[0].exists) {
        console.log('❌ user_feature_access table NOT FOUND');
      } else {
        console.log('✅ user_feature_access table exists');
        const ufaCount = await tenantPool.query('SELECT COUNT(*) as count FROM user_feature_access');
        console.log(`📊 User feature overrides: ${ufaCount.rows[0].count}`);
      }

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

verifyTenantFeatures();

