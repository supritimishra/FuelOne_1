
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

const MIGRATION_FILES = [
    'supabase/migrations/20251201_add_expiry_items_category.sql',
    'supabase/migrations/20251201_fix_organization_details_schema.sql'
];

async function applyFixes() {
    const client = new Client({ connectionString: env.DATABASE_URL });
    await client.connect();

    try {
        // 1. Get ALL tenants
        const res = await client.query(`SELECT tenant_db_name FROM tenants`);
        if (res.rows.length === 0) {
            console.log('No tenants found.');
            return;
        }

        console.log(`Found ${res.rows.length} tenants. Applying fixes...`);

        // Read migration contents
        const migrations = MIGRATION_FILES.map(file => ({
            file,
            sql: fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8')
        }));

        for (const row of res.rows) {
            const tenantDbName = row.tenant_db_name;
            console.log(`\nProcessing tenant DB: ${tenantDbName}`);

            try {
                // 2. Connect to tenant DB
                const tenantUrl = env.DATABASE_URL.replace(/\/([^/]+)$/, `/${tenantDbName}`);
                const tenantClient = new Client({ connectionString: tenantUrl });
                await tenantClient.connect();

                // 3. Apply migrations
                for (const { file, sql } of migrations) {
                    try {
                        await tenantClient.query(sql);
                        console.log(`  [OK] Applied ${file}`);
                    } catch (err) {
                        // Ignore "already exists" errors
                        if (err.message.includes('already exists')) {
                            console.log(`  [SKIP] ${file} (already exists)`);
                        } else {
                            console.error(`  [FAIL] ${file}: ${err.message}`);
                        }
                    }
                }

                await tenantClient.end();
            } catch (err) {
                console.log(`  [ERROR] Could not connect to tenant ${tenantDbName}: ${err.message}`);
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

applyFixes();
