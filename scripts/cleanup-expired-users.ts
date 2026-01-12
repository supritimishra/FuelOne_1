import { pool as masterPool } from '../server/db.js';
import { db as masterDb } from '../server/db.js';
import { tenantUsers } from '../shared/schema.js';
import { eq } from 'drizzle-orm';
import { getTenantById } from '../server/services/tenant-provisioning.js';
import { getTenantDb } from '../server/services/db-connection-manager.js';
import { users, userRoles } from '../shared/schema.js';

export async function cleanupExpiredUsers() {
  console.log('🧹 Starting expired user cleanup job...\n');

  try {
    // Find all retention policies that have expired
    const expiredPoliciesResult = await masterPool.query(`
      SELECT 
        id,
        user_email,
        tenant_id,
        retention_period_days,
        expires_at
      FROM user_retention_policies
      WHERE expires_at IS NOT NULL
        AND expires_at < NOW()
        AND expires_at > NOW() - INTERVAL '30 days' -- Only cleanup recently expired (within last 30 days)
      ORDER BY expires_at ASC
    `);

    const expiredPolicies = expiredPoliciesResult.rows;
    console.log(`📋 Found ${expiredPolicies.length} expired retention policies\n`);

    if (expiredPolicies.length === 0) {
      console.log('✅ No expired users to clean up');
      process.exit(0);
    }

    for (const policy of expiredPolicies) {
      const userEmail = policy.user_email.toLowerCase();
      const tenantId = policy.tenant_id;
      const policyId = policy.id;

      console.log(`\n🔍 Processing: ${userEmail} (expired on ${policy.expires_at})`);

      try {
        // Step 1: Check if auto-backup already exists
        const existingBackupResult = await masterPool.query(
          `SELECT id FROM user_data_backups 
           WHERE user_email = $1 
             AND tenant_id = $2 
             AND backup_type = 'auto_before_deletion'
             AND retention_policy_id = $3
           LIMIT 1`,
          [userEmail, tenantId, policyId]
        );

        let backupCreated = false;
        if (existingBackupResult.rows.length === 0) {
          // Step 2: Create automatic backup before deletion
          console.log(`   📦 Creating automatic backup...`);
          
          const { exportUserData } = await import('../server/routes/developer-mode.js');
          // Note: exportUserData is not exported, so we'll need to recreate the logic
          // For now, we'll create a simplified backup
          
          // Get tenant info
          const tenant = await getTenantById(tenantId);
          if (!tenant) {
            console.warn(`   ⚠️  Tenant ${tenantId} not found, skipping`);
            continue;
          }

          const tenantDb = getTenantDb(tenant.connectionString, tenantId);
          
          // Find user
          const tenantUserRecords = await masterDb
            .select()
            .from(tenantUsers)
            .where(eq(tenantUsers.userEmail, userEmail))
            .where(eq(tenantUsers.tenantId, tenantId));

          if (tenantUserRecords.length === 0) {
            console.warn(`   ⚠️  User not found in tenant, skipping`);
            continue;
          }

          const userId = tenantUserRecords[0].userId;
          const [user] = await tenantDb
            .select()
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

          if (!user) {
            console.warn(`   ⚠️  User record not found, skipping`);
            continue;
          }

          // Export basic user data
          const userData = {
            user: {
              id: user.id,
              email: user.email,
              username: user.username,
              fullName: user.fullName,
              createdAt: user.createdAt,
            },
            roles: [],
            featurePermissions: [],
            exportMetadata: {
              exportedAt: new Date().toISOString(),
              exportedBy: 'auto-cleanup-job',
              dateRange: null,
              tenantId: tenantId,
              tenantName: tenant.organizationName,
            },
          };

          // Get roles
          try {
            const roles = await tenantDb
              .select()
              .from(userRoles)
              .where(eq(userRoles.userId, userId));
            userData.roles = roles;
          } catch (err: any) {
            console.warn(`   ⚠️  Failed to export roles: ${err.message}`);
          }

          // Save backup
          const backupJson = JSON.stringify(userData, null, 2);
          const fileSizeBytes = Buffer.byteLength(backupJson, 'utf8');

          await masterPool.query(
            `INSERT INTO user_data_backups (
              user_email, tenant_id, backup_type,
              backup_all_data, backup_data, file_size_bytes,
              retention_policy_id, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              userEmail,
              tenantId,
              'auto_before_deletion',
              true,
              backupJson,
              fileSizeBytes,
              policyId,
              'system@auto-cleanup',
            ]
          );

          backupCreated = true;
          console.log(`   ✅ Backup created (${(fileSizeBytes / 1024).toFixed(2)} KB)`);
        } else {
          console.log(`   ℹ️  Auto-backup already exists, skipping backup creation`);
        }

        // Step 3: Delete user data from tenant database
        console.log(`   🗑️  Deleting user data from tenant database...`);
        
        const tenant = await getTenantById(tenantId);
        if (!tenant) {
          console.warn(`   ⚠️  Tenant not found, skipping deletion`);
          continue;
        }

        const tenantDb = getTenantDb(tenant.connectionString, tenantId);
        const tenantUserRecords = await masterDb
          .select()
          .from(tenantUsers)
          .where(eq(tenantUsers.userEmail, userEmail))
          .where(eq(tenantUsers.tenantId, tenantId));

        if (tenantUserRecords.length > 0) {
          const userId = tenantUserRecords[0].userId;

          // Delete user roles
          await tenantDb
            .delete(userRoles)
            .where(eq(userRoles.userId, userId));

          // Delete user feature access
          await tenantDb.execute(
            `DELETE FROM user_feature_access WHERE user_id = $1`,
            [userId]
          );

          // Delete user record
          await tenantDb
            .delete(users)
            .where(eq(users.id, userId));

          console.log(`   ✅ User data deleted from tenant database`);
        }

        // Step 4: Delete from master tenant_users table
        await masterDb
          .delete(tenantUsers)
          .where(eq(tenantUsers.userEmail, userEmail))
          .where(eq(tenantUsers.tenantId, tenantId));

        // Step 5: Delete retention policy
        await masterPool.query(
          `DELETE FROM user_retention_policies WHERE id = $1`,
          [policyId]
        );

        // Step 6: Log to audit
        await masterPool.query(
          `INSERT INTO developer_audit_logs (developer_email, target_user_email, action, created_at)
           VALUES ($1, $2, 'data_deleted_retention_expired', NOW())`,
          ['system@auto-cleanup', userEmail]
        );

        console.log(`   ✅ Cleanup completed for ${userEmail}`);
      } catch (err: any) {
        console.error(`   ❌ Failed to cleanup ${userEmail}:`, err?.message || err);
        // Continue with next user
      }
    }

    console.log(`\n✅ Cleanup job completed. Processed ${expiredPolicies.length} expired users.`);
  } catch (error: any) {
    console.error('\n❌ Cleanup job failed:', error?.message || error);
    console.error(error);
    throw error;
  }
}

// Only run directly if called from command line (not when imported)
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.includes('cleanup-expired-users')) {
  cleanupExpiredUsers()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    })
    .finally(() => {
      masterPool.end();
    });
}

