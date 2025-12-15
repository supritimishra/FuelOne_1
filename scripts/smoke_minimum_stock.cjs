// Smoke test for Minimum Stock: update and verify minimum_stock for a lubricant
const { Client } = require('pg');
require('dotenv').config();

(async function run(){
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    console.log('Connected');

    // Get one lubricant
    const { rows: lubs } = await client.query('SELECT id, minimum_stock FROM lubricants LIMIT 1');
    if (!lubs || lubs.length === 0) {
      console.log('FAIL: No lubricants found');
      return;
    }
    const lub = lubs[0];
    const origMin = lub.minimum_stock || 0;
    const newMin = origMin + 5;

    // Update minimum_stock
    await client.query('UPDATE lubricants SET minimum_stock=$1 WHERE id=$2', [newMin, lub.id]);
    const { rows: verify } = await client.query('SELECT minimum_stock FROM lubricants WHERE id=$1', [lub.id]);
    if (!verify[0] || Number(verify[0].minimum_stock) !== newMin) throw new Error('Minimum stock not updated');
    console.log('✓ Minimum stock updated to', newMin);

    // Restore original value
    await client.query('UPDATE lubricants SET minimum_stock=$1 WHERE id=$2', [origMin, lub.id]);
    console.log('✓ Minimum stock restored to', origMin);

    console.log('\nSMOKE MINIMUM STOCK: PASS');
  } catch (e) {
    console.error('SMOKE MINIMUM STOCK: FAIL\n', e);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
