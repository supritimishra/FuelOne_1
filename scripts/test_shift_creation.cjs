const { Client } = require('pg');
require('dotenv').config();

async function testShiftCreation() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    await client.connect();
    console.log('Connected to database\n');
    
    // Test insert
    console.log('Testing shift creation...');
    const testShift = {
      shift_name: 'Test Morning Shift',
      start_time: '06:00',
      end_time: '14:00',
      duties: 3
    };
    
    const insertResult = await client.query(
      `INSERT INTO duty_shifts (shift_name, start_time, end_time, duties) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [testShift.shift_name, testShift.start_time, testShift.end_time, testShift.duties]
    );
    
    console.log('✅ Shift created successfully:');
    console.log(insertResult.rows[0]);
    
    // Verify the shift was created
    const verifyResult = await client.query(
      'SELECT * FROM duty_shifts WHERE shift_name = $1',
      [testShift.shift_name]
    );
    
    console.log('\n✅ Shift verified in database:');
    console.log(verifyResult.rows[0]);
    
    // Clean up - delete the test shift
    await client.query(
      'DELETE FROM duty_shifts WHERE shift_name = $1',
      [testShift.shift_name]
    );
    console.log('\n✅ Test shift cleaned up');
    
    // Check all shifts
    const allShifts = await client.query('SELECT * FROM duty_shifts ORDER BY shift_name');
    console.log('\n📋 All shifts in database:');
    console.log(`Total count: ${allShifts.rows.length}`);
    if (allShifts.rows.length > 0) {
      console.log(allShifts.rows);
    } else {
      console.log('No shifts found.');
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('Details:', err);
  } finally {
    await client.end();
  }
}

testShiftCreation();
