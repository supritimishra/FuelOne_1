#!/usr/bin/env node

/**
 * Check for alternative table names for Phase 3 Period-End Operations
 */

const { Client } = require('pg');
require('dotenv').config();

async function checkAlternativeTables() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check for tables with similar names
    const searchTerms = ['shift', 'sheet', 'opening', 'stock', 'settlement'];
    
    for (const term of searchTerms) {
      console.log(`\n=== SEARCHING FOR TABLES CONTAINING '${term}' ===`);
      
      try {
        const result = await client.query(`
          SELECT table_name
          FROM information_schema.tables 
          WHERE table_name ILIKE $1
          AND table_schema = 'public'
          ORDER BY table_name
        `, [`%${term}%`]);
        
        if (result.rows.length === 0) {
          console.log(`❌ No tables found containing '${term}'`);
        } else {
          console.log(`✅ Found ${result.rows.length} tables:`);
          result.rows.forEach(row => {
            console.log(`  - ${row.table_name}`);
          });
        }
      } catch (error) {
        console.log(`❌ Error searching for '${term}': ${error.message}`);
      }
    }

    // Check all tables to see what's available
    console.log(`\n=== ALL TABLES IN DATABASE ===`);
    try {
      const result = await client.query(`
        SELECT table_name
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);
      
      console.log(`✅ Found ${result.rows.length} tables:`);
      result.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    } catch (error) {
      console.log(`❌ Error listing tables: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await client.end();
  }
}

checkAlternativeTables();
