import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "../shared/schema";
import { tenants, fuelProducts, vendors, employees, creditCustomers } from "../shared/schema";
import { eq } from 'drizzle-orm';
import { config } from "dotenv";
import path from "path";

// Load .local.env
config({ path: path.resolve(process.cwd(), '.local.env') });

if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL missing.");
    process.exit(1);
}

// Master DB Connection
const masterPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});
const masterDb = drizzle({ client: masterPool, schema });

async function seed() {
    console.log('🌱 Seeding Master Data (TypeScript/Drizzle)...');

    try {
        // 1. Get Tenants
        const tenantList = await masterDb.select().from(tenants);
        console.log(`-> Found ${tenantList.length} tenants`);

        for (const tenant of tenantList) {
            console.log(`\n   Processing tenant: ${tenant.organizationName}`);

            const tenantPool = new Pool({
                connectionString: tenant.connectionString,
                ssl: { rejectUnauthorized: false },
            });
            const tenantDb = drizzle({ client: tenantPool, schema });

            try {
                // A. Fuel Products
                const products = await tenantDb.select().from(fuelProducts);
                if (products.length === 0) {
                    console.log('      Creating Fuel Products...');
                    await tenantDb.insert(fuelProducts).values([
                        { productName: 'High Speed Diesel', shortName: 'HSD', lfrn: 'LFRN-HSD', isActive: true },
                        { productName: 'Motor Spirit', shortName: 'MS', lfrn: 'LFRN-MS', isActive: true },
                        { productName: 'Xtra Premium', shortName: 'XP', lfrn: 'LFRN-XP', isActive: true }
                    ]);
                    console.log('      ✅ Created HSD, MS, XP');
                } else {
                    console.log(`      ℹ️ ${products.length} products exist.`);
                }

                // B. Vendors
                const existingVendors = await tenantDb.select().from(vendors);
                if (existingVendors.length === 0) {
                    console.log('      Creating Test Vendor...');
                    await tenantDb.insert(vendors).values({
                        vendorName: 'Indian Oil Corp',
                        vendorType: 'Liquid',
                        contactPerson: 'Manager',
                        phoneNumber: '9999999999',
                        isActive: true
                    });
                    console.log('      ✅ Created Vendor');
                } else {
                    console.log(`      ℹ️ ${existingVendors.length} vendors exist.`);
                }

                // C. Employees
                const existingEmps = await tenantDb.select().from(employees);
                if (existingEmps.length === 0) {
                    console.log('      Creating Test Employee...');
                    await tenantDb.insert(employees).values({
                        employeeName: 'Test Employee',
                        designation: 'Manager',
                        phoneNumber: '8888888888',
                        salaryType: 'Monthly',
                        isActive: true
                    });
                    console.log('      ✅ Created Employee');
                } else {
                    console.log(`      ℹ️ ${existingEmps.length} employees exist.`);
                }

                // D. Credit Customers
                const existingCust = await tenantDb.select().from(creditCustomers);
                if (existingCust.length === 0) {
                    console.log('      Creating Test Credit Customer...');
                    await tenantDb.insert(creditCustomers).values({
                        organizationName: 'Test Transport Co',
                        phoneNumber: '7777777777',
                        isActive: true
                    });
                    console.log('      ✅ Created Credit Customer');
                } else {
                    console.log(`      ℹ️ ${existingCust.length} credit customers exist.`);
                }

            } catch (e) {
                console.error('      ❌ Failed to process tenant:', e);
            } finally {
                await tenantPool.end();
            }
        }

    } catch (e) {
        console.error('❌ Master DB Error:', e);
    } finally {
        await masterPool.end();
        console.log('\n-> Seeding complete.');
    }
}

seed();
