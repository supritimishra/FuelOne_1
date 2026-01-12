
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

async function check() {
    const client = new Client({ connectionString: env.DATABASE_URL });
    await client.connect();

    try {
        // 1. Get ALL tenants
        const res = await client.query(`SELECT tenant_db_name FROM tenants`);
        if (res.rows.length === 0) {
            console.log('No tenants found.');
            return;
        }

        console.log(`Found ${res.rows.length} tenants.`);

        for (const row of res.rows) {
            const tenantDbName = row.tenant_db_name;
            console.log(`\nChecking tenant DB: ${tenantDbName}`);

            try {
                // 2. Connect to tenant DB
                const tenantUrl = env.DATABASE_URL.replace(/\/([^/]+)$/, `/${tenantDbName}`);
                const tenantClient = new Client({ connectionString: tenantUrl });
                await tenantClient.connect();

                // 3. Check table existence
                const tableRes = await tenantClient.query(`
                    SELECT to_regclass('public.organization_details');
                `);

                if (!tableRes.rows[0].to_regclass) {
                    console.log('  Table organization_details DOES NOT EXIST');
                } else {
                    // 4. Check columns
                    const colsRes = await tenantClient.query(`
                        SELECT column_name 
                        FROM information_schema.columns 
                        WHERE table_name = 'organization_details';
                    `);
                    const columns = colsRes.rows.map(r => r.column_name);

                    const requiredCols = ['bank_name', 'logo_url', 'phone_number', 'owner_name'];
                    const missingCols = requiredCols.filter(c => !columns.includes(c));

                    if (missingCols.length === 0) {
                        console.log('  [OK] All required columns exist');
                    } else {
                        console.log(`  [FAIL] Missing columns: ${missingCols.join(', ')}`);
                        console.log(`  Existing columns: ${columns.join(', ')}`);
                    }
                }
                await tenantClient.end();
            } catch (err) {
                console.log(`  [ERROR] Could not check tenant ${tenantDbName}: ${err.message}`);
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

check();
