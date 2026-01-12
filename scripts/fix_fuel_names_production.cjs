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
        const tenants = await masterClient.query('SELECT id, organization_name, connection_string FROM tenants');
        console.log(`Starting SAFE cleanup for ${tenants.rows.length} tenants...`);
        console.log("----------------------------------------------------------------");

        for (const t of tenants.rows) {
            const tClient = new Client({ connectionString: t.connection_string });
            await tClient.connect();
            try {
                console.log(`TENANT: ${t.organization_name} (${t.id})`);

                // ---------------------------------------------------------
                // STEP 1: HSD (Diesel)
                // Match only diesel-like or corrupted diesel values
                // ---------------------------------------------------------
                const hsdRes = await tClient.query(`
                UPDATE fuel_products 
                SET product_name = 'HSD', short_name = 'HSD'
                WHERE (product_name ILIKE '%diesel%' OR product_name ILIKE '%raaaaaaaa3%')
                AND (product_name != 'HSD' OR short_name != 'HSD')
              `);
                if (hsdRes.rowCount > 0) console.log(`   [STEP 1] Normalized ${hsdRes.rowCount} HSD records.`);

                // ---------------------------------------------------------
                // STEP 2: XP (Premium Petrol)
                // Match xp / xtra / premium
                // ---------------------------------------------------------
                const xpRes = await tClient.query(`
                UPDATE fuel_products 
                SET product_name = 'XP', short_name = 'XP'
                WHERE (product_name ILIKE '%xp%' OR product_name ILIKE '%xtra%' OR product_name ILIKE '%premium%')
                AND (product_name != 'XP' OR short_name != 'XP')
              `);
                if (xpRes.rowCount > 0) console.log(`   [STEP 2] Normalized ${xpRes.rowCount} XP records.`);

                // ---------------------------------------------------------
                // STEP 3: MS (Normal Petrol)
                // Match petrol, EXCLUDING xp/premium
                // ---------------------------------------------------------
                const msRes = await tClient.query(`
                UPDATE fuel_products 
                SET product_name = 'MS', short_name = 'MS'
                WHERE (product_name ILIKE '%petrol%')
                AND product_name NOT ILIKE '%xp%' 
                AND product_name NOT ILIKE '%xtra%' 
                AND product_name NOT ILIKE '%premium%'
                AND (product_name != 'MS' OR short_name != 'MS')
              `);
                if (msRes.rowCount > 0) console.log(`   [STEP 3] Normalized ${msRes.rowCount} MS records.`);

                // ---------------------------------------------------------
                // STEP 4: VERIFY
                // ---------------------------------------------------------
                const checkRes = await tClient.query(`
                  SELECT product_name FROM fuel_products 
                  WHERE product_name NOT IN ('HSD', 'MS', 'XP')
              `);

                if (checkRes.rows.length > 0) {
                    console.error(`   [FAIL] Unknown products remain:`);
                    checkRes.rows.forEach(r => console.error(`      - "${r.product_name}"`));
                } else {
                    console.log(`   [Pass] All products clean.`);
                }

            } catch (e) {
                console.error(`   [ERROR] Failed to process ${t.organization_name}:`, e.message);
            } finally {
                await tClient.end();
            }
        }

    } finally {
        await masterClient.end();
    }
}

run();
