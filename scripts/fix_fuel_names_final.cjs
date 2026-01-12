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
        console.log(`Fixing names for ${tenants.rows.length} tenants...`);

        for (const t of tenants.rows) {
            const tClient = new Client({ connectionString: t.connection_string });
            await tClient.connect();
            try {
                console.log(` Tenant: ${t.organization_name}`);

                // 1. Fix Diesel / HSD / raaaaaaaa3 -> HSD
                await tClient.query(`
                UPDATE fuel_products 
                SET product_name = 'HSD', short_name = 'HSD'
                WHERE product_name ILIKE '%raaaaaaaa3%' 
                   OR product_name ILIKE '%Diesel%' 
                   OR short_name = 'HSD'
              `);

                // 2. Fix Petrol / MS -> MS
                await tClient.query(`
                UPDATE fuel_products 
                SET product_name = 'MS', short_name = 'MS'
                WHERE product_name ILIKE '%petrol%' 
                   AND product_name NOT ILIKE '%xp%' 
                   AND product_name NOT ILIKE '%xtra%'
                   AND product_name NOT ILIKE '%premium%'
              `);
                // Also catch explicit 'MS' shortname records
                await tClient.query(`
                UPDATE fuel_products 
                SET product_name = 'MS', short_name = 'MS'
                WHERE short_name = 'MS'
              `);

                // 3. Fix XP / XtraPremium -> XP
                await tClient.query(`
                UPDATE fuel_products 
                SET product_name = 'XP', short_name = 'XP'
                WHERE product_name ILIKE '%xp%' 
                   OR product_name ILIKE '%xtra%' 
                   OR product_name ILIKE '%premium%'
                   OR short_name = 'XP'
              `);

                console.log("   [OK] Names standardized to HSD, MS, XP.");

            } catch (e) {
                console.error(`   [FAIL] ${e.message}`);
            } finally {
                await tClient.end();
            }
        }

    } finally {
        await masterClient.end();
    }
}

run();
