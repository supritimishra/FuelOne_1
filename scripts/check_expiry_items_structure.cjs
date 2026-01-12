const { Client } = require('pg');
require('dotenv').config();

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function checkTableStructure() {
  try {
    await client.connect();
    console.log('🔗 Connected to database');

    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'expiry_items' 
      ORDER BY ordinal_position
    `);

    console.log('📋 Expiry Items Table Structure:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type}`);
    });

    // Also check if table exists and has data
    const countResult = await client.query('SELECT COUNT(*) as total FROM expiry_items');
    console.log(`\n📊 Total records in expiry_items: ${countResult.rows[0].total}`);

    if (countResult.rows[0].total > 0) {
      const sampleResult = await client.query('SELECT * FROM expiry_items LIMIT 1');
      console.log('\n📦 Sample record:');
      console.log(sampleResult.rows[0]);
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

checkTableStructure();
