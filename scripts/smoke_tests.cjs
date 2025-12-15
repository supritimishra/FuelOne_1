const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

function loadEnv(envPath) {
  const content = fs.readFileSync(envPath, 'utf8');
  const lines = content.split(/\r?\n/);
  const map = {};
  for (const l of lines) {
    const m = l.match(/^([^#=]+)=(.*)$/);
    if (m) {
      const k = m[1].trim();
      let v = m[2].trim();
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
      map[k] = v;
    }
  }
  return map;
}

(async ()=>{
  const repoRoot = path.resolve(__dirname, '..');
  const env = loadEnv(path.join(repoRoot, '.env'));
  const client = new Client({ connectionString: env.DATABASE_URL });
  await client.connect();

  const tests = [];

  // Fuel product CRUD
  tests.push((async ()=>{
    try {
      const res = await client.query("INSERT INTO fuel_products (product_name, short_name, gst_percentage, is_active) VALUES ($1,$2,$3,$4) RETURNING id, product_name", ['SMOKE_FUEL','SF',18,true]);
      const id = res.rows[0].id;
      console.log('Fuel insert ok', res.rows[0]);
      await client.query('UPDATE fuel_products SET product_name=$1 WHERE id=$2', ['SMOKE_FUEL_UPD', id]);
      console.log('Fuel update ok');
      await client.query('DELETE FROM fuel_products WHERE id=$1', [id]);
      console.log('Fuel delete ok');
    } catch (err) { console.error('Fuel test failed:', err.message || err); }
  })());

  // Expense types CRUD
  tests.push((async ()=>{
    try {
      const res = await client.query("INSERT INTO expense_types (expense_type_name, is_active, effect_for) VALUES ($1,$2,$3) RETURNING id", ['SMOKE_EXP', true, 'Employee']);
      const id = res.rows[0].id;
      console.log('Expense insert ok', id);
      await client.query('UPDATE expense_types SET expense_type_name=$1 WHERE id=$2', ['SMOKE_EXP_UPD', id]);
      console.log('Expense update ok');
      await client.query('DELETE FROM expense_types WHERE id=$1', [id]);
      console.log('Expense delete ok');
    } catch (err) { console.error('Expense test failed:', err.message || err); }
  })());

  // Lubricants CRUD
  tests.push((async ()=>{
    try {
      const res = await client.query("INSERT INTO lubricants (lubricant_name, mrp_rate, sale_rate, current_stock, minimum_stock, is_active) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id", ['SMOKE_LUBE', 100, 150, 10, 1, true]);
      const id = res.rows[0].id;
      console.log('Lubricant insert ok', id);
      await client.query('UPDATE lubricants SET lubricant_name=$1 WHERE id=$2', ['SMOKE_LUBE_UPD', id]);
      console.log('Lubricant update ok');
      await client.query('DELETE FROM lubricants WHERE id=$1', [id]);
      console.log('Lubricant delete ok');
    } catch (err) { console.error('Lubricant test failed:', err.message || err); }
  })());

  await Promise.all(tests);
  await client.end();
  console.log('Smoke tests finished');
})();
