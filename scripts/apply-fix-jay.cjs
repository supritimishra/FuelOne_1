
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Load env
const envPath = path.resolve(__dirname, '../.local.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [k, v] = line.split('=');
    if (k && v) env[k.trim()] = v.trim().replace(/"/g, '');
});

async function run() {
    const client = new Client({ connectionString: env.DATABASE_URL });
    await client.connect();

    try {
        // Get Jay's tenant DB
        const res = await client.query(`
            SELECT t.tenant_db_name 
            FROM tenant_users tu
            JOIN tenants t ON tu.tenant_id = t.id
            WHERE tu.user_email = 'jay@gmail.com'
            LIMIT 1
        `);

        if (res.rows.length === 0) {
            console.log('Jay not found!');
            return;
        }

        const tenantDbName = res.rows[0].tenant_db_name;
        console.log(`Targeting DB: ${tenantDbName}`);

        // Connect to tenant DB
        const tenantUrl = env.DATABASE_URL.replace(/\/([^/]+)$/, `/${tenantDbName}`);
        const tenantClient = new Client({ connectionString: tenantUrl });
        await tenantClient.connect();

        try {
            // Read migration
            const migrationPath = path.resolve(__dirname, '../migrations/20251201_fix_vendors_schema.sql');
            const migrationSql = fs.readFileSync(migrationPath, 'utf8');

            console.log('Applying migration...');
            await tenantClient.query(migrationSql);
            console.log('Migration applied.');

            // Verify
            const checkRes = await tenantClient.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'vendors'
                AND column_name IN ('opening_date', 'opening_type');
            `);
            console.log('Found columns:', checkRes.rows.map(r => r.column_name));

        } catch (err) {
            console.error('Tenant Error:', err);
        } finally {
            await tenantClient.end();
        }

    } catch (e) {
        console.error('Main Error:', e);
    } finally {
        await client.end();
    }
}

run();
