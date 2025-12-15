const { Client } = require('pg');
require('dotenv').config();

async function checkEmployeesTable() {
  const client = new Client({ 
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    const result = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'employees'
      ORDER BY ordinal_position
    `);
    
    console.log('employees table columns:');
    if (result.rows.length === 0) {
      console.log('  - Table does not exist');
    } else {
      result.rows.forEach(r => console.log('  -', r.column_name));
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkEmployeesTable();