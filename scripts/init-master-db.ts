import { Pool } from 'pg';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config({ path: path.resolve(process.cwd(), '.local.env') });

async function initializeMasterDatabase() {
  let pool: Pool | null = null;
  
  try {
    console.log('\n🚀 Initializing master database...\n');
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL not found in environment variables');
    }

    console.log('📡 Connecting to database...');
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    // Read SQL file
    const sqlPath = path.resolve(__dirname, '../migrations/create-master-tenant-tables.sql');
    console.log(`📄 Reading SQL file: ${sqlPath}`);
    
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    // Execute SQL
    console.log('⚡ Executing SQL statements...\n');
    await pool.query(sql);

    console.log('✅ Master database tables created successfully!\n');
    console.log('Tables created:');
    console.log('  - tenants');
    console.log('  - tenant_users');
    console.log('  - Indexes created');
    console.log('  - Triggers created\n');

    // Verify tables exist
    console.log('🔍 Verifying tables...');
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('tenants', 'tenant_users')
      ORDER BY table_name;
    `);

    if (result.rows.length === 2) {
      console.log('✅ Verification successful! Tables found:');
      result.rows.forEach(row => {
        console.log(`   ✓ ${row.table_name}`);
      });
    } else {
      console.log('⚠️  Warning: Some tables may not have been created');
    }

    console.log('\n🎉 Master database initialization complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Server is running on http://localhost:5000');
    console.log('   2. Try registering a new organization');
    console.log('   3. Check server logs for tenant database creation');

  } catch (error) {
    console.error('❌ Failed to initialize master database:');
    console.error(error);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeMasterDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { initializeMasterDatabase };
