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

async function saveDashboardFalseForLoggedInJay() {
  const pool = new Pool({
    connectionString: masterDbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // Jay's tenant (where the logged-in Jay is from)
    const jayTenantId = 'f1f5c217-7b39-4031-9d76-b7da090bad65';
    const tenantResult = await pool.query(
      `SELECT connection_string, organization_name FROM tenants WHERE id = $1`,
      [jayTenantId]
    );

    if (tenantResult.rows.length === 0) {
      console.error('❌ Jay tenant not found');
      process.exit(1);
    }

    const tenant = tenantResult.rows[0];
    console.log(`\n📊 Tenant: ${tenant.organization_name}`);
    console.log(`   Tenant ID: ${jayTenantId}\n`);

    const tenantDb = drizzle(tenant.connection_string, { ssl: { rejectUnauthorized: false } });

    // Logged-in Jay's user ID
    const loggedInJayId = '235e168e-274a-45bd-9322-e81643263a81';
    
    console.log(`🔍 Setting dashboard allowed=false for logged-in Jay (${loggedInJayId})...\n`);

    // Get dashboard feature ID
    const dashboardFeatures = await tenantDb
      .select()
      .from(featurePermissions)
      .where(eq(featurePermissions.featureKey, 'dashboard'))
      .limit(1);

    if (dashboardFeatures.length === 0) {
      console.error('❌ Dashboard feature not found in Jay\'s tenant');
      process.exit(1);
    }

    const dashboardFeatureId = dashboardFeatures[0].id;
    console.log(`✅ Found dashboard feature: ${dashboardFeatureId}\n`);

    // Delete existing override
    await tenantDb
      .delete(userFeatureAccess)
      .where(eq(userFeatureAccess.userId, loggedInJayId))
      .where(eq(userFeatureAccess.featureId, dashboardFeatureId));

    console.log(`✅ Deleted existing override (if any)\n`);

    // Insert new override with allowed=false
    await tenantDb.insert(userFeatureAccess).values({
      userId: loggedInJayId,
      featureId: dashboardFeatureId,
      allowed: false,
    });

    console.log(`✅ Saved dashboard override: allowed=false for user ${loggedInJayId}\n`);

    // Verify
    const verify = await tenantDb
      .select()
      .from(userFeatureAccess)
      .where(eq(userFeatureAccess.userId, loggedInJayId))
      .where(eq(userFeatureAccess.featureId, dashboardFeatureId))
      .limit(1);

    if (verify.length > 0) {
      console.log(`✅ Verification: Dashboard override exists`);
      console.log(`   User ID: ${verify[0].userId}`);
      console.log(`   Feature ID: ${verify[0].featureId}`);
      console.log(`   Allowed: ${verify[0].allowed} (type: ${typeof verify[0].allowed})`);
      console.log(`\n🎉 Done! Logged-in Jay (${loggedInJayId}) should now have dashboard disabled.`);
      console.log(`   Jay needs to refresh the browser (F5) to see the change.`);
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

saveDashboardFalseForLoggedInJay();

