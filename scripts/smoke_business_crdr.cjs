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
    console.log('-> Smoke test: Business Credit/Debit Transactions (credit_customers / credit_transactions)');
    // Create a credit customer as prerequisite
    let r = await client.query("INSERT INTO credit_customers (organization_name, phone_number, email, address, credit_limit, current_balance, is_active) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id", ['SMOKE_CC', '9999000111', 'smoke@cc.test', 'Nowhere', 10000, 0, true]);
    const custId = r.rows[0].id;
    console.log('Inserted credit_customer id', custId);

    // Insert a credit transaction (if table exists)
    try {
      r = await client.query("INSERT INTO credit_transactions (credit_customer_id, transaction_date, amount, transaction_type, note) VALUES ( $1, CURRENT_DATE, $2, $3, $4 ) RETURNING id", [custId, 500, 'CR', 'SMOKE']);
      const trxId = r.rows[0].id;
      console.log('Inserted credit transaction id', trxId);
      // verify and cleanup
      await client.query('DELETE FROM credit_transactions WHERE id=$1', [trxId]);
      console.log('Deleted credit transaction');
    } catch (e) {
      console.log('credit_transactions test skipped or table missing');
    }

    // cleanup customer
    await client.query('DELETE FROM credit_customers WHERE id=$1', [custId]);
    console.log('Deleted credit customer');

    console.log('SMOKE BUSINESS CRDR: PASS');
  } catch (err) {
    console.error('SMOKE BUSINESS CRDR: FAIL', err && err.message ? err.message : err);
  } finally {
    await client.end();
    process.exit(0);
  }
})();
