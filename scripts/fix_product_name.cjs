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
                const k = m[1].trim();
                let v = m[2].trim();
                if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
                map[k] = v;
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
    if (!env.DATABASE_URL) {
        // Try .local.env
        env = loadEnv(path.join(repoRoot, '.local.env'));
    }

    if (!env.DATABASE_URL) {
        console.error('DATABASE_URL missing in .env or .local.env');
        process.exit(1);
    }

    const masterClient = new Client({ connectionString: env.DATABASE_URL });
    await masterClient.connect();

    try {
        console.log('-> Connected to Master DB');

        // Get all tenants
        const res = await masterClient.query('SELECT id, organization_name, connection_string FROM tenants');
        const tenants = res.rows;
        console.log(`-> Found ${tenants.length} tenants`);

        for (const tenant of tenants) {
            console.log(`   Checking tenant: ${tenant.organization_name} (${tenant.id})`);

            const tenantClient = new Client({ connectionString: tenant.connection_string });
            try {
                await tenantClient.connect();

                // Check for the weird product name
                const searchRes = await tenantClient.query("SELECT id, product_name FROM fuel_products WHERE product_name ILIKE '%raaaaaaaa3%'");

                if (searchRes.rows.length > 0) {
                    console.log(`      !! Found ${searchRes.rows.length} matching products in this tenant.`);
                    for (const row of searchRes.rows) {
                        console.log(`      Updating product '${row.product_name}' to 'Diesel' (HSD)...`);
                        await tenantClient.query(
                            "UPDATE fuel_products SET product_name = 'Diesel', short_name = 'HSD' WHERE id = $1",
                            [row.id]
                        );
                        console.log('      Done.');
                    }
                } else {
                    console.log('      No matching products found.');
                }

            } catch (err) {
                console.error('      Failed to process tenant:', err.message);
            } finally {
                await tenantClient.end();
            }
        }

    } catch (err) {
        console.error('Master DB Error:', err);
    } finally {
        await masterClient.end();
        console.log('-> Finished');
        process.exit(0);
    }
}

run();
