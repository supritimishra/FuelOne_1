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

async function simulateFeatureAccessAPI() {
  const pool = new Pool({
    connectionString: masterDbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const jayTenantId = 'f1f5c217-7b39-4031-9d76-b7da090bad65';
    const tenantResult = await pool.query(
      `SELECT connection_string FROM tenants WHERE id = $1`,
      [jayTenantId]
    );

    if (tenantResult.rows.length === 0) {
      console.error('❌ Tenant not found');
      process.exit(1);
    }

    const tenantDb = drizzle(tenantResult.rows[0].connection_string, { ssl: { rejectUnauthorized: false } });
    const jayUserId = '235e168e-274a-45bd-9322-e81643263a81';

    console.log(`\n🔍 Simulating /api/features/me for Jay...\n`);

    // Load catalog (same as server)
    const catalog = await tenantDb.select().from(featurePermissions);
    console.log(`✅ Loaded ${catalog.length} features from catalog\n`);

    // Load overrides (same as server)
    const overrides = await tenantDb
      .select()
      .from(userFeatureAccess)
      .where(eq(userFeatureAccess.userId, jayUserId));

    console.log(`✅ Loaded ${overrides.length} overrides for Jay\n`);

    // Build override map (same as server)
    const overrideMap = new Map<string, any>();
    overrides.forEach((row: any) => {
      overrideMap.set(row.featureId, row);
    });

    // Check dashboard specifically
    const dashboardFeature = catalog.find((f: any) => f.featureKey?.toLowerCase() === 'dashboard');
    if (dashboardFeature) {
      const dashboardOverride = overrideMap.get(dashboardFeature.id);
      console.log(`🔍 Dashboard:`);
      console.log(`   Feature ID: ${dashboardFeature.id}`);
      console.log(`   Default Enabled: ${dashboardFeature.defaultEnabled}`);
      console.log(`   Override: ${dashboardOverride ? `EXISTS (allowed=${dashboardOverride.allowed})` : 'NOT FOUND'}`);
      
      // Apply same logic as server
      let allowed: boolean;
      if (dashboardOverride !== undefined) {
        const overrideValue = dashboardOverride.allowed;
        if (overrideValue === false || overrideValue === 'false' || overrideValue === 0) {
          allowed = false;
        } else if (overrideValue === true || overrideValue === 'true' || overrideValue === 1) {
          allowed = true;
        } else {
          allowed = Boolean(overrideValue);
        }
      } else {
        allowed = Boolean(dashboardFeature.defaultEnabled);
      }
      console.log(`   Final allowed: ${allowed}\n`);
    }

    // Map all features (same as server)
    const features = catalog.map((feature: any) => {
      const override = overrideMap.get(feature.id);
      
      let allowed: boolean;
      if (override !== undefined) {
        const overrideValue = override.allowed;
        if (overrideValue === false || overrideValue === 'false' || overrideValue === 0) {
          allowed = false;
        } else if (overrideValue === true || overrideValue === 'true' || overrideValue === 1) {
          allowed = true;
        } else {
          allowed = Boolean(overrideValue);
        }
      } else {
        allowed = Boolean(feature.defaultEnabled);
      }
      
      return {
        featureKey: feature.featureKey,
        allowed,
        defaultEnabled: Boolean(feature.defaultEnabled),
      };
    });

    const enabledCount = features.filter((f: any) => f.allowed).length;
    const disabledCount = features.filter((f: any) => !f.allowed).length;

    console.log(`📊 Simulated API Response:`);
    console.log(`   Total features: ${features.length}`);
    console.log(`   Enabled: ${enabledCount}`);
    console.log(`   Disabled: ${disabledCount}\n`);

    // Check dashboard in result
    const dashboardResult = features.find((f: any) => f.featureKey?.toLowerCase() === 'dashboard');
    if (dashboardResult) {
      console.log(`✅ Dashboard in result: allowed=${dashboardResult.allowed}`);
      if (dashboardResult.allowed === false) {
        console.log(`   ✅ Correctly disabled`);
      } else {
        console.log(`   ❌ Should be false but is true!`);
      }
    }

    // Check first 10 features
    console.log(`\n📋 First 10 features in result:`);
    features.slice(0, 10).forEach((f: any) => {
      const status = f.allowed ? '✅' : '❌';
      console.log(`   ${status} ${f.featureKey.padEnd(30)} allowed=${f.allowed}`);
    });

    if (enabledCount === 0) {
      console.log(`\n❌❌❌ PROBLEM: All features are disabled!`);
      console.log(`   This explains why Jay sees "No Access" page.`);
      console.log(`   Expected: ${catalog.length - 1} enabled (all except dashboard)`);
      console.log(`   Actual: ${enabledCount} enabled`);
    } else if (enabledCount === catalog.length) {
      console.log(`\n❌❌❌ PROBLEM: All features are enabled (including dashboard)!`);
    } else {
      console.log(`\n✅ Expected: Dashboard disabled, ${catalog.length - 1} other features enabled`);
      console.log(`   Actual: ${enabledCount} enabled (should be ${catalog.length - 1})`);
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

simulateFeatureAccessAPI();

