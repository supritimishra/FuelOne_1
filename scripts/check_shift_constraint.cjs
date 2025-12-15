#!/usr/bin/env node

/**
 * Check shift constraint values for daily_nozzle_assignings
 */

const { Client } = require('pg');
require('dotenv').config();

async function checkShiftConstraint() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check the constraint definition
    const constraintResult = await client.query(`
      SELECT conname, consrc 
      FROM pg_constraint 
      WHERE conname = 'daily_nozzle_assignings_shift_check'
    `);
    
    if (constraintResult.rows.length > 0) {
      console.log('Constraint definition:', constraintResult.rows[0].consrc);
    }

    // Check existing shift values in duty_shifts
    const shiftsResult = await client.query('SELECT shift_name FROM duty_shifts ORDER BY shift_name');
    console.log('\nValid shift names from duty_shifts:');
    shiftsResult.rows.forEach(row => {
      console.log(`  - "${row.shift_name}"`);
    });

    // Check existing shift values in daily_nozzle_assignings
    const existingShifts = await client.query('SELECT DISTINCT shift FROM daily_nozzle_assignings ORDER BY shift');
    console.log('\nExisting shift values in daily_nozzle_assignings:');
    existingShifts.rows.forEach(row => {
      console.log(`  - "${row.shift}"`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkShiftConstraint();
