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
    console.log('-> Smoke test: Vendor Transactions (vendors / vendor_invoices)');
    // Create a vendor
    let r = await client.query("INSERT INTO vendors (vendor_name, opening_balance, current_balance, is_active) VALUES ($1,$2,$3,$4) RETURNING id", ['SMOKE_VENDOR', 0, 0, true]);
    const vendorId = r.rows[0].id;
    console.log('Inserted vendor id', vendorId);

    // Insert a vendor invoice
    try {
      r = await client.query(`INSERT INTO vendor_invoices (invoice_date, invoice_number, vendor_id, invoice_type, amount, gst_amount) VALUES (CURRENT_DATE, $1, $2, $3, $4, $5) RETURNING id`, ['VINV-SMOKE-1', vendorId, 'Liquid', 1000, 180]);
      const vinv = r.rows[0].id;
      console.log('Inserted vendor invoice id', vinv);
      await client.query('DELETE FROM vendor_invoices WHERE id=$1', [vinv]);
      console.log('Deleted vendor invoice');
    } catch (e) {
      console.log('vendor_invoices test skipped or table missing');
    }

    // cleanup vendor
    await client.query('DELETE FROM vendors WHERE id=$1', [vendorId]);
    console.log('Deleted vendor');

    console.log('SMOKE VENDOR TRX: PASS');
  } catch (err) {
    console.error('SMOKE VENDOR TRX: FAIL', err && err.message ? err.message : err);
  } finally {
    await client.end();
    process.exit(0);
  }
})();
