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

async function seed() {
    console.log('🌱 Seeding Master Data (Multi-Tenant)...');

    const repoRoot = path.resolve(__dirname, '..');
    let env = loadEnv(path.join(repoRoot, '.env'));
    if (!env.DATABASE_URL) env = loadEnv(path.join(repoRoot, '.local.env'));

    if (!env.DATABASE_URL) {
        console.error('❌ DATABASE_URL missing.');
        process.exit(1);
    }

    const masterClient = new Client({ connectionString: env.DATABASE_URL });
    await masterClient.connect();

    try {
        console.log('-> Connected to Master DB');
        const res = await masterClient.query('SELECT id, organization_name, connection_string FROM tenants');
        const tenants = res.rows;
        console.log(`-> Found ${tenants.length} tenants`);

        for (const tenant of tenants) {
            console.log(`\n   Processing tenant: ${tenant.organization_name} (${tenant.id})`);
            // Supabase often needs SSL
            const tenantClient = new Client({
                connectionString: tenant.connection_string
            });

            try {
                console.log('      Connecting to Tenant DB...');
                await tenantClient.connect();

                // 1. Fuel Products
                const existingProducts = await tenantClient.query('SELECT * FROM fuel_products');
                if (existingProducts.rows.length === 0) {
                    await tenantClient.query(`
                        INSERT INTO fuel_products (product_name, short_name, is_active)
                        VALUES 
                        ('High Speed Diesel', 'HSD', true),
                        ('Motor Spirit', 'MS', true),
                        ('Xtra Premium', 'XP', true)
                    `);
                    console.log('      ✅ Inserted HSD, MS, XP');
                } else {
                    console.log(`      ℹ️ ${existingProducts.rows.length} products exist.`);
                }

                // 2. Vendors
                const existingVendors = await tenantClient.query('SELECT * FROM vendors');
                if (existingVendors.rows.length === 0) {
                    await tenantClient.query(`
                        INSERT INTO vendors (vendor_name, contact_person, phone, is_active)
                        VALUES 
                        ('Indian Oil Corp', 'Manager', '9999999999', true)
                    `);
                    console.log('      ✅ Inserted Test Vendor');
                } else {
                    console.log(`      ℹ️ ${existingVendors.rows.length} vendors exist.`);
                }

                // 3. Employees
                const existingEmp = await tenantClient.query('SELECT * FROM employees');
                if (existingEmp.rows.length === 0) {
                    // Check schema briefly by inserting minimal
                    await tenantClient.query(`
                        INSERT INTO employees (employee_name, designation, phone, is_active)
                        VALUES 
                        ('Test Employee', 'Manager', '8888888888', true)
                    `);
                    console.log('      ✅ Inserted Test Employee');
                } else {
                    console.log(`      ℹ️ ${existingEmp.rows.length} employees exist.`);
                }

                // 4. Credit Customers (Optional but good for Business Transactions)
                const existingCust = await tenantClient.query('SELECT * FROM credit_customers');
                if (existingCust.rows.length === 0) {
                    await tenantClient.query(`
                         INSERT INTO credit_customers (customer_name, phone_number, is_active)
                         VALUES ('Test Corp', '7777777777', true)
                    `);
                    console.log('      ✅ Inserted Test Credit Customer');
                } else {
                    console.log(`      ℹ️ ${existingCust.rows.length} credit customers exist.`);
                }

                console.log('      ✅ Tenant seeded successfully.');
                await tenantClient.end();
                break; // Stop after first tenant for testing purposes

            } catch (err) {
                console.error('      ❌ Failed to seed tenant:', err);
                // Don't close if already closed or error, but try to close
                try { await tenantClient.end(); } catch (e) { }
            }
        }

    } catch (err) {
        console.error('Master DB Error:', err);
    } finally {
        await masterClient.end();
        console.log('\n-> Seeding complete.');
        process.exit(0);
    }
}

seed();
