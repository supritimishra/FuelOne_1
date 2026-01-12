import { Pool } from 'pg';
import { config } from 'dotenv';
import path from 'path';
import { drizzle } from 'drizzle-orm/node-postgres';
import { featurePermissions, userFeatureAccess, users } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

config({ path: path.resolve(process.cwd(), '.local.env') });

const masterDbUrl = process.env.DATABASE_URL;

if (!masterDbUrl) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

async function testActualAPIResponse() {
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

    // Find Jay by email (same as server login logic)
    const jayEmail = 'jay@gmail.com';
    const userResult = await tenantDb
      .select()
      .from(users)
      .where(eq(users.email, jayEmail))
      .limit(1);

    if (userResult.length === 0) {
      console.error(`❌ User ${jayEmail} not found in tenant`);
      process.exit(1);
    }

    const jayUser = userResult[0];
    const jayUserId = jayUser.id;

    console.log(`\n🔍 Testing API response for Jay:`);
    console.log(`   Email: ${jayEmail}`);
    console.log(`   User ID: ${jayUserId}`);
    console.log(`   Tenant: ${tenant.organization_name}\n`);

    // Load catalog (exact server logic)
    const catalog = await tenantDb.select().from(featurePermissions);
    console.log(`✅ Catalog loaded: ${catalog.length} features\n`);

    // Load overrides (exact server logic)
    const overrides = await tenantDb
      .select()
      .from(userFeatureAccess)
      .where(eq(userFeatureAccess.userId, jayUserId));

    console.log(`✅ Overrides loaded: ${overrides.length} found\n`);

    // Build override map (exact server logic)
    const overrideMap = new Map<string, any>();
    overrides.forEach((row: any) => {
      overrideMap.set(row.featureId, row);
    });

    // Build features array (exact server logic from feature-access.ts)
    const features = catalog.map((feature: any) => {
      const override = overrideMap.get(feature.id);
      
      // EXACT SERVER LOGIC (from feature-access.ts lines 155-170)
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
        label: feature.label,
        featureGroup: feature.featureGroup,
        description: feature.description,
        defaultEnabled: Boolean(feature.defaultEnabled),
        allowed,
      };
    });

    const enabledFeatures = features.filter(f => f.allowed);
    const disabledFeatures = features.filter(f => !f.allowed);

    console.log(`📊 API Response Summary:`);
    console.log(`   Total features: ${features.length}`);
    console.log(`   ✅ Enabled: ${enabledFeatures.length}`);
    console.log(`   ❌ Disabled: ${disabledFeatures.length}\n`);

    // Check dashboard
    const dashboard = features.find(f => f.featureKey?.toLowerCase() === 'dashboard');
    if (dashboard) {
      console.log(`🔍 Dashboard:`);
      console.log(`   Allowed: ${dashboard.allowed}`);
      console.log(`   Default Enabled: ${dashboard.defaultEnabled}`);
      const dashboardOverride = overrideMap.get(catalog.find(f => f.featureKey?.toLowerCase() === 'dashboard')?.id || '');
      console.log(`   Override: ${dashboardOverride ? `EXISTS (allowed=${dashboardOverride.allowed})` : 'NONE'}\n`);
    }

    // Show sample of enabled vs disabled
    console.log(`📋 Sample Enabled Features (first 10):`);
    enabledFeatures.slice(0, 10).forEach(f => {
      console.log(`   ✅ ${f.featureKey}`);
    });
    
    if (disabledFeatures.length > 0) {
      console.log(`\n📋 Disabled Features:`);
      disabledFeatures.forEach(f => {
        console.log(`   ❌ ${f.featureKey}`);
      });
    }

    // Simulate the API JSON response
    const apiResponse = {
      ok: true,
      features: features,
      migrationsRun: true
    };

    console.log(`\n📦 Simulated API Response JSON:`);
    console.log(`   Total features in response: ${apiResponse.features.length}`);
    console.log(`   Enabled count: ${enabledFeatures.length}`);
    
    // Check if all are disabled
    if (enabledFeatures.length === 0) {
      console.log(`\n❌❌❌ PROBLEM: All features are disabled in API response!`);
      console.log(`   This explains why Jay sees "No Access" page.`);
      console.log(`   Expected: ${catalog.length - 1} enabled (all except dashboard)`);
      
      // Debug: Check what's wrong
      console.log(`\n🔍 Debugging why all are disabled:`);
      const featuresWithOverrides = features.filter(f => {
        const feature = catalog.find(c => c.featureKey?.toLowerCase() === f.featureKey?.toLowerCase());
        return feature && overrideMap.has(feature.id);
      });
      console.log(`   Features with overrides: ${featuresWithOverrides.length}`);
      featuresWithOverrides.forEach(f => {
        const override = overrideMap.get(catalog.find(c => c.featureKey?.toLowerCase() === f.featureKey?.toLowerCase())?.id || '');
        console.log(`     ${f.featureKey}: override.allowed=${override?.allowed}, final=${f.allowed}`);
      });
      
      const featuresWithoutOverrides = features.filter(f => {
        const feature = catalog.find(c => c.featureKey?.toLowerCase() === f.featureKey?.toLowerCase());
        return feature && !overrideMap.has(feature.id);
      });
      console.log(`   Features without overrides: ${featuresWithoutOverrides.length}`);
      const sampleWithoutOverride = featuresWithoutOverrides.slice(0, 5);
      sampleWithoutOverride.forEach(f => {
        const catFeature = catalog.find(c => c.featureKey?.toLowerCase() === f.featureKey?.toLowerCase());
        console.log(`     ${f.featureKey}: defaultEnabled=${catFeature?.defaultEnabled}, final=${f.allowed}`);
      });
    } else {
      console.log(`\n✅ API response is correct: ${enabledFeatures.length} enabled`);
      console.log(`   Jay should NOT see "No Access" page.`);
      console.log(`   If Jay sees it, the problem is:`);
      console.log(`   1. Server is querying wrong tenant/user ID, OR`);
      console.log(`   2. Browser is caching old response, OR`);
      console.log(`   3. Frontend is misreading the response`);
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testActualAPIResponse();

