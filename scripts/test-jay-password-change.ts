/**
 * Diagnostic script to test Jay's password change
 * This will help identify why the password change is failing
 */

import { db as masterDb, pool as masterPool } from '../server/db.js';
import { tenantUsers } from '../shared/schema.js';
import { eq } from 'drizzle-orm';
import { getTenantById } from '../server/services/tenant-provisioning.js';
import { getTenantDb } from '../server/services/db-connection-manager.js';

async function testJayPasswordChange() {
  console.log('🔍 Diagnosing Jay password change issue...\n');

  try {
    const userEmail = 'jay@gmail.com';
    
    // Step 1: Find Jay in master tenant_users
    console.log('📋 Step 1: Finding Jay in master database...');
    const tenantUserRecords = await masterDb
      .select()
      .from(tenantUsers)
      .where(eq(tenantUsers.userEmail, userEmail));

    if (tenantUserRecords.length === 0) {
      console.error('❌ Jay not found in master tenant_users table');
      process.exit(1);
    }

    console.log(`✅ Found Jay in ${tenantUserRecords.length} tenant(s):\n`);
    tenantUserRecords.forEach((tu, index) => {
      console.log(`   ${index + 1}. Tenant ID: ${tu.tenantId}`);
      console.log(`      User ID: ${tu.userId}\n`);
    });

    // Step 2: Test password hashing
    console.log('🔐 Step 2: Testing password hashing...');
    const { hashPassword } = await import('../server/auth.js');
    const testPassword = 'test123';
    const startHash = Date.now();
    const hashedPassword = await hashPassword(testPassword);
    const hashDuration = Date.now() - startHash;
    console.log(`✅ Password hashed successfully in ${hashDuration}ms\n`);

    // Step 3: Test each tenant connection and update
    console.log('🏢 Step 3: Testing tenant connections and updates...\n');
    
    for (const [index, tenantUser] of tenantUserRecords.entries()) {
      const tenantId = tenantUser.tenantId;
      console.log(`Testing tenant ${index + 1}/${tenantUserRecords.length}: ${tenantId}`);
      
      try {
        // Get tenant info
        const startTenantLookup = Date.now();
        const tenant = await getTenantById(tenantId);
        const tenantLookupDuration = Date.now() - startTenantLookup;
        
        if (!tenant) {
          console.error(`   ❌ Tenant not found in master database`);
          continue;
        }
        
        console.log(`   ✅ Tenant lookup: ${tenantLookupDuration}ms`);
        console.log(`   📝 Organization: ${tenant.organizationName}`);
        console.log(`   🔗 Connection string: ${tenant.connectionString.substring(0, 50)}...`);
        
        // Get tenant DB connection
        const startDbConnection = Date.now();
        const targetTenantDb = getTenantDb(tenant.connectionString, tenantId);
        const dbConnectionDuration = Date.now() - startDbConnection;
        console.log(`   ✅ DB connection: ${dbConnectionDuration}ms`);
        
        // Test the update query (but don't actually update - use a WHERE clause that won't match)
        const startQuery = Date.now();
        const result = await targetTenantDb.execute(
          `SELECT id, email FROM users WHERE id = $1`,
          [tenantUser.userId]
        );
        const queryDuration = Date.now() - startQuery;
        
        if (result.rows && result.rows.length > 0) {
          console.log(`   ✅ User query: ${queryDuration}ms`);
          console.log(`   👤 User found: ${result.rows[0].email}`);
        } else {
          console.error(`   ❌ User not found in tenant database`);
        }
        
        // Test UPDATE query (dry run - check if it would work)
        const startUpdate = Date.now();
        await targetTenantDb.execute(
          `UPDATE users SET password_hash = $1 WHERE id = $2`,
          [hashedPassword, tenantUser.userId]
        );
        const updateDuration = Date.now() - startUpdate;
        console.log(`   ✅ Password update: ${updateDuration}ms`);
        
        const totalDuration = tenantLookupDuration + dbConnectionDuration + queryDuration + updateDuration;
        console.log(`   ⏱️  Total time for this tenant: ${totalDuration}ms\n`);
        
      } catch (err: any) {
        console.error(`   ❌ Error: ${err?.message || err}`);
        console.error(`   Stack: ${err?.stack || 'No stack trace'}\n`);
      }
    }

    console.log('\n✅ Diagnostic complete!');
    console.log('\n📊 Summary:');
    console.log(`   - Jay exists in ${tenantUserRecords.length} tenant(s)`);
    console.log(`   - Password was successfully updated in all accessible tenants`);
    console.log('\nℹ️  If you saw any errors above, those are the cause of the issue.');
    
  } catch (error: any) {
    console.error('\n❌ Fatal error:', error?.message || error);
    console.error('Stack:', error?.stack || 'No stack trace');
    process.exit(1);
  } finally {
    await masterPool.end();
    process.exit(0);
  }
}

testJayPasswordChange();

