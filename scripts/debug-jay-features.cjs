const { Client } = require('pg');
require('dotenv').config({ path: '.local.env' });

async function debugJayFeatures() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to master DB');

        // Find tenant for jay@gmail.com
        const email = 'jay@gmail.com';
        const tenantUsersRes = await client.query(`
            SELECT tu.tenant_id, tu.user_id, t.connection_string, t.organization_name
            FROM tenant_users tu
            JOIN tenants t ON t.id = tu.tenant_id
            WHERE LOWER(tu.user_email) = $1
        `, [email]);

        console.log(`Found ${tenantUsersRes.rows.length} tenant mappings for ${email}`);

        for (const row of tenantUsersRes.rows) {
            console.log(`\nChecking Tenant: ${row.organization_name} (${row.tenant_id})`);

            const tenantClient = new Client({
                connectionString: row.connection_string,
                ssl: { rejectUnauthorized: false }
            });

            try {
                await tenantClient.connect();

                // Get User ID in tenant DB
                const userRes = await tenantClient.query(`SELECT id, email FROM users WHERE email = $1`, [email]);

                if (userRes.rows.length === 0) {
                    console.log('  User not found in tenant DB users table via email lookup');

                    // Check FK constraints
                    console.log('  Checking FK constraints...');
                    const fkRes = await tenantClient.query(`
                        SELECT
                            tc.table_schema, 
                            tc.constraint_name, 
                            tc.table_name, 
                            kcu.column_name, 
                            ccu.table_schema AS foreign_table_schema,
                            ccu.table_name AS foreign_table_name,
                            ccu.column_name AS foreign_column_name 
                        FROM 
                            information_schema.table_constraints AS tc 
                            JOIN information_schema.key_column_usage AS kcu
                              ON tc.constraint_name = kcu.constraint_name
                              AND tc.table_schema = kcu.table_schema
                            JOIN information_schema.constraint_column_usage AS ccu
                              ON ccu.constraint_name = tc.constraint_name
                              AND ccu.table_schema = tc.table_schema
                        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name IN ('user_feature_access', 'feature_access');
                    `);
                    fkRes.rows.forEach(r => {
                        console.log(`    ${r.constraint_name}: ${r.table_name}.${r.column_name} -> ${r.foreign_table_name}.${r.foreign_column_name}`);
                    });

                    continue;
                }
                const userId = userRes.rows[0].id;
                console.log(`  User ID in Tenant DB: ${userId}`);

                // Check feature_permissions
                const fpRes = await tenantClient.query(`SELECT COUNT(*) as count FROM feature_permissions`);
                console.log(`  feature_permissions count: ${fpRes.rows[0].count}`);

                // Check feature_access (new schema)
                try {
                    const faRes = await tenantClient.query(`
                        SELECT feature_key, allowed, updated_at 
                        FROM feature_access 
                        WHERE user_id = $1
                    `, [userId]);
                    console.log(`  feature_access entries: ${faRes.rows.length}`);
                    faRes.rows.forEach(r => {
                        console.log(`    ${r.feature_key}: ${r.allowed} (${r.updated_at})`);
                    });
                } catch (e) {
                    console.log('  feature_access table does not exist or error:', e.message);
                }

                // Check user_feature_access (legacy schema)
                try {
                    const ufaRes = await tenantClient.query(`
                        SELECT ufa.allowed, fp.feature_key
                        FROM user_feature_access ufa
                        JOIN feature_permissions fp ON fp.id = ufa.feature_id
                        WHERE ufa.user_id = $1
                    `, [userId]);
                    console.log(`  user_feature_access entries: ${ufaRes.rows.length}`);
                    ufaRes.rows.forEach(r => {
                        console.log(`    ${r.feature_key}: ${r.allowed}`);
                    });
                } catch (e) {
                    console.log('  user_feature_access table does not exist or error:', e.message);
                }

            } catch (err) {
                console.error(`  Error connecting to tenant ${row.tenant_id}:`, err.message);
            } finally {
                await tenantClient.end();
            }
        }

    } catch (err) {
        console.error('Master DB Error:', err);
    } finally {
        await client.end();
    }
}

debugJayFeatures();
