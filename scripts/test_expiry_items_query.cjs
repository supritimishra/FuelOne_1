const { Client } = require('pg');
require('dotenv').config();

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function testExpiryItemsQuery() {
  try {
    await client.connect();
    console.log('🔗 Connected to database');

    // Test the exact query from the API
    const sql = `SELECT 
      id, 
      item_name, 
      issue_date, 
      expiry_date, 
      status, 
      created_at,
      ROW_NUMBER() OVER (ORDER BY expiry_date ASC, created_at DESC) as s_no
    FROM expiry_items
    ORDER BY expiry_date ASC, created_at DESC LIMIT 100`;

    console.log('🔍 Testing SQL query...');
    const result = await client.query(sql);
    
    console.log(`✅ Query successful! Found ${result.rows.length} records`);
    
    if (result.rows.length > 0) {
      console.log('\n📦 First few records:');
      result.rows.slice(0, 3).forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.item_name} | Expires: ${row.expiry_date} | Status: ${row.status}`);
      });
    }

  } catch (err) {
    console.error('❌ Query error:', err.message);
    console.error('Stack:', err.stack);
  } finally {
    await client.end();
  }
}

testExpiryItemsQuery();
