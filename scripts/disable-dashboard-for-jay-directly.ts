import { Pool } from 'pg';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.local.env') });

const masterDbUrl = process.env.DATABASE_URL;

if (!masterDbUrl) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

async function disableDashboardForJayDirectly() {
  const pool = new Pool({
    connectionString: masterDbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const jayTenantId = 'f1f5c217-7b39-4031-9d76-b7da090bad65';
    const jayUserId = '235e168e-274a-45bd-9322-e81643263a81';

    console.log(`\n🔧 Disabling Dashboard for Jay directly in database...\n`);

    const tenantResult = await pool.query(
      `SELECT connection_string FROM tenants WHERE id = $1`,
      [jayTenantId]
    );

    if (tenantResult.rows.length === 0) {
      console.error('❌ Tenant not found');
      process.exit(1);
    }

    const tenantPool = new Pool({
      connectionString: tenantResult.rows[0].connection_string,
      ssl: { rejectUnauthorized: false },
    });

    // Get dashboard feature ID
    const featureResult = await tenantPool.query(
      `SELECT id FROM feature_permissions WHERE feature_key = 'dashboard'`
    );

    if (featureResult.rows.length === 0) {
      console.error('❌ Dashboard feature not found');
      process.exit(1);
    }

    const featureId = featureResult.rows[0].id;

    // Delete existing override
    await tenantPool.query(
      `DELETE FROM user_feature_access WHERE user_id = $1 AND feature_id = $2`,
      [jayUserId, featureId]
    );

    // Insert with allowed=false
    await tenantPool.query(
      `INSERT INTO user_feature_access (user_id, feature_id, allowed) VALUES ($1, $2, $3)`,
      [jayUserId, featureId, false]
    );

    console.log(`✅ Dashboard disabled: allowed=false for user ${jayUserId}`);

    // Verify
    const verifyResult = await tenantPool.query(
      `SELECT allowed FROM user_feature_access WHERE user_id = $1 AND feature_id = $2`,
      [jayUserId, featureId]
    );

    if (verifyResult.rows.length > 0) {
      console.log(`\n✅ Verification:`);
      console.log(`   Dashboard override: allowed=${verifyResult.rows[0].allowed}`);
      console.log(`\n🎉 Done! Dashboard is now DISABLED for Jay.`);
      console.log(`   Jay needs to refresh browser (F5) to see the change.`);
    }

    await tenantPool.end();
    await pool.end();
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

disableDashboardForJayDirectly();

