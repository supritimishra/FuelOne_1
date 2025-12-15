#!/usr/bin/env node

/**
 * Check credit_sales table schema
 */

const { Client } = require('pg');
require('dotenv').config();

async function checkCreditSalesSchema() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    const res = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'credit_sales'
      ORDER BY ordinal_position;
    `);

    if (res.rows.length > 0) {
      console.log(`\n=== CREDIT_SALES TABLE ===`);
      console.log(`✅ Table 'credit_sales' exists with ${res.rows.length} columns:`);
      res.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''} ${col.column_default ? 'DEFAULT ' + col.column_default : ''}`);
      });
    } else {
      console.log(`\n=== CREDIT_SALES TABLE ===`);
      console.log(`❌ Table 'credit_sales' does not exist`);
    }

  } catch (error) {
    console.error(`Error checking schema:`, error.message);
  } finally {
    await client.end();
  }
}

checkCreditSalesSchema();
