#!/usr/bin/env node

/**
 * Check table definition and constraints
 */

const { Client } = require('pg');
require('dotenv').config();

async function checkTableDefinition() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check table definition
    const tableDef = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'daily_nozzle_assignings'
      ORDER BY ordinal_position
    `);
    
    console.log('\nTable definition for daily_nozzle_assignings:');
    tableDef.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : ''} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
    });

    // Check constraints
    const constraints = await client.query(`
      SELECT conname, contype, pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conrelid = 'daily_nozzle_assignings'::regclass
    `);
    
    console.log('\nConstraints:');
    constraints.rows.forEach(row => {
      console.log(`  - ${row.conname}: ${row.definition}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkTableDefinition();
