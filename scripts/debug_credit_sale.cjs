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
  if (!env.DATABASE_URL) { console.error('DATABASE_URL missing in .env'); process.exit(1); }
  const client = new Client({ connectionString: env.DATABASE_URL });
  await client.connect();

  try {
    console.log('Inspecting credit_sales columns via information_schema...');
    const colRes = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default, is_generated, generation_expression
      FROM information_schema.columns
      WHERE table_name='credit_sales'
      ORDER BY ordinal_position
    `);
    console.table(colRes.rows);

    console.log('\nListing triggers on credit_sales...');
    const trg = await client.query(`
      SELECT tgname, tgenabled, pg_get_triggerdef(oid) as def
      FROM pg_trigger
      WHERE tgrelid = 'credit_sales'::regclass
        AND NOT tgisinternal
    `);
    console.table(trg.rows.map(r => ({ name: r.tgname, enabled: r.tgenabled, def: r.def })));

    console.log('\nInserting a test credit sale row (quantity=7, price_per_unit=123.45)...');
    const insert = await client.query(`INSERT INTO credit_sales (credit_customer_id, vehicle_number, fuel_product_id, quantity, price_per_unit, created_at) VALUES ((SELECT id FROM credit_customers LIMIT 1), 'DBG-1', (SELECT id FROM fuel_products LIMIT 1), $1, $2, NOW()) RETURNING id, quantity, price_per_unit, total_amount`, [7, 123.45]);
    console.log('Insert result:', insert.rows[0]);

    console.log('\nSelecting the inserted row directly...');
    const sel = await client.query('SELECT * FROM credit_sales WHERE id=$1', [insert.rows[0].id]);
    console.log(sel.rows[0]);

    console.log('\nChecking any functions referenced by triggers (best-effort)...');
    const funcs = await client.query(`
      SELECT DISTINCT p.proname as func_name, pg_get_functiondef(p.oid) as def
      FROM pg_proc p
      JOIN pg_depend d ON d.objid = p.oid
      JOIN pg_trigger t ON t.oid = d.refobjid
      WHERE t.tgrelid = 'credit_sales'::regclass
    `);
    if (funcs.rows.length) {
      console.log('Found functions used by triggers:');
      funcs.rows.forEach(f => {
        console.log('---', f.func_name, '---');
        console.log(f.def);
      });
    } else {
      console.log('No external functions found referenced by triggers (or unable to detect).');
    }

    // cleanup inserted test row
    try {
      await client.query('DELETE FROM credit_sales WHERE id=$1', [insert.rows[0].id]);
      console.log('\nDeleted test credit_sale row.');
    } catch (e) {
      console.warn('Failed to delete test row:', e && e.message ? e.message : e);
    }

  } catch (err) {
    console.error('Debug script error:', err && err.message ? err.message : err);
  } finally {
    await client.end();
    process.exit(0);
  }
})();
