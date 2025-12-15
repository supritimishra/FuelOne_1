import { Pool } from 'pg';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.local.env') });

const masterDbUrl = process.env.DATABASE_URL;

if (!masterDbUrl) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

async function checkJayPermissions() {
  const pool = new Pool({
    connectionString: masterDbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const tenantId = '1cde4287-730a-42b6-a3b7-7a2aed67fd1c';
    const tenantResult = await pool.query(
      `SELECT connection_string, organization_name FROM tenants WHERE id = $1`,
      [tenantId]
    );

    if (tenantResult.rows.length === 0) {
      console.error(`❌ Tenant not found`);
      process.exit(1);
    }

    const tenant = tenantResult.rows[0];
    console.log(`\n🏢 Tenant: ${tenant.organization_name}`);
    console.log('='.repeat(80));

    const tenantPool = new Pool({
      connectionString: tenant.connection_string,
      ssl: { rejectUnauthorized: false },
    });

    // Find Jay's user ID
    const jayResult = await tenantPool.query(
      `SELECT id, email, username, full_name FROM users WHERE email = $1`,
      ['jay@gmail.com']
    );

    if (jayResult.rows.length === 0) {
      console.error('❌ Jay not found');
      process.exit(1);
    }

    const jay = jayResult.rows[0];
    console.log(`\n👤 User: ${jay.email} (${jay.full_name || jay.username})`);
    console.log(`   ID: ${jay.id}`);

    // Find dashboard feature
    const dashboardFeature = await tenantPool.query(
      `SELECT id, feature_key, label, default_enabled FROM feature_permissions WHERE feature_key = $1`,
      ['dashboard']
    );

    if (dashboardFeature.rows.length === 0) {
      console.error('❌ Dashboard feature not found in catalog');
      process.exit(1);
    }

    const feature = dashboardFeature.rows[0];
    console.log(`\n📋 Feature: ${feature.label} (${feature.feature_key})`);
    console.log(`   Feature ID: ${feature.id}`);
    console.log(`   Default Enabled: ${feature.default_enabled}`);

    // Check Jay's override
    const overrideResult = await tenantPool.query(
      `SELECT allowed, created_at, updated_at FROM user_feature_access 
       WHERE user_id = $1 AND feature_id = $2`,
      [jay.id, feature.id]
    );

    if (overrideResult.rows.length === 0) {
      console.log(`\n⚠️  No override found - Jay should use default: ${feature.default_enabled}`);
      console.log(`   This means dashboard should be ${feature.default_enabled ? 'VISIBLE' : 'HIDDEN'}`);
    } else {
      const override = overrideResult.rows[0];
      console.log(`\n✅ Override found:`);
      console.log(`   Allowed: ${override.allowed}`);
      console.log(`   Created: ${override.created_at}`);
      console.log(`   Updated: ${override.updated_at}`);
      console.log(`\n📊 Result: Dashboard should be ${override.allowed ? 'VISIBLE' : 'HIDDEN'}`);
    }

    // Check all of Jay's permissions
    const allPermissions = await tenantPool.query(
      `SELECT 
        fp.feature_key,
        fp.label,
        fp.default_enabled,
        ufa.allowed,
        CASE 
          WHEN ufa.allowed IS NOT NULL THEN ufa.allowed 
          ELSE fp.default_enabled 
        END as effective_permission
      FROM feature_permissions fp
      LEFT JOIN user_feature_access ufa ON fp.id = ufa.feature_id AND ufa.user_id = $1
      ORDER BY fp.feature_key
      LIMIT 10`,
      [jay.id]
    );

    console.log(`\n📋 First 10 features for Jay:`);
    for (const perm of allPermissions.rows) {
      const status = perm.effective_permission ? '✅ ENABLED' : '❌ DISABLED';
      const override = perm.allowed !== null ? `(override: ${perm.allowed})` : '(default)';
      console.log(`   ${perm.feature_key.padEnd(30)} ${status} ${override}`);
    }

    await tenantPool.end();
    await pool.end();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

checkJayPermissions();

