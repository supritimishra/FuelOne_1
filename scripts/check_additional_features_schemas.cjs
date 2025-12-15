#!/usr/bin/env node

/**
 * Check schemas for additional features tables
 */

const { Client } = require('pg');
require('dotenv').config();

async function checkAdditionalFeaturesSchemas() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    const tables = ['sales_officer_inspections', 'credit_requests', 'duty_pay', 'feedback'];

    for (const tableName of tables) {
      const res = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `, [tableName]);

      if (res.rows.length > 0) {
        console.log(`\n=== ${tableName.toUpperCase()} TABLE ===`);
        console.log(`✅ Table '${tableName}' exists with ${res.rows.length} columns:`);
        res.rows.forEach(col => {
          console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''} ${col.column_default ? 'DEFAULT ' + col.column_default : ''}`);
        });
      } else {
        console.log(`\n=== ${tableName.toUpperCase()} TABLE ===`);
        console.log(`❌ Table '${tableName}' does not exist`);
      }
    }

  } catch (error) {
    console.error(`Error:`, error.message);
  } finally {
    await client.end();
  }
}

checkAdditionalFeaturesSchemas();
