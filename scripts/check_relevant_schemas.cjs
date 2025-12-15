#!/usr/bin/env node

/**
 * Check schemas of relevant tables for Phase 3 Period-End Operations
 */

const { Client } = require('pg');
require('dotenv').config();

async function checkRelevantSchemas() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    const tables = ['day_settlements', 'daily_nozzle_assignings', 'daily_lub_assignings', 'sale_entries', 'tanks'];

    for (const tableName of tables) {
      console.log(`\n=== ${tableName.toUpperCase()} TABLE ===`);
      
      try {
        const result = await client.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = $1
          ORDER BY ordinal_position
        `, [tableName]);
        
        if (result.rows.length === 0) {
          console.log(`❌ Table '${tableName}' does not exist`);
        } else {
          console.log(`✅ Table '${tableName}' exists with ${result.rows.length} columns:`);
          result.rows.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : ''} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
          });
        }
      } catch (error) {
        console.log(`❌ Error checking table '${tableName}': ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await client.end();
  }
}

checkRelevantSchemas();
