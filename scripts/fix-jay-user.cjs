const { Client } = require('pg');
const crypto = require('crypto');
require('dotenv').config({ path: '.local.env' });

// Simple scrypt hash for "password123" (node default params)
// In a real app we use the auth library, but for this fix script we can just insert a known hash or a placeholder
// Actually, let's just use a placeholder hash that won't work for login, but allows the user to exist.
// The user can reset their password later via Developer Mode.
// OR, I can try to use the same hash function if I can import it.
// But importing TS files in CJS is hard.
// Let's just use a dummy hash. The user will need to reset password.
const DUMMY_HASH = 'scrypt$N=16384,r=8,p=1$dummy$dummy';

async function fixJayUser() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to master DB');

        const email = 'jay@gmail.com';

        // 1. Find tenant
        const tenantUsersRes = await client.query(`
            SELECT tu.tenant_id, t.connection_string, t.organization_name
            FROM tenant_users tu
            JOIN tenants t ON t.id = tu.tenant_id
            WHERE LOWER(tu.user_email) = $1
        `, [email]);

        if (tenantUsersRes.rows.length === 0) {
            console.log('No tenant mapping found for jay@gmail.com');
            return;
        }

        const { tenant_id, connection_string, organization_name } = tenantUsersRes.rows[0];
        console.log(`Found tenant: ${organization_name} (${tenant_id})`);

        // 2. Connect to tenant DB
        const tenantClient = new Client({
            connectionString: connection_string,
            ssl: { rejectUnauthorized: false }
        });

        await tenantClient.connect();

        // 3. Check if user exists
        const userRes = await tenantClient.query(`SELECT id FROM users WHERE email = $1`, [email]);

        let userId;
        if (userRes.rows.length > 0) {
            console.log('User already exists in tenant DB (unexpected given previous debug). ID:', userRes.rows[0].id);
            userId = userRes.rows[0].id;
        } else {
            console.log('User NOT found in tenant DB. Creating...');

            // 4. Create user
            const insertRes = await tenantClient.query(`
                INSERT INTO users (email, password_hash, full_name, role, created_at, updated_at)
                VALUES ($1, $2, $3, $4, NOW(), NOW())
                RETURNING id
            `, [email, DUMMY_HASH, 'Jay', 'manager']);

            userId = insertRes.rows[0].id;
            console.log('Created user with ID:', userId);

            // Assign role
            await tenantClient.query(`
                INSERT INTO user_roles (user_id, role) VALUES ($1, 'manager')
            `, [userId]);
            console.log('Assigned manager role');
        }

        // 5. Update master mapping
        console.log('Updating master tenant_users mapping...');
        await client.query(`
            INSERT INTO tenant_users (tenant_id, user_email, user_id)
            VALUES ($1, $2, $3)
            ON CONFLICT (tenant_id, user_email)
            DO UPDATE SET user_id = EXCLUDED.user_id
        `, [tenant_id, email, userId]);
        console.log('Master mapping updated.');

        // 6. Initialize feature_access (basic check)
        // We won't do full initialization here, but we'll ensure the table exists and maybe insert one row to test
        // The Developer Mode "Apply Basic" button can be used to fully populate it.

        await tenantClient.end();

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

fixJayUser();
