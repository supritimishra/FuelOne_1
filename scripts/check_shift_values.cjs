#!/usr/bin/env node

/**
 * Check shift values for daily_nozzle_assignings
 */

const { Client } = require('pg');
require('dotenv').config();

async function checkShiftValues() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check existing shift values in duty_shifts
    const shiftsResult = await client.query('SELECT shift_name FROM duty_shifts ORDER BY shift_name');
    console.log('\nValid shift names from duty_shifts:');
    shiftsResult.rows.forEach(row => {
      console.log(`  - "${row.shift_name}"`);
    });

    // Try to insert with different shift values to see which ones work
    const testShifts = ['Morning', 'Afternoon', 'Night', 'morning', 'afternoon', 'night', 'MORNING', 'AFTERNOON', 'NIGHT'];
    
    for (const testShift of testShifts) {
      try {
        const testResult = await client.query(`
          INSERT INTO daily_nozzle_assignings (assign_date, shift, employee_id, nozzle, notes, created_by)
          VALUES (CURRENT_DATE, $1, (SELECT id FROM employees LIMIT 1), 'TEST', 'test', null)
          RETURNING shift
        `, [testShift]);
        
        console.log(`✅ Valid shift: "${testShift}"`);
        
        // Clean up test record
        await client.query('DELETE FROM daily_nozzle_assignings WHERE nozzle = $1', ['TEST']);
        
      } catch (error) {
        console.log(`❌ Invalid shift: "${testShift}" - ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkShiftValues();
