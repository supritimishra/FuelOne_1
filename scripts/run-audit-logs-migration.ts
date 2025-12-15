import { pool } from '../server/db.js';
import fs from 'fs';
import path from 'path';

async function runAuditLogsMigration() {
  console.log('🚀 Running audit logs migration on master database...\n');

  try {
    // Read migration file
    const migrationPath = path.resolve(process.cwd(), 'migrations/20250102_add_audit_logs.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Migration file not found: ${migrationPath}`);
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    console.log(`✅ Migration file loaded: ${migrationPath}\n`);

    // Execute migration
    console.log('📝 Executing migration...');
    await pool.query(migrationSQL);
    
    console.log('✅ Migration applied successfully!\n');
    console.log('✅ developer_audit_logs table created in master database');
    console.log('✅ Indexes created');
    
    // Verify table exists
    const verifyResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'developer_audit_logs'
      );
    `);
    
    if (verifyResult.rows[0]?.exists) {
      console.log('\n✅ Verification: Table exists and is ready to use');
    } else {
      console.warn('\n⚠️  Warning: Table verification failed - table may not have been created');
    }

    process.exit(0);
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    
    // Check if it's a non-fatal error (table already exists)
    if (/already exists|duplicate/i.test(errorMsg)) {
      console.warn(`⚠️  Migration skipped: ${errorMsg}`);
      console.log('ℹ️  Table or index already exists - this is okay\n');
      process.exit(0);
    }
    
    console.error('\n❌ Migration failed:', errorMsg);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runAuditLogsMigration();

