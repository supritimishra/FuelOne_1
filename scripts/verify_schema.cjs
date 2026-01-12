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
    } catch (e) {
        return {};
    }
}

async function run() {
    const repoRoot = path.resolve(__dirname, '..');
    let env = loadEnv(path.join(repoRoot, '.env'));
    if (!env.DATABASE_URL) env = loadEnv(path.join(repoRoot, '.local.env'));

    if (!env.DATABASE_URL) { console.error('No DB URL'); process.exit(1); }

    const masterClient = new Client({ connectionString: env.DATABASE_URL });
    await masterClient.connect();

    try {
        // Find the tenant for dev@developer.local
        // We know dev-reset works, so find user?
        // Actually, let's just check ALL tenants.
        const tenants = await masterClient.query('SELECT * FROM tenants');

        for (const t of tenants.rows) {
            console.log(`Checking tenant: ${t.organization_name}`);
            const tClient = new Client({ connectionString: t.connection_string });
            await tClient.connect();
            try {
                const res = await tClient.query(`
                  SELECT column_name, data_type 
                  FROM information_schema.columns 
                  WHERE table_name = 'daily_sale_rates' AND column_name = 'shift'
              `);
                if (res.rows.length > 0) {
                    console.log(`  [OK] Found 'shift' column: ${res.rows[0].data_type}`);
                } else {
                    console.log(`  [FAIL] 'shift' column MISSING!`);
                }
            } catch (e) {
                console.error("  Error querying schema:", e.message);
            } finally {
                await tClient.end();
            }
        }

    } finally {
        await masterClient.end();
    }
}

run();
