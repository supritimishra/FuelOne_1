require('dotenv').config();
const { Client } = require('pg');

(async function(){
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const today = new Date().toISOString().slice(0,10);
    const res = await client.query(`SELECT id, sale_date, tanker_sale_quantity, notes, created_at FROM tanker_sales WHERE sale_date = $1 ORDER BY created_at DESC LIMIT 20`, [today]);
    console.log('Rows:', JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('Error querying tanker_sales:', err.message || err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
