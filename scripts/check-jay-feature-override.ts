import { Pool } from 'pg';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.local.env') });

const masterDbUrl = process.env.DATABASE_URL;

if (!masterDbUrl) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

async function checkJayOverride() {
  const pool = new Pool({
    connectionString: masterDbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // Find Jay's tenant
    const tenantId = 'f1f5c217-7b39-4031-9d76-b7da090bad65'; // Jay's tenant from logs
    console.log(`\n🔍 Looking for Jay's tenant: ${tenantId}\n`);
    
    const tenantResult = await pool.query(
      `SELECT id, organization_name, tenant_db_name, connection_string 
       FROM tenants 
       WHERE id = $1`,
      [tenantId]
    );

    if (tenantResult.rows.length === 0) {
      console.error(`❌ Tenant ${tenantId} not found`);
      process.exit(1);
    }

    const tenant = tenantResult.rows[0];
    console.log('📊 Tenant Information:');
    console.log(`   Organization: ${tenant.organization_name}`);
    console.log(`   Database: ${tenant.tenant_db_name}\n`);

    const tenantPool = new Pool({
      connectionString: tenant.connection_string,
      ssl: { rejectUnauthorized: false },
    });

    try {
      // Find Jay's user ID
      const jayUserResult = await tenantPool.query(
        `SELECT id, email, username, full_name FROM users WHERE email = 'jay@gmail.com'`
      );

      if (jayUserResult.rows.length === 0) {
        console.error('❌ Jay not found in tenant database');
        process.exit(1);
      }

      const jayUser = jayUserResult.rows[0];
      console.log(`👤 Jay's User Info:`);
      console.log(`   User ID: ${jayUser.id}`);
      console.log(`   Email: ${jayUser.email}`);
      console.log(`   Username: ${jayUser.username || 'N/A'}`);
      console.log(`   Full Name: ${jayUser.full_name || 'N/A'}\n`);

      // Find dashboard feature ID
      const dashboardFeatureResult = await tenantPool.query(
        `SELECT id, feature_key, label, default_enabled FROM feature_permissions WHERE feature_key = 'dashboard'`
      );

      if (dashboardFeatureResult.rows.length === 0) {
        console.error('❌ Dashboard feature not found');
        process.exit(1);
      }

      const dashboardFeature = dashboardFeatureResult.rows[0];
      console.log(`📋 Dashboard Feature:`);
      console.log(`   Feature ID: ${dashboardFeature.id}`);
      console.log(`   Feature Key: ${dashboardFeature.feature_key}`);
      console.log(`   Default Enabled: ${dashboardFeature.default_enabled}\n`);

      // Check for override
      const overrideResult = await tenantPool.query(
        `SELECT id, user_id, feature_id, allowed, created_at, updated_at 
         FROM user_feature_access 
         WHERE user_id = $1 AND feature_id = $2`,
        [jayUser.id, dashboardFeature.id]
      );

      console.log(`🔍 Dashboard Override Check:`);
      if (overrideResult.rows.length > 0) {
        const override = overrideResult.rows[0];
        console.log(`   ✅ OVERRIDE EXISTS!`);
        console.log(`   Override ID: ${override.id}`);
        console.log(`   User ID: ${override.user_id}`);
        console.log(`   Feature ID: ${override.feature_id}`);
        console.log(`   Allowed: ${override.allowed} (type: ${typeof override.allowed})`);
        console.log(`   Created: ${override.created_at}`);
        console.log(`   Updated: ${override.updated_at}`);
        
        if (override.allowed === false || override.allowed === 'false') {
          console.log(`\n✅ Dashboard override is correctly set to FALSE`);
          console.log(`   Expected: Dashboard should be HIDDEN for Jay`);
        } else {
          console.log(`\n❌ Dashboard override is set to TRUE (should be FALSE)`);
          console.log(`   This is the problem!`);
        }
      } else {
        console.log(`   ❌ NO OVERRIDE FOUND!`);
        console.log(`   Dashboard will use default_enabled: ${dashboardFeature.default_enabled}`);
        console.log(`   This means the save didn't work or saved to wrong user ID.\n`);
        
        // Check what user ID we saved to in Developer Mode
        console.log(`\n🔍 Checking Developer Mode save target:`);
        console.log(`   Expected user ID (from Developer Mode): 0fc0d08e-f0ae-4276-8627-6581a0d0aacc`);
        console.log(`   Jay's actual user ID: ${jayUser.id}`);
        if (jayUser.id !== '0fc0d08e-f0ae-4276-8627-6581a0d0aacc') {
          console.log(`\n❌❌❌ USER ID MISMATCH! ❌❌❌`);
          console.log(`   We saved to user ID: 0fc0d08e-f0ae-4276-8627-6581a0d0aacc`);
          console.log(`   But Jay's actual user ID is: ${jayUser.id}`);
          console.log(`   This is why the override isn't working!`);
        }
      }

      // Also list all overrides for Jay
      const allOverridesResult = await tenantPool.query(
        `SELECT 
           ufa.id, ufa.feature_id, ufa.allowed,
           fp.feature_key, fp.label
         FROM user_feature_access ufa
         JOIN feature_permissions fp ON ufa.feature_id = fp.id
         WHERE ufa.user_id = $1
         ORDER BY fp.feature_key
         LIMIT 10`,
        [jayUser.id]
      );

      console.log(`\n📋 First 10 overrides for Jay:`);
      if (allOverridesResult.rows.length > 0) {
        allOverridesResult.rows.forEach((row: any) => {
          console.log(`   ${row.feature_key.padEnd(30)} allowed=${row.allowed}`);
        });
      } else {
        console.log(`   No overrides found for Jay`);
      }

      await tenantPool.end();
    } catch (err: any) {
      console.error(`❌ Error: ${err.message}`);
      console.error(err.stack);
      process.exit(1);
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

checkJayOverride();

