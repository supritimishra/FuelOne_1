const { Client } = require('pg');
require('dotenv').config();

async function checkTableSchemas() {
  const client = new Client({ 
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check specific tables that are failing
    const tablesToCheck = [
      'guest_sales',
      'vendor_invoices', 
      'liquid_purchases',
      'lubricants',
      'vendor_payments',
      'swipe_transactions'
    ];

    for (const tableName of tablesToCheck) {
      console.log(`\n=== ${tableName.toUpperCase()} TABLE ===`);
      
      try {
        const result = await client.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = $1
          ORDER BY ordinal_position
        `, [tableName]);

        if (result.rows.length === 0) {
          console.log(`❌ Table '${tableName}' does not exist`);
        } else {
          console.log(`✅ Table '${tableName}' exists with ${result.rows.length} columns:`);
          result.rows.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''}${col.column_default ? ` DEFAULT ${col.column_default}` : ''}`);
          });
        }
      } catch (error) {
        console.log(`❌ Error checking table '${tableName}':`, error.message);
      }
    }

  } catch (error) {
    console.error('Connection error:', error.message);
  } finally {
    await client.end();
  }
}

checkTableSchemas();