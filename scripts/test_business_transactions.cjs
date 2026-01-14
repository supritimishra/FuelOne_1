const { Client } = require('pg');
require('dotenv').config();

(async () => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) { console.error('DATABASE_URL not set in .env'); process.exit(1); }
  const client = new Client({ connectionString: dbUrl });
  await client.connect();
  try {
    const now = new Date().toISOString().slice(0,10);
    const inserts = [
      { transaction_date: now, transaction_type: 'Credit', party_name: 'Test Party A', amount: 123.45, description: 'Auto test A' },
      { transaction_date: now, transaction_type: 'Debit', party_name: 'Test Party B', amount: 50, description: 'Auto test B' }
    ];
    for (const row of inserts) {
      const q = 'INSERT INTO business_transactions(transaction_date, transaction_type, party_name, amount, description) VALUES($1,$2,$3,$4,$5) RETURNING id';
      const res = await client.query(q, [row.transaction_date, row.transaction_type, row.party_name, row.amount, row.description]);
      console.log('Inserted id', res.rows[0].id);
    }

    const res = await client.query('SELECT id, transaction_date, transaction_type, party_name, amount, description FROM business_transactions ORDER BY created_at DESC LIMIT 10');
    console.log('Latest rows:');
    console.table(res.rows.map(r => ({ id: r.id, date: r.transaction_date, party: r.party_name, type: r.transaction_type, amount: r.amount, desc: r.description })));
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
