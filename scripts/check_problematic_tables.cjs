const { Client } = require('pg');
require('dotenv').config();

async function checkTables() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    await client.connect();
    console.log('Connected to database\n');
    
    // Check print_templates table
    console.log('=== PRINT_TEMPLATES TABLE ===');
    const printTemplatesStructure = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'print_templates' 
      ORDER BY ordinal_position
    `);
    if (printTemplatesStructure.rows.length > 0) {
      console.log('Columns:');
      printTemplatesStructure.rows.forEach(row => {
        console.log(`  - ${row.column_name} (${row.data_type})`);
      });
    } else {
      console.log('❌ Table does not exist!');
    }
    
    // Check denominations table
    console.log('\n=== DENOMINATIONS TABLE ===');
    const denominationsStructure = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'denominations' 
      ORDER BY ordinal_position
    `);
    if (denominationsStructure.rows.length > 0) {
      console.log('Columns:');
      denominationsStructure.rows.forEach(row => {
        console.log(`  - ${row.column_name} (${row.data_type})`);
      });
    } else {
      console.log('❌ Table does not exist!');
    }
    
    // Check guest_sales table
    console.log('\n=== GUEST_SALES TABLE ===');
    const guestSalesStructure = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'guest_sales' 
      ORDER BY ordinal_position
    `);
    if (guestSalesStructure.rows.length > 0) {
      console.log('Columns:');
      guestSalesStructure.rows.forEach(row => {
        console.log(`  - ${row.column_name} (${row.data_type})`);
      });
    } else {
      console.log('❌ Table does not exist!');
    }
    
  } catch (err) {
    console.error('❌ Database error:', err.message);
  } finally {
    await client.end();
  }
}

checkTables();
