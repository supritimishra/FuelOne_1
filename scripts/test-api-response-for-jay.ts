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

async function testAPIResponse() {
  const pool = new Pool({
    connectionString: masterDbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const jayTenantId = 'f1f5c217-7b39-4031-9d76-b7da090bad65';
    const tenantResult = await pool.query(
      `SELECT connection_string, organization_name FROM tenants WHERE id = $1`,
      [jayTenantId]
    );

    if (tenantResult.rows.length === 0) {
      console.error('❌ Tenant not found');
      process.exit(1);
    }

    const tenant = tenantResult.rows[0];
    const tenantDb = drizzle(tenant.connection_string, { ssl: { rejectUnauthorized: false } });
    const jayUserId = '235e168e-274a-45bd-9322-e81643263a81';

    console.log(`\n🔍 Testing API response logic for Jay (${jayUserId}) in tenant "${tenant.organization_name}"\n`);

    // Load catalog
    const catalog = await tenantDb.select().from(featurePermissions);
    console.log(`✅ Catalog: ${catalog.length} features\n`);

    // Load overrides  
    const overrides = await tenantDb
      .select()
      .from(userFeatureAccess)
      .where(eq(userFeatureAccess.userId, jayUserId));

    console.log(`✅ Overrides: ${overrides.length} found\n`);

    // Show all overrides
    if (overrides.length > 0) {
      console.log(`📋 All overrides:`);
      for (const override of overrides) {
        const feature = catalog.find(f => f.id === override.featureId);
        console.log(`   ${feature?.featureKey || 'unknown'}: allowed=${override.allowed} (type: ${typeof override.allowed})`);
      }
      console.log('');
    }

    // Build override map
    const overrideMap = new Map<string, any>();
    overrides.forEach((row: any) => {
      overrideMap.set(row.featureId, row);
    });

    // Build features array (same logic as server)
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

    const enabledFeatures = features.filter(f => f.allowed);
    const disabledFeatures = features.filter(f => !f.allowed);

    console.log(`📊 API Response Summary:`);
    console.log(`   Total features: ${features.length}`);
    console.log(`   Enabled: ${enabledFeatures.length}`);
    console.log(`   Disabled: ${disabledFeatures.length}\n`);

    // Check dashboard
    const dashboard = features.find(f => f.featureKey?.toLowerCase() === 'dashboard');
    if (dashboard) {
      console.log(`🔍 Dashboard:`);
      console.log(`   Allowed: ${dashboard.allowed}`);
      console.log(`   Default Enabled: ${dashboard.defaultEnabled}`);
      console.log(`   Override exists: ${overrideMap.has(catalog.find(f => f.featureKey?.toLowerCase() === 'dashboard')?.id || '')}\n`);
    }

    if (enabledFeatures.length === 0) {
      console.log(`\n❌❌❌ PROBLEM FOUND: All features are disabled!`);
      console.log(`   This is why Jay sees "No Access" page.`);
      console.log(`   Expected: ${catalog.length - 1} enabled (all except dashboard)`);
      
      // Check why
      console.log(`\n🔍 Debugging why all are disabled:`);
      const featuresWithOverrides = features.filter(f => {
        const feature = catalog.find(c => c.featureKey?.toLowerCase() === f.featureKey?.toLowerCase());
        return feature && overrideMap.has(feature.id);
      });
      const featuresWithoutOverrides = features.filter(f => {
        const feature = catalog.find(c => c.featureKey?.toLowerCase() === f.featureKey?.toLowerCase());
        return feature && !overrideMap.has(feature.id);
      });
      
      console.log(`   Features with overrides: ${featuresWithOverrides.length}`);
      console.log(`   Features without overrides: ${featuresWithoutOverrides.length}`);
      
      // Check defaultEnabled values
      const defaultEnabledFeatures = catalog.filter(f => f.defaultEnabled);
      console.log(`   Features with defaultEnabled=true: ${defaultEnabledFeatures.length}`);
      
      // Check if features without overrides are using defaultEnabled correctly
      const sampleWithoutOverride = featuresWithoutOverrides.slice(0, 5);
      console.log(`\n   Sample features without override (first 5):`);
      sampleWithoutOverride.forEach(f => {
        const catFeature = catalog.find(c => c.featureKey?.toLowerCase() === f.featureKey?.toLowerCase());
        console.log(`     ${f.featureKey}: allowed=${f.allowed}, defaultEnabled=${catFeature?.defaultEnabled}`);
      });
    } else {
      console.log(`\n✅ Features correctly enabled: ${enabledFeatures.length} enabled, ${disabledFeatures.length} disabled`);
      console.log(`   Jay should NOT see "No Access" page.`);
      console.log(`   If Jay sees it, check browser console for the actual API response.`);
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testAPIResponse();

