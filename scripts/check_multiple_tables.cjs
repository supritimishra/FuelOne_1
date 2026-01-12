const { Client } = require('pg');
require('dotenv').config();

async function checkMultipleTables() {
  const client = new Client({ 
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    const tablesToCheck = [
      'vendors',
      'lubricants', 
      'liquid_purchases',
      'swipe_transactions',
      'vendor_invoices',
      'vendor_payments'
    ];

    for (const tableName of tablesToCheck) {
      try {
        const result = await client.query(`
          SELECT column_name FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = $1
          ORDER BY ordinal_position
        `, [tableName]);
        
        console.log(`\n${tableName} columns:`);
        if (result.rows.length === 0) {
          console.log('  - Table does not exist');
        } else {
          result.rows.forEach(r => console.log('  -', r.column_name));
        }
      } catch (error) {
        console.log(`\n${tableName}: Error - ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkMultipleTables();