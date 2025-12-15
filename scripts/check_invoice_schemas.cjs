#!/usr/bin/env node

/**
 * Check vendor_invoices and print_templates schemas
 */

const { Client } = require('pg');
require('dotenv').config();

async function checkInvoiceSchemas() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check vendor_invoices schema
    const vendorInvoicesRes = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'vendor_invoices'
      ORDER BY ordinal_position;
    `);

    console.log(`\n=== VENDOR_INVOICES TABLE ===`);
    if (vendorInvoicesRes.rows.length > 0) {
      console.log(`✅ Table 'vendor_invoices' exists with ${vendorInvoicesRes.rows.length} columns:`);
      vendorInvoicesRes.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''} ${col.column_default ? 'DEFAULT ' + col.column_default : ''}`);
      });
    } else {
      console.log(`❌ Table 'vendor_invoices' does not exist`);
    }

    // Check print_templates schema
    const printTemplatesRes = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'print_templates'
      ORDER BY ordinal_position;
    `);

    console.log(`\n=== PRINT_TEMPLATES TABLE ===`);
    if (printTemplatesRes.rows.length > 0) {
      console.log(`✅ Table 'print_templates' exists with ${printTemplatesRes.rows.length} columns:`);
      printTemplatesRes.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''} ${col.column_default ? 'DEFAULT ' + col.column_default : ''}`);
      });
    } else {
      console.log(`❌ Table 'print_templates' does not exist`);
    }

  } catch (error) {
    console.error(`Error:`, error.message);
  } finally {
    await client.end();
  }
}

checkInvoiceSchemas();
