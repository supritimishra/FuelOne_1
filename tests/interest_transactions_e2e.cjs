const BASE = 'http://localhost:5000/api/interest-transactions';
// Using global fetch available in Node 18+

async function run() {
  console.log('E2E: Create a transaction');
  let res = await fetch(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ transaction_date: '2025-10-13', transaction_type: 'Loan Given', party_name: 'TestParty', loan_amount: 123.45, interest_amount: 0, principal_paid: 0, notes: 'E2E create' }) });
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
  res = await fetch(BASE + '/' + id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ transaction_date: '2025-10-14', transaction_type: 'Interest Paid', party_name: 'UpdatedParty', loan_amount: 123.45, interest_amount: 10, principal_paid: 50, notes: 'E2E update' }) });
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
