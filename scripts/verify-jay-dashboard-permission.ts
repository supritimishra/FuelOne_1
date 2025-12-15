import { Pool } from 'pg';
import { config } from 'dotenv';
import path from 'path';
import { drizzle } from 'drizzle-orm/node-postgres';
import { featurePermissions, userFeatureAccess } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

config({ path: path.resolve(process.cwd(), '.local.env') });

const masterDbUrl = process.env.DATABASE_URL;

if (!masterDbUrl) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

async function verifyJayDashboardPermission() {
  const pool = new Pool({
    connectionString: masterDbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // Jay's actual tenant (where he logs in)
    const jayTenantId = 'f1f5c217-7b39-4031-9d76-b7da090bad65';
    const jayUserId = '235e168e-274a-45bd-9322-e81643263a81'; // Jay's actual user ID
    
    console.log(`\n🔍 Verifying Dashboard Permission for Jay\n`);
    console.log(`   Tenant ID: ${jayTenantId}`);
    console.log(`   User ID: ${jayUserId}\n`);

    const tenantResult = await pool.query(
      `SELECT connection_string, organization_name FROM tenants WHERE id = $1`,
      [jayTenantId]
    );

    if (tenantResult.rows.length === 0) {
      console.error('❌ Jay tenant not found');
      process.exit(1);
    }

    const tenant = tenantResult.rows[0];
    console.log(`✅ Tenant: ${tenant.organization_name}\n`);

    const tenantDb = drizzle(tenant.connection_string, { ssl: { rejectUnauthorized: false } });

    // Get dashboard feature
    const dashboardFeatures = await tenantDb
      .select()
      .from(featurePermissions)
      .where(eq(featurePermissions.featureKey, 'dashboard'))
      .limit(1);

    if (dashboardFeatures.length === 0) {
      console.error('❌ Dashboard feature not found in catalog');
      process.exit(1);
    }

    const dashboardFeature = dashboardFeatures[0];
    console.log(`✅ Dashboard Feature:`);
    console.log(`   Feature ID: ${dashboardFeature.id}`);
    console.log(`   Feature Key: ${dashboardFeature.featureKey}`);
    console.log(`   Default Enabled: ${dashboardFeature.defaultEnabled}\n`);

    // Check for override
    const overrides = await tenantDb
      .select()
      .from(userFeatureAccess)
      .where(eq(userFeatureAccess.userId, jayUserId))
      .where(eq(userFeatureAccess.featureId, dashboardFeature.id))
      .limit(1);

    console.log(`📋 Dashboard Override Status:`);
    if (overrides.length > 0) {
      const override = overrides[0];
      console.log(`   ✅ OVERRIDE EXISTS`);
      console.log(`   Override ID: ${override.id}`);
      console.log(`   User ID: ${override.userId}`);
      console.log(`   Feature ID: ${override.featureId}`);
      console.log(`   Allowed: ${override.allowed} (type: ${typeof override.allowed})`);
      console.log(`   Created: ${override.createdAt}`);
      console.log(`   Updated: ${override.updatedAt}\n`);
      
      // Calculate what the API should return
      const finalAllowed = Boolean(override.allowed);
      console.log(`📊 Expected API Response:`);
      console.log(`   Dashboard should be: ${finalAllowed ? '✅ ENABLED' : '❌ DISABLED'}`);
      
      if (finalAllowed) {
        console.log(`\n⚠️⚠️⚠️ PROBLEM: Dashboard is ENABLED in database!`);
        console.log(`   Jay should NOT see Dashboard, but override.allowed=${override.allowed}`);
        console.log(`   The Developer Mode save did NOT work correctly.\n`);
      } else {
        console.log(`\n✅ CORRECT: Dashboard is DISABLED in database`);
        console.log(`   If Jay still sees Dashboard, the issue is:`);
        console.log(`   1. Frontend caching old response`);
        console.log(`   2. Frontend not reading allowed=false correctly`);
        console.log(`   3. Jay's browser needs hard refresh (Ctrl+Shift+R)\n`);
      }
    } else {
      console.log(`   ❌ NO OVERRIDE EXISTS`);
      console.log(`   Dashboard should use default: ${dashboardFeature.defaultEnabled}\n`);
      console.log(`📊 Expected API Response:`);
      console.log(`   Dashboard should be: ${dashboardFeature.defaultEnabled ? '✅ ENABLED (default)' : '❌ DISABLED (default)'}\n`);
      console.log(`⚠️⚠️⚠️ PROBLEM: No override found!`);
      console.log(`   This means Developer Mode did NOT save the permission to Jay's tenant database.`);
      console.log(`   Check server logs when you saved in Developer Mode to see which tenant it saved to.\n`);
    }

    // Also check ALL overrides for Jay
    const allOverrides = await tenantDb
      .select()
      .from(userFeatureAccess)
      .where(eq(userFeatureAccess.userId, jayUserId));

    console.log(`📋 All Overrides for Jay:`);
    console.log(`   Total overrides: ${allOverrides.length}`);
    
    if (allOverrides.length > 0) {
      const enabledCount = allOverrides.filter((o: any) => o.allowed).length;
      const disabledCount = allOverrides.filter((o: any) => o.allowed === false).length;
      console.log(`   Enabled: ${enabledCount}`);
      console.log(`   Disabled: ${disabledCount}\n`);
      
      // Check dashboard specifically
      const dashboardOverride = allOverrides.find((o: any) => o.featureId === dashboardFeature.id);
      if (dashboardOverride) {
        console.log(`   Dashboard override: allowed=${dashboardOverride.allowed}`);
      } else {
        console.log(`   Dashboard override: NOT FOUND`);
      }
    } else {
      console.log(`   ⚠️ NO OVERRIDES FOUND for Jay!`);
      console.log(`   Developer Mode did NOT save any permissions to Jay's tenant.\n`);
    }

    // Simulate what the API should return
    console.log(`\n🧪 Simulating /api/features/me for Jay:`);
    const allFeatures = await tenantDb.select().from(featurePermissions);
    console.log(`   Total features in catalog: ${allFeatures.length}`);
    
    const overrideMap = new Map<string, any>();
    allOverrides.forEach((o: any) => {
      overrideMap.set(o.featureId, o);
    });

    const dashboardResult = allFeatures
      .map((f: any) => {
        const override = overrideMap.get(f.id);
        const allowed = override !== undefined ? Boolean(override.allowed) : Boolean(f.defaultEnabled);
        return { featureKey: f.featureKey, allowed, hasOverride: override !== undefined };
      })
      .find((f: any) => f.featureKey === 'dashboard');

    if (dashboardResult) {
      console.log(`   Dashboard in API response:`);
      console.log(`      Feature Key: ${dashboardResult.featureKey}`);
      console.log(`      Allowed: ${dashboardResult.allowed}`);
      console.log(`      Has Override: ${dashboardResult.hasOverride}`);
      console.log(`\n   Expected: Dashboard should be ${dashboardResult.allowed ? 'VISIBLE' : 'HIDDEN'} in sidebar\n`);
    }

    await pool.end();
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

verifyJayDashboardPermission();

