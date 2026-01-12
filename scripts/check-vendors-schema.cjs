
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
    // Target Jay's DB
    const tenantDbName = 'petropal_tenant_d9a422c63387';
    const tenantUrl = env.DATABASE_URL.replace(/\/([^/]+)$/, `/${tenantDbName}`);
    const client = new Client({ connectionString: tenantUrl });
    await client.connect();

    try {
        console.log(`Checking DB: ${tenantDbName}`);

        // Check DateStyle
        const dateStyle = await client.query('SHOW DateStyle');
        console.log('DateStyle:', dateStyle.rows[0].DateStyle);

        const res = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'vendors'
            AND column_name IN ('opening_date', 'opening_type', 'description', 'is_active')
            ORDER BY column_name;
        `);

        console.log('Target Columns:');
        if (res.rows.length === 0) {
            console.log('  No target columns found!');
        }
        res.rows.forEach(r => {
            console.log(`- ${r.column_name}: ${r.data_type} (Nullable: ${r.is_nullable})`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

check();
