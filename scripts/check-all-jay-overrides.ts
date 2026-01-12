import { Pool } from 'pg';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.local.env') });

const masterDbUrl = process.env.DATABASE_URL;

if (!masterDbUrl) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

async function checkAllJayOverrides() {
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

    const tenantPool = new Pool({
      connectionString: tenantResult.rows[0].connection_string,
      ssl: { rejectUnauthorized: false },
    });

    const jayUserId = '235e168e-274a-45bd-9322-e81643263a81';

    // Count total features
    const totalFeaturesResult = await tenantPool.query(`SELECT COUNT(*) as count FROM feature_permissions`);
    const totalFeatures = parseInt(totalFeaturesResult.rows[0].count);

    // Count overrides for Jay
    const overridesResult = await tenantPool.query(
      `SELECT COUNT(*) as count FROM user_feature_access WHERE user_id = $1`,
      [jayUserId]
    );
    const overrideCount = parseInt(overridesResult.rows[0].count);

    console.log(`\n📊 Jay's Feature Permissions Summary:`);
    console.log(`   Total features in catalog: ${totalFeatures}`);
    console.log(`   Overrides for Jay: ${overrideCount}\n`);

    // Get all overrides with their allowed status
    const allOverrides = await tenantPool.query(
      `SELECT 
         ufa.feature_id, ufa.allowed,
         fp.feature_key, fp.label, fp.default_enabled
       FROM user_feature_access ufa
       JOIN feature_permissions fp ON ufa.feature_id = fp.id
       WHERE ufa.user_id = $1
       ORDER BY fp.feature_key`,
      [jayUserId]
    );

    console.log(`📋 All Overrides for Jay (${allOverrides.rows.length}):\n`);
    const enabledOverrides = allOverrides.rows.filter((r: any) => r.allowed === true || r.allowed === 'true');
    const disabledOverrides = allOverrides.rows.filter((r: any) => r.allowed === false || r.allowed === 'false');
    
    console.log(`   Enabled (allowed=true): ${enabledOverrides.length}`);
    console.log(`   Disabled (allowed=false): ${disabledOverrides.length}\n`);

    // Show first 20
    console.log(`   First 20 overrides:`);
    allOverrides.rows.slice(0, 20).forEach((row: any) => {
      const status = row.allowed ? '✅' : '❌';
      console.log(`   ${status} ${row.feature_key.padEnd(30)} allowed=${row.allowed}, default=${row.default_enabled}`);
    });

    if (allOverrides.rows.length > 20) {
      console.log(`   ... and ${allOverrides.rows.length - 20} more`);
    }

    // Calculate expected enabled features
    // Features without overrides should use defaultEnabled
    const featuresWithoutOverrides = totalFeatures - overrideCount;
    
    // Get count of features with defaultEnabled=true (no override)
    const defaultEnabledResult = await tenantPool.query(
      `SELECT COUNT(*) as count 
       FROM feature_permissions 
       WHERE id NOT IN (SELECT feature_id FROM user_feature_access WHERE user_id = $1)
       AND default_enabled = true`,
      [jayUserId]
    );
    const defaultEnabledCount = parseInt(defaultEnabledResult.rows[0].count);

    console.log(`\n📊 Expected Feature Access:`);
    console.log(`   Features with overrides (explicit): ${overrideCount}`);
    console.log(`   Features without overrides (use default): ${featuresWithoutOverrides}`);
    console.log(`   Default-enabled features (no override): ${defaultEnabledCount}`);
    console.log(`   Expected total enabled: ${enabledOverrides.length + defaultEnabledCount}`);

    if (overrideCount === totalFeatures) {
      console.log(`\n⚠️  WARNING: ALL ${totalFeatures} features have overrides!`);
      console.log(`   This means someone saved ALL features, not just dashboard.`);
      console.log(`   If all overrides are false, Jay will see "No Access" page.`);
    }

    await tenantPool.end();
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

checkAllJayOverrides();

