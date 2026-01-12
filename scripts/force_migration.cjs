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
        const tenants = await masterClient.query('SELECT * FROM tenants');
        console.log(`Found ${tenants.rows.length} tenants.`);

        for (const t of tenants.rows) {
            console.log(`Migrating tenant: ${t.organization_name} (${t.id})...`);
            const tClient = new Client({ connectionString: t.connection_string });
            await tClient.connect();
            try {
                // 1. Add Column
                await tClient.query(`
                  ALTER TABLE daily_sale_rates 
                  ADD COLUMN IF NOT EXISTS shift text NOT NULL DEFAULT 'S-1';
              `);
                console.log("  [OK] Added column 'shift'");

                // 2. Add Unique Index (Optional but recommended)
                // We use "IF NOT EXISTS" safe approach implicitly or catch error
                try {
                    await tClient.query(`
                      CREATE UNIQUE INDEX IF NOT EXISTS unq_daily_rate_entry 
                      ON daily_sale_rates (rate_date, shift, fuel_product_id);
                  `);
                    console.log("  [OK] Added unique index");
                } catch (e) {
                    console.log("  [WARN] Index creation failed:", e.message);
                }

            } catch (e) {
                console.error("  [FAIL] Failed to modify table:", e.message);
            } finally {
                await tClient.end();
            }
        }

    } finally {
        await masterClient.end();
    }
}

run();
