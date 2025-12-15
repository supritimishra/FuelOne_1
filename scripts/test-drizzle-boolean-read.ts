import { Pool } from 'pg';
import { config } from 'dotenv';
import path from 'path';
import { drizzle } from 'drizzle-orm/node-postgres';
import { userFeatureAccess } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

config({ path: path.resolve(process.cwd(), '.local.env') });

const masterDbUrl = process.env.DATABASE_URL;

if (!masterDbUrl) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

async function testDrizzleBooleanRead() {
  const pool = new Pool({
    connectionString: masterDbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // Jay's tenant
    const jayTenantId = 'f1f5c217-7b39-4031-9d76-b7da090bad65';
    const tenantResult = await pool.query(
      `SELECT connection_string FROM tenants WHERE id = $1`,
      [jayTenantId]
    );

    if (tenantResult.rows.length === 0) {
      console.error('❌ Jay tenant not found');
      process.exit(1);
    }

    const tenantDb = drizzle(tenantResult.rows[0].connection_string, { ssl: { rejectUnauthorized: false } });
    const loggedInJayId = '235e168e-274a-45bd-9322-e81643263a81';
    const dashboardFeatureId = '42b1b947-5482-4a7b-b6b2-15f9a25d765f';

    console.log(`\n🔍 Testing Drizzle boolean read...\n`);

    // Query using Drizzle (same as server does)
    const drizzleResult = await tenantDb
      .select()
      .from(userFeatureAccess)
      .where(eq(userFeatureAccess.userId, loggedInJayId));

    console.log(`✅ Drizzle query returned ${drizzleResult.length} overrides\n`);

    const dashboardOverride = drizzleResult.find((r: any) => r.featureId === dashboardFeatureId);

    if (dashboardOverride) {
      console.log(`📋 Dashboard Override from Drizzle:`);
      console.log(`   Raw value: ${dashboardOverride.allowed}`);
      console.log(`   Type: ${typeof dashboardOverride.allowed}`);
      console.log(`   === false: ${dashboardOverride.allowed === false}`);
      console.log(`   == false: ${dashboardOverride.allowed == false}`);
      console.log(`   Boolean(): ${Boolean(dashboardOverride.allowed)}`);
      console.log(`   JSON: ${JSON.stringify(dashboardOverride.allowed)}`);
      
      // Test the same logic as server
      const overrideValue = dashboardOverride.allowed;
      let allowed: boolean;
      if (overrideValue === false || overrideValue === 'false' || overrideValue === 0) {
        allowed = false;
        console.log(`\n   ✅ Server logic: overrideValue === false → allowed = false`);
      } else if (overrideValue === true || overrideValue === 'true' || overrideValue === 1) {
        allowed = true;
        console.log(`\n   ❌ Server logic: overrideValue === true → allowed = true`);
      } else {
        allowed = Boolean(overrideValue);
        console.log(`\n   ⚠️  Server logic: fallback to Boolean() → allowed = ${allowed}`);
      }
      
      console.log(`\n   Final allowed value: ${allowed} (type: ${typeof allowed})`);
    } else {
      console.log(`❌ Dashboard override not found in Drizzle results`);
    }

    // Also query with raw SQL to compare
    const rawPool = new Pool({
      connectionString: tenantResult.rows[0].connection_string,
      ssl: { rejectUnauthorized: false },
    });

    const rawResult = await rawPool.query(
      `SELECT allowed, feature_id, user_id FROM user_feature_access WHERE user_id = $1 AND feature_id = $2`,
      [loggedInJayId, dashboardFeatureId]
    );

    if (rawResult.rows.length > 0) {
      const rawRow = rawResult.rows[0];
      console.log(`\n📋 Dashboard Override from Raw SQL:`);
      console.log(`   Raw value: ${rawRow.allowed}`);
      console.log(`   Type: ${typeof rawRow.allowed}`);
      console.log(`   === false: ${rawRow.allowed === false}`);
    }

    await rawPool.end();
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testDrizzleBooleanRead();

