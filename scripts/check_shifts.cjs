const { Client } = require('pg');
require('dotenv').config();

async function checkShiftTable() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    await client.connect();
    console.log('Connected to database\n');
    
    // Check duty_shifts table structure
    const structure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'duty_shifts' 
      ORDER BY ordinal_position
    `);
    console.log('duty_shifts table structure:');
    structure.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type}) ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${row.column_default || ''}`);
    });
    
    // Check sample data
    const sampleData = await client.query('SELECT * FROM duty_shifts LIMIT 5');
    console.log('\nSample duty_shifts records:');
    console.log(sampleData.rows);
    
    // Count records
    const count = await client.query('SELECT COUNT(*) FROM duty_shifts');
    console.log('\nTotal duty_shifts count:', count.rows[0].count);
    
  } catch (err) {
    console.error('Database error:', err.message);
  } finally {
    await client.end();
  }
}

checkShiftTable();
