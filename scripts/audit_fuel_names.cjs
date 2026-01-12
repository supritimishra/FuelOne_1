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
            if (m) map[m[1].trim()] = m[2].trim().replace(/^"(.*)"$/, '$1');
        }
        return map;
    } catch (e) { return {}; }
}

async function run() {
    const repoRoot = path.resolve(__dirname, '..');
    let env = loadEnv(path.join(repoRoot, '.env'));
    if (!env.DATABASE_URL) env = loadEnv(path.join(repoRoot, '.local.env'));

    if (!env.DATABASE_URL) { console.error('No DB URL'); process.exit(1); }

    const masterClient = new Client({ connectionString: env.DATABASE_URL });
    await masterClient.connect();

    try {
        const tenants = await masterClient.query('SELECT * FROM tenants');
        console.log(`Auditing ${tenants.rows.length} tenants...`);

        for (const t of tenants.rows) {
            const tClient = new Client({ connectionString: t.connection_string });
            await tClient.connect();
            try {
                const res = await tClient.query(`
                  SELECT id, product_name, short_name 
                  FROM fuel_products
              `);

                if (res.rows.length > 0) {
                    console.log(`\nTenant: ${t.organization_name} (${t.id})`);
                    res.rows.forEach(r => console.log(`  - [${r.id}] Name: "${r.product_name}", Short: "${r.short_name}"`));
                }
            } catch (e) {
                console.error(`  Error in ${t.organization_name}:`, e.message);
            } finally {
                await tClient.end();
            }
        }

    } finally {
        await masterClient.end();
    }
}

run();
