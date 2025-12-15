const BASE = 'http://localhost:5000/api/interest-transactions';
const fetch = require('node-fetch');

async function run() {
  console.log('E2E: Create a transaction');
  let res = await fetch(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ transaction_date: '2025-10-13', credit_from: 'TestCred', debit_to: 'TestDeb', description: 'E2E create', amount: 123.45 }) });
  console.log('POST status', res.status);
  const created = await res.json();
  console.log('POST body', created);
  if (!created.ok) { console.error('Create failed'); process.exit(1); }

  const id = created.row.id;

  console.log('E2E: Fetch list');
  res = await fetch(BASE);
  console.log('GET status', res.status);
  const list = await res.json();
  console.log('GET body sample count', (list.rows || []).length);

  console.log('E2E: Update transaction');
  res = await fetch(BASE + '/' + id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ transaction_date: '2025-10-14', credit_from: 'UpdatedCred', debit_to: 'UpdatedDeb', description: 'E2E update', amount: 200 }) });
  console.log('PUT status', res.status);
  const updated = await res.json();
  console.log('PUT body', updated);
  if (!updated.ok) { console.error('Update failed'); process.exit(1); }

  console.log('E2E: Delete transaction');
  res = await fetch(BASE + '/' + id, { method: 'DELETE' });
  console.log('DELETE status', res.status);
  const del = await res.json();
  console.log('DELETE body', del);
  if (!del.ok) { console.error('Delete failed'); process.exit(1); }

  console.log('E2E: Done');
}

run().catch((e) => { console.error('E2E error', e); process.exit(1); });
