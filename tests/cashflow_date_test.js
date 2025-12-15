(async ()=>{
  const base = process.env.BASE_URL || 'http://localhost:5000';
  const fetch = globalThis.fetch || (await import('node-fetch')).default;
  // Use a reasonable date range; adjust if your DB uses different dates
  const from = '2024-01-01';
  const to = '2026-12-31';

  try {
    const res = await fetch(`${base}/api/reports/cashflow?from=${from}&to=${to}`);
    const body = await res.json();
    if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + JSON.stringify(body));
    if (!body.ok) throw new Error('report returned ok:false ' + JSON.stringify(body));
    const row = body.rows && body.rows[0];
    if (!row) throw new Error('no rows in response');
    const keys = ['total_inflows','total_outflows','net_cashflow'];
    for (const k of keys) {
      if (typeof row[k] !== 'number') throw new Error(k + ' is not a number');
    }
    console.log('cashflow_date_test: PASS', { from, to, row });
    process.exit(0);
  } catch (err) {
    console.error('cashflow_date_test: FAIL', err.message || err);
    process.exit(2);
  }
})();
