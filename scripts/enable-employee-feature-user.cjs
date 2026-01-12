const { Client } = require('pg');
require('dotenv').config({ path: '.local.env' });

const TENANT_ID = 'f1f5c217-7b39-4031-9d76-b7da090bad65';
const USER_ID = '235e168e-274a-45bd-9322-e81643263a81';

async function enableFeature() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        // Get tenant DB name
        const res = await client.query('SELECT * FROM tenants WHERE id = $1', [TENANT_ID]);
        const tenant = res.rows[0];
        await client.end();

        // Connect to tenant DB
        const tenantClient = new Client({
            connectionString: tenant.connection_string,
            ssl: { rejectUnauthorized: false }
        });

        await tenantClient.connect();

        console.log('Ensuring feature exists in feature_permissions...');
        // Check if table exists first
        try {
            await tenantClient.query(`
        INSERT INTO feature_permissions (feature_key, label, feature_group, description, default_enabled)
        VALUES ('employees', 'Employees', 'master', 'Manage employees', true)
        ON CONFLICT (feature_key) DO NOTHING;
      `);
            console.log('✅ Feature ensured in feature_permissions');
        } catch (e) {
            console.log('⚠️ Could not insert into feature_permissions (table might not exist or schema mismatch):', e.message);
        }

        console.log(`Enabling employees feature for user ${USER_ID}...`);
        // Check if feature_access table exists
        const tableCheck = await tenantClient.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema='public' AND table_name='feature_access'
      ) AS exists
    `);

        if (tableCheck.rows[0].exists) {
            await tenantClient.query(`
        INSERT INTO feature_access (user_id, feature_key, allowed, updated_at)
        VALUES ($1, 'employees', true, now())
        ON CONFLICT (user_id, feature_key) 
        DO UPDATE SET allowed = true, updated_at = now();
      `, [USER_ID]);
            console.log('✅ Feature enabled in feature_access');
        } else {
            console.log('⚠️ feature_access table does not exist!');
        }

        // Also try legacy user_feature_access just in case
        const legacyCheck = await tenantClient.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema='public' AND table_name='user_feature_access'
      ) AS exists
    `);

        if (legacyCheck.rows[0].exists) {
            console.log('Enabling in legacy user_feature_access...');
            // Need to find feature_id first
            const featureRes = await tenantClient.query(`SELECT id FROM feature_permissions WHERE feature_key = 'employees'`);
            if (featureRes.rows.length > 0) {
                const featureId = featureRes.rows[0].id;
                await tenantClient.query(`
          INSERT INTO user_feature_access (user_id, feature_id, allowed, updated_at)
          VALUES ($1, $2, true, now())
          ON CONFLICT (user_id, feature_id)
          DO UPDATE SET allowed = true, updated_at = now()
        `, [USER_ID, featureId]);
                console.log('✅ Feature enabled in user_feature_access');
            } else {
                console.log('⚠️ Could not find feature_id for legacy table');
            }
        }

        await tenantClient.end();

    } catch (err) {
        console.error('Error:', err);
        if (client) await client.end();
    }
}

enableFeature();
