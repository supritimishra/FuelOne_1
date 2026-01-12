const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

function loadEnv(envPath) {
    try {
        const content = fs.readFileSync(envPath, 'utf8');
        const lines = content.split(/\r?\n/);
        const map = {};
        for (const l of lines) {
            const m = l.match(/^([^#=]+)=(.*)$/);
            if (m) {
                map[m[1].trim()] = m[2].trim().replace(/^"(.*)"$/, '$1');
            }
        }
        return map;
    } catch (e) {
        return {};
    }
}

async function run() {
    const repoRoot = path.resolve(__dirname, '..');
    let env = loadEnv(path.join(repoRoot, '.env'));
    if (!env.DATABASE_URL) env = loadEnv(path.join(repoRoot, '.local.env'));

    if (!env.DATABASE_URL) {
        console.error('DATABASE_URL missing');
        process.exit(1);
    }

    const masterClient = new Client({ connectionString: env.DATABASE_URL });
    await masterClient.connect();

    try {
        const res = await masterClient.query('SELECT id, organization_name, connection_string FROM tenants');
        console.log(`Found ${res.rows.length} tenants.`);

        for (const tenant of res.rows) {
            console.log(`\nTENANT: ${tenant.organization_name} (${tenant.id})`);
            const tenantClient = new Client({ connectionString: tenant.connection_string });
            try {
                await tenantClient.connect();
                const pRes = await tenantClient.query("SELECT product_name, short_name FROM fuel_products");
                if (pRes.rows.length === 0) {
                    console.log('  No products.');
                } else {
                    for (const p of pRes.rows) {
                        console.log(`  - ${p.product_name} (${p.short_name})`);
                    }
                }
            } catch (e) {
                console.log('  ERROR connecting/querying:', e.message);
            } finally {
                await tenantClient.end();
            }
        }

    } finally {
        await masterClient.end();
    }
}

run();
