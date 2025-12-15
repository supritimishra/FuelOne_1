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

async function verifyUserPermissions(email: string) {
  const pool = new Pool({
    connectionString: masterDbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const emailLower = email.toLowerCase();
    console.log(`\n🔍 Verifying Permissions for ${emailLower}\n`);

    // Get all tenant memberships for this email
    const membershipsResult = await pool.query(
      `SELECT tu.tenant_id, tu.user_id, t.organization_name, t.connection_string
       FROM tenant_users tu
       JOIN tenants t ON t.id = tu.tenant_id
       WHERE LOWER(tu.user_email) = $1
       ORDER BY t.organization_name`,
      [emailLower]
    );

    if (membershipsResult.rows.length === 0) {
      console.error(`❌ No tenant memberships found for ${emailLower}`);
      process.exit(1);
    }

    console.log(`📋 Found ${membershipsResult.rows.length} tenant membership(s):\n`);

    for (const membership of membershipsResult.rows) {
      const { tenant_id: tenantId, user_id: userId, organization_name: orgName, connection_string: conn } = membership;

      console.log(`${'='.repeat(60)}`);
      console.log(`🏢 Tenant: ${orgName || tenantId}`);
      console.log(`   Tenant ID: ${tenantId}`);
      console.log(`   User ID: ${userId}`);
      console.log(`${'='.repeat(60)}\n`);

      const tenantDb = drizzle(conn, { ssl: { rejectUnauthorized: false } });

      // Check feature catalog
      let catalogSize = 0;
      try {
        const catalog = await tenantDb.select().from(featurePermissions);
        catalogSize = catalog.length;
        console.log(`✅ Feature catalog: ${catalogSize} features`);
      } catch (e: any) {
        console.error(`❌ Feature catalog not found: ${e.message}`);
        continue;
      }

      // Check user overrides
      let overrideCount = 0;
      let enabledCount = 0;
      let disabledCount = 0;
      try {
        const overrides = await tenantDb
          .select()
          .from(userFeatureAccess)
          .where(eq(userFeatureAccess.userId, userId));
        
        overrideCount = overrides.length;
        enabledCount = overrides.filter((o: any) => o.allowed).length;
        disabledCount = overrides.filter((o: any) => o.allowed === false).length;
        
        console.log(`📋 User overrides: ${overrideCount} total (${enabledCount} enabled, ${disabledCount} disabled)`);
      } catch (e: any) {
        console.warn(`⚠️ Could not read overrides: ${e.message}`);
      }

      // Check dashboard specifically
      try {
        const dashboardFeature = await tenantDb
          .select()
          .from(featurePermissions)
          .where(eq(featurePermissions.featureKey, 'dashboard'))
          .limit(1);

        if (dashboardFeature.length > 0) {
          const featureId = dashboardFeature[0].id;
          const override = await tenantDb
            .select()
            .from(userFeatureAccess)
            .where(eq(userFeatureAccess.userId, userId))
            .where(eq(userFeatureAccess.featureId, featureId))
            .limit(1);

          console.log(`\n🔍 Dashboard Permission:`);
          if (override.length > 0) {
            const allowed = override[0].allowed;
            console.log(`   Override: ${allowed ? '✅ ENABLED' : '❌ DISABLED'} (allowed=${allowed})`);
          } else {
            const defaultEnabled = dashboardFeature[0].defaultEnabled;
            console.log(`   No override - using default: ${defaultEnabled ? '✅ ENABLED' : '❌ DISABLED'}`);
          }
        }
      } catch (e: any) {
        console.warn(`⚠️ Could not check dashboard: ${e.message}`);
      }

      // Simulate API response
      console.log(`\n🧪 Simulated /api/features/me response:`);
      try {
        const catalog = await tenantDb.select().from(featurePermissions);
        const overrides = await tenantDb
          .select()
          .from(userFeatureAccess)
          .where(eq(userFeatureAccess.userId, userId));

        const overrideMap = new Map<string, any>();
        overrides.forEach((o: any) => overrideMap.set(o.featureId, o));

        const features = catalog.map((f: any) => {
          const override = overrideMap.get(f.id);
          const allowed = override !== undefined ? Boolean(override.allowed) : Boolean(f.defaultEnabled);
          return { featureKey: f.featureKey, allowed };
        });

        const enabledFeatures = features.filter((f: any) => f.allowed).length;
        const disabledFeatures = features.filter((f: any) => !f.allowed).length;
        console.log(`   Total features: ${features.length}`);
        console.log(`   Enabled: ${enabledFeatures}`);
        console.log(`   Disabled: ${disabledFeatures}`);

        const dashboard = features.find((f: any) => f.featureKey?.toLowerCase() === 'dashboard');
        if (dashboard) {
          console.log(`   Dashboard: ${dashboard.allowed ? '✅ ENABLED' : '❌ DISABLED'}`);
        }
      } catch (e: any) {
        console.error(`❌ Could not simulate API response: ${e.message}`);
      }

      console.log(``);
    }

    console.log(`\n✅ Verification complete for ${emailLower}`);
    await pool.end();
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run for Jay and Rick
const usersToCheck = ['jay@gmail.com', 'rickh5054@gmail.com'];

(async () => {
  for (const email of usersToCheck) {
    await verifyUserPermissions(email);
  }
})();

