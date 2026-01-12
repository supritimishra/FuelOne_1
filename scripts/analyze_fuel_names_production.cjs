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
        console.log(`Analyzing ${tenants.rows.length} tenants...`);
        console.log("----------------------------------------------------------------");

        for (const t of tenants.rows) {
            const tClient = new Client({ connectionString: t.connection_string });
            await tClient.connect();
            try {
                // Find corrupt or legacy values
                const res = await tClient.query(`
                  SELECT id, product_name, short_name 
                  FROM fuel_products 
                  WHERE product_name ILIKE '%ra%' 
                     OR product_name ILIKE '%diesel%' 
                     OR product_name ILIKE '%petrol%' 
                     OR product_name ILIKE '%premium%'
                     OR product_name ILIKE '%xp%'
                     OR short_name ILIKE '%ra%'
                     OR short_name ILIKE '%diesel%'
                     OR short_name ILIKE '%petrol%'
              `);

                if (res.rows.length > 0) {
                    console.log(`TENANT: ${t.organization_name} (${t.id})`);
                    res.rows.forEach(r => {
                        console.log(`  [id: ${r.id}] Name: "${r.product_name}" | Short: "${r.short_name}"`);
                    });
                } else {
                    // Verify if they are already clean (HSD, MS, XP)
                    const cleanRes = await tClient.query(`
                      SELECT product_name FROM fuel_products
                      WHERE product_name NOT IN ('HSD', 'MS', 'XP')
                  `);
                    if (cleanRes.rows.length > 0) {
                        console.log(`TENANT: ${t.organization_name} - WARNING: Unknown names found:`);
                        cleanRes.rows.forEach(r => console.log(`   - "${r.product_name}"`));
                    } else {
                        console.log(`TENANT: ${t.organization_name} - [CLEAN]`);
                    }
                }

            } catch (e) {
                console.error(`  ERROR in ${t.organization_name}:`, e.message);
            } finally {
                await tClient.end();
            }
        }
        console.log("----------------------------------------------------------------");
        console.log("Analysis Complete.");

    } finally {
        await masterClient.end();
    }
}

run();
