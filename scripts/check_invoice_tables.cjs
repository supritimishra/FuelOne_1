#!/usr/bin/env node

/**
 * Check for invoice-related tables
 */

const { Client } = require('pg');
require('dotenv').config();

async function checkInvoiceTables() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check for tables with 'invoice' in the name
    const invoiceTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%invoice%'
      ORDER BY table_name;
    `);

    console.log('\n=== INVOICE-RELATED TABLES ===');
    if (invoiceTables.rows.length > 0) {
      invoiceTables.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    } else {
      console.log('❌ No tables with "invoice" in the name found');
    }

    // Check all tables to see what's available
    const allTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('\n=== ALL TABLES ===');
    allTables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

  } catch (error) {
    console.error(`Error:`, error.message);
  } finally {
    await client.end();
  }
}

checkInvoiceTables();
