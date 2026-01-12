const { Client } = require('pg');
require('dotenv').config();

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    await client.connect();
    console.log('Connected to DB');

    // Insert a fuel product for tanker sales
    const fpRes = await client.query(
      `INSERT INTO fuel_products (product_name, short_name, is_active) VALUES ($1,$2,true) RETURNING id`,
      ['Test Fuel Product', 'TFP']
    );
    const fuelProductId = fpRes.rows[0].id;
    console.log('Inserted fuel_product id=', fuelProductId);

    // Insert a tank for that product
    const tankRes = await client.query(
      `INSERT INTO tanks (tank_number, fuel_product_id, capacity, current_stock) VALUES ($1,$2,$3,$4) RETURNING id, tank_number`,
      ['99', fuelProductId, 50000, 10000]
    );
    const tankId = tankRes.rows[0].id;
    console.log('Inserted tank id=', tankId);

    // Insert a tanker sale
    const saleRes = await client.query(
      `INSERT INTO tanker_sales (sale_date, fuel_product_id, before_dip_stock, gross_stock, tanker_sale_quantity, notes, created_at) VALUES ($1,$2,$3,$4,$5,$6, now()) RETURNING id`,
      [new Date().toISOString().slice(0,10), fuelProductId, 10000, 13000, 3000, 'Seeded tanker sale for testing']
    );
    console.log('Inserted tanker_sales id=', saleRes.rows[0].id);

    // Insert sheet record
    const sheetRes = await client.query(
      `INSERT INTO sheet_records (date, sheet_name, open_reading, close_reading, notes, created_at) VALUES ($1,$2,$3,$4,$5, now()) RETURNING id`,
      [new Date().toISOString().slice(0,10), 'Seed Sheet', 1000, 1300, 'Seeded sheet record']
    );
    console.log('Inserted sheet_records id=', sheetRes.rows[0].id);

    // Insert sale_entries (attendance)
    const employeeRes = await client.query(`SELECT id FROM employees LIMIT 1`);
    let employeeId;
    if (employeeRes.rows.length === 0) {
      const e = await client.query(`INSERT INTO employees (employee_name, is_active) VALUES ($1, true) RETURNING id`, ['Seed Employee']);
      employeeId = e.rows[0].id;
    } else {
      employeeId = employeeRes.rows[0].id;
    }
    const today = new Date().toISOString().slice(0,10);

    await client.query(`DELETE FROM attendance WHERE attendance_date = $1 AND employee_id = $2`, [today, employeeId]);
    const attendanceRes = await client.query(
      `INSERT INTO attendance (attendance_date, employee_id, status, notes, created_at)
       VALUES ($1,$2,$3,$4, now())
       RETURNING id`,
      [today, employeeId, 'Present', 'Seeded attendance record']
    );
  console.log('Inserted attendance id=', attendanceRes.rows[0].id);

    const entryRes = await client.query(
      `INSERT INTO sale_entries (sale_date, employee_id, quantity, created_at) VALUES ($1,$2,$3, now()) RETURNING id`,
      [today, employeeId, 50]
    );
    console.log('Inserted sale_entries id=', entryRes.rows[0].id);

    // Insert sales_officer_inspections
    const soiRes = await client.query(
      `INSERT INTO sales_officer_inspections (inspection_date, fuel_product_id, dip_value, total_sale_liters, notes, created_at) VALUES ($1,$2,$3,$4,$5, now()) RETURNING id`,
      [today, fuelProductId, 1200, 500, 'Seeded inspection for search testing']
    );
    console.log('Inserted sales_officer_inspections id=', soiRes.rows[0].id);

    console.log('Seeding completed.');
  } catch (err) {
    console.error('Seeding error:', err.message || err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

run();
