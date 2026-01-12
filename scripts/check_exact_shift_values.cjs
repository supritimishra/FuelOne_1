#!/usr/bin/env node

/**
 * Check exact shift values that work
 */

const { Client } = require('pg');
require('dotenv').config();

async function checkExactShiftValues() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check existing shift values in daily_nozzle_assignings
    const existingShifts = await client.query('SELECT DISTINCT shift FROM daily_nozzle_assignings ORDER BY shift');
    console.log('\nExisting shift values in daily_nozzle_assignings:');
    existingShifts.rows.forEach(row => {
      console.log(`  - "${row.shift}"`);
    });

    // If no existing data, try to find valid values by checking constraint
    if (existingShifts.rows.length === 0) {
      console.log('\nNo existing data found. Checking constraint...');
      
      // Try common shift patterns
      const testShifts = [
        'Morning Shift', 'Afternoon Shift', 'Night Shift',
        'Shift1', 'Shift2', 'Shift3',
        'Day', 'Evening', 'Night',
        'A', 'B', 'C',
        '1', '2', '3'
      ];
      
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
          console.log(`❌ Invalid shift: "${testShift}"`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkExactShiftValues();
