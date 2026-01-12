require('dotenv').config();
const { Client } = require('pg');

(async function(){
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const today = new Date().toISOString().slice(0,10);

    const tanker = await client.query(`SELECT id, sale_date, tanker_sale_quantity, notes, created_at FROM tanker_sales WHERE sale_date = $1 ORDER BY created_at DESC LIMIT 20`, [today]);
    console.log('\n=== tanker_sales ===');
    console.log(JSON.stringify(tanker.rows, null, 2));

    const sheets = await client.query(`SELECT id, date, sheet_name, open_reading, close_reading, notes, created_at FROM sheet_records WHERE date = $1 ORDER BY created_at DESC LIMIT 20`, [today]);
    console.log('\n=== sheet_records ===');
    console.log(JSON.stringify(sheets.rows, null, 2));

  const attendance = await client.query(`SELECT id, attendance_date, employee_id, status, notes, created_at FROM attendance WHERE attendance_date = $1 ORDER BY created_at DESC LIMIT 20`, [today]);
  console.log('\n=== attendance ===');
  console.log(JSON.stringify(attendance.rows, null, 2));

    const entries = await client.query(`SELECT id, sale_date, employee_id, quantity, created_at FROM sale_entries WHERE sale_date = $1 ORDER BY created_at DESC LIMIT 20`, [today]);
    console.log('\n=== sale_entries ===');
    console.log(JSON.stringify(entries.rows, null, 2));

    const soi = await client.query(`SELECT id, inspection_date, fuel_product_id, dip_value, total_sale_liters, notes, created_at FROM sales_officer_inspections WHERE inspection_date = $1 ORDER BY created_at DESC LIMIT 20`, [today]);
    console.log('\n=== sales_officer_inspections ===');
    console.log(JSON.stringify(soi.rows, null, 2));

  } catch (err) {
    console.error('Error querying seeded data:', err.message || err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
