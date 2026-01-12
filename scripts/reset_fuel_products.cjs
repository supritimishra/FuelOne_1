/**
 * CRITICAL FIX: Reset fuel_products table
 * 
 * This script:
 * 1. Deletes ALL existing rows from fuel_products
 * 2. Inserts EXACTLY 3 fuels: HSD, MS, XP
 * 
 * This is a hard reset to fix corrupted/incomplete data.
 */

require('dotenv').config({ path: '.local.env' });

const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
const { sql } = require('drizzle-orm');

async function resetFuelProducts() {
    console.log('🔧 Starting fuel_products table reset...\n');

    // Connect to database
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        throw new Error('DATABASE_URL not found in environment variables');
    }

    console.log('Connecting to database...');
    const pool = new Pool({ connectionString });

    const db = drizzle(pool);

    try {
        // Start transaction
        await db.execute(sql`BEGIN`);

        // Step 1: Delete ALL existing rows (CASCADE will handle foreign keys)
        console.log('Step 1: Deleting ALL existing fuel_products...');
        await db.execute(sql`TRUNCATE TABLE fuel_products RESTART IDENTITY CASCADE`);
        console.log('✅ All existing fuel products deleted\n');

        // Step 2: Insert EXACTLY 3 fuels
        console.log('Step 2: Inserting 3 standard fuels...');

        const fuels = [
            {
                product_name: 'HSD',
                short_name: 'HSD',
                lfrn: 'HSD-LFRN',
                gst_percentage: '18.00',
                tds_percentage: '0.00',
                wgt_percentage: '0.00',
                is_active: true
            },
            {
                product_name: 'MS',
                short_name: 'MS',
                lfrn: 'MS-LFRN',
                gst_percentage: '18.00',
                tds_percentage: '0.00',
                wgt_percentage: '0.00',
                is_active: true
            },
            {
                product_name: 'XP',
                short_name: 'XP',
                lfrn: 'XP-LFRN',
                gst_percentage: '18.00',
                tds_percentage: '0.00',
                wgt_percentage: '0.00',
                is_active: true
            }
        ];

        for (const fuel of fuels) {
            await db.execute(sql`
                INSERT INTO fuel_products (product_name, short_name, lfrn, gst_percentage, tds_percentage, wgt_percentage, is_active)
                VALUES (${fuel.product_name}, ${fuel.short_name}, ${fuel.lfrn}, ${fuel.gst_percentage}, ${fuel.tds_percentage}, ${fuel.wgt_percentage}, ${fuel.is_active})
            `);
            console.log(`✅ Inserted: ${fuel.product_name}`);
        }

        console.log('\n✅ Fuel products reset complete!');
        console.log('\nFinal fuel products:');
        console.log('  1. HSD (Diesel)');
        console.log('  2. MS (Petrol)');
        console.log('  3. XP (Premium Petrol)');

        // Verify
        const result = await db.execute(sql`SELECT product_name, short_name, is_active FROM fuel_products ORDER BY product_name`);
        console.log('\nVerification - Current fuel_products table:');
        console.table(result.rows);

        // Commit transaction
        await db.execute(sql`COMMIT`);

    } catch (error) {
        // Rollback on error
        await db.execute(sql`ROLLBACK`);
        console.error('❌ Error:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

// Run the reset
resetFuelProducts()
    .then(() => {
        console.log('\n🎉 Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Script failed:', error);
        process.exit(1);
    });
