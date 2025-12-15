import { pool } from '../server/db.js';
import fs from 'fs';
import path from 'path';

async function runRetentionMigration() {
  console.log('🚀 Running retention policies migration on master database...\n');

  try {
    // Read migration file
    const migrationPath = path.resolve(process.cwd(), 'migrations/20250103_add_retention_policies.sql');
    
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
    console.log('✅ user_retention_policies table created in master database');
    console.log('✅ user_data_backups table created in master database');
    console.log('✅ Indexes created');
    
    // Verify tables exist
    const verifyResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_retention_policies'
      ) as retention_exists,
      EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_data_backups'
      ) as backups_exists;
    `);
    
    if (verifyResult.rows[0]?.retention_exists && verifyResult.rows[0]?.backups_exists) {
      console.log('\n✅ Verification: Tables exist and are ready to use');
    } else {
      console.warn('\n⚠️  Warning: Some tables may not have been created');
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

runRetentionMigration();

