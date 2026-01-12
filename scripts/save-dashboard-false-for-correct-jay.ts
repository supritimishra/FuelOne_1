import { Pool } from 'pg';
import { config } from 'dotenv';
import path from 'path';
import { userFeatureAccess, featurePermissions } from '../shared/schema.js';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';

config({ path: path.resolve(process.cwd(), '.local.env') });

const masterDbUrl = process.env.DATABASE_URL;

if (!masterDbUrl) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

async function saveDashboardFalse() {
  const pool = new Pool({
    connectionString: masterDbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // Dev's tenant
    const devTenantId = '1cde4287-730a-42b6-a3b7-7a2aed67fd1c';
    const tenantResult = await pool.query(
      `SELECT connection_string FROM tenants WHERE id = $1`,
      [devTenantId]
    );

    if (tenantResult.rows.length === 0) {
      console.error('❌ Dev tenant not found');
      process.exit(1);
    }

    const tenantDb = drizzle(tenantResult.rows[0].connection_string, { ssl: { rejectUnauthorized: false } });

    // Correct Jay's user ID in dev's tenant
    const correctJayId = '5107fa7f-0679-4a9e-8b2e-b13c7b5aee34';
    
    console.log(`\n🔍 Finding dashboard feature and setting allowed=false for Jay (${correctJayId})...\n`);

    // Get dashboard feature ID
    const dashboardFeatures = await tenantDb
      .select()
      .from(featurePermissions)
      .where(eq(featurePermissions.featureKey, 'dashboard'))
      .limit(1);

    if (dashboardFeatures.length === 0) {
      console.error('❌ Dashboard feature not found');
      process.exit(1);
    }

    const dashboardFeatureId = dashboardFeatures[0].id;
    console.log(`✅ Found dashboard feature: ${dashboardFeatureId}\n`);

    // Delete existing override
    await tenantDb
      .delete(userFeatureAccess)
      .where(eq(userFeatureAccess.userId, correctJayId))
      .where(eq(userFeatureAccess.featureId, dashboardFeatureId));

    console.log(`✅ Deleted existing override (if any)\n`);

    // Insert new override with allowed=false
    await tenantDb.insert(userFeatureAccess).values({
      userId: correctJayId,
      featureId: dashboardFeatureId,
      allowed: false,
    });

    console.log(`✅ Saved dashboard override: allowed=false for user ${correctJayId}\n`);

    // Verify
    const verify = await tenantDb
      .select()
      .from(userFeatureAccess)
      .where(eq(userFeatureAccess.userId, correctJayId))
      .where(eq(userFeatureAccess.featureId, dashboardFeatureId))
      .limit(1);

    if (verify.length > 0) {
      console.log(`✅ Verification: Dashboard override exists`);
      console.log(`   Allowed: ${verify[0].allowed}`);
      console.log(`\n🎉 Done! Jay (${correctJayId}) should now have dashboard disabled.`);
      console.log(`   Jay needs to log out and log back in to see the change.`);
    } else {
      console.error('❌ Verification failed - override not found after insert');
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

saveDashboardFalse();

