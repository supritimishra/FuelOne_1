const { Client } = require('pg');
require('dotenv').config();

async function checkColumns() {
  const client = new Client({ 
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Check organization_details table
    const orgResult = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'organization_details'
      ORDER BY ordinal_position
    `);
    console.log('organization_details columns:');
    orgResult.rows.forEach(r => console.log('  -', r.column_name));
    
    // Check expense_types table  
    const expResult = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'expense_types'
      ORDER BY ordinal_position
    `);
    console.log('\nexpense_types columns:');
    expResult.rows.forEach(r => console.log('  -', r.column_name));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkColumns();