import { db as masterDb, pool as masterPool } from '../server/db.js';
import { tenants } from '../shared/schema.js';
import { eq } from 'drizzle-orm';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

async function applyUserStatusMigration() {
  console.log('🚀 Applying user_status migration to all tenant databases...\n');

  try {
    // Get all active tenants
    const allTenants = await masterDb
      .select()
      .from(tenants)
      .where(eq(tenants.status, 'active'));

    console.log(`📋 Found ${allTenants.length} active tenants\n`);

    if (allTenants.length === 0) {
      console.log('⚠️  No active tenants found');
      await masterPool.end();
      process.exit(0);
    }

    // Read migration file
    const migrationPath = path.resolve(process.cwd(), 'migrations/20250103_add_user_status.sql');
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Migration file not found: ${migrationPath}`);
      await masterPool.end();
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    console.log(`✅ Migration file loaded\n`);

    // Apply to each tenant
    let successCount = 0;
    let failCount = 0;

    for (const tenant of allTenants) {
      const tenantPool = new Pool({
        connectionString: tenant.connectionString,
        ssl: { rejectUnauthorized: false },
      });
      
      try {
        console.log(`📝 Applying to tenant: ${tenant.organizationName} (${tenant.id})`);
        
        // Execute migration using raw pool query
        await tenantPool.query(migrationSQL);
        
        console.log(`   ✅ Success`);
        successCount++;
      } catch (err: any) {
        const errorMsg = err?.message || String(err);
        
        // Check if it's a non-fatal error (column already exists)
        if (/already exists|duplicate|column.*already/i.test(errorMsg)) {
          console.log(`   ⚠️  Column already exists (skipping)`);
          successCount++;
        } else {
          console.error(`   ❌ Failed: ${errorMsg}`);
          failCount++;
        }
      } finally {
        await tenantPool.end();
      }
    }

    console.log(`\n✅ Migration complete:`);
    console.log(`   Successful: ${successCount}`);
    console.log(`   Failed: ${failCount}`);
    console.log(`   Total: ${allTenants.length}`);

    await masterPool.end();
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error?.message || error);
    console.error(error);
    await masterPool.end();
    process.exit(1);
  }
}

applyUserStatusMigration();

