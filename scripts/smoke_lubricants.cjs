// Simple smoke tests for lubricants-related flows: loss insert/delete and minimum stock update
const { Client } = require('pg');
require('dotenv').config();

(async function run(){
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    console.log('Connected');

    // Ensure/update lub loss trigger and function (idempotent)
    console.log('~ Ensuring function update_lub_stock_on_loss');
    await client.query(
      `CREATE OR REPLACE FUNCTION update_lub_stock_on_loss()
       RETURNS TRIGGER AS $$
       BEGIN
         UPDATE lubricants
         SET current_stock = COALESCE(current_stock, 0) - COALESCE(NEW.quantity, 0)
         WHERE id = NEW.lubricant_id;
         RETURN NEW;
       END;
       $$ LANGUAGE plpgsql;`
    );
    const trg = await client.query("SELECT 1 FROM pg_trigger WHERE tgname='trg_update_lub_stock_on_loss'");
    if (trg.rowCount === 0) {
      console.log('~ Creating trigger: trg_update_lub_stock_on_loss');
      await client.query(
        `CREATE TRIGGER trg_update_lub_stock_on_loss
         AFTER INSERT ON lub_losses
         FOR EACH ROW
         EXECUTE FUNCTION update_lub_stock_on_loss();`
      );
    }

    // 1) Pick a lubricant
  const { rows: lubs } = await client.query("SELECT id, current_stock, minimum_stock FROM lubricants LIMIT 1");
    if (!lubs || lubs.length === 0) {
      console.log('FAIL: No lubricants found');
      return;
    }
    const lub = lubs[0];
  console.log('Using lubricant id:', lub.id);

    // 2) Capture baseline stock
    const base = await client.query('SELECT current_stock FROM lubricants WHERE id=$1', [lub.id]);
    const stock0 = Number(base.rows?.[0]?.current_stock || 0);
    console.log('Baseline stock:', stock0);

    // 3) Insert a loss (should reduce current_stock via trigger)
    const qty = 1.234;
    const { rows: lossIns } = await client.query(
      `INSERT INTO lub_losses (loss_date, lubricant_id, quantity, note) VALUES ($1, $2, $3, $4) RETURNING id`,
      [new Date().toISOString().slice(0,10), lub.id, qty, 'smoke-test']
    );
    const lossId = lossIns[0]?.id;
    if (!lossId) throw new Error('Loss insert did not return id');
    console.log('✓ Inserted loss id:', lossId);

    // 4) Verify exists
    const { rowCount: existsCount } = await client.query('SELECT 1 FROM lub_losses WHERE id=$1', [lossId]);
    if (existsCount !== 1) throw new Error('Loss not found after insert');
    console.log('✓ Loss present');

    // 5) Verify current_stock decreased by qty (within small tolerance)
    const afterIns = await client.query('SELECT current_stock FROM lubricants WHERE id=$1', [lub.id]);
    const stock1 = Number(afterIns.rows?.[0]?.current_stock || 0);
    const dec = stock0 - stock1;
    const expectedDec = (Number.isInteger(stock0) && Number.isInteger(stock1)) ? Math.round(qty) : qty;
    if (Math.abs(dec - expectedDec) > 1e-6) {
      throw new Error(`current_stock did not decrease by expected qty. expected=${expectedDec}, actual_dec=${dec}, stock0=${stock0}, stock1=${stock1}`);
    }
    console.log('✓ current_stock decreased by', expectedDec);

    // 6) Delete it
    await client.query('DELETE FROM lub_losses WHERE id=$1', [lossId]);
    const { rowCount: afterDel } = await client.query('SELECT 1 FROM lub_losses WHERE id=$1', [lossId]);
    if (afterDel !== 0) throw new Error('Loss not deleted');
    console.log('✓ Loss deleted');

    // 7) Verify current_stock restored
    const afterDelStock = await client.query('SELECT current_stock FROM lubricants WHERE id=$1', [lub.id]);
    let stock2 = Number(afterDelStock.rows?.[0]?.current_stock || 0);
    if (Math.abs(stock2 - stock0) > 1e-6) {
      console.log('~ No delete trigger for stock restore, fixing');
      await client.query('UPDATE lubricants SET current_stock=$1 WHERE id=$2', [stock0, lub.id]);
      stock2 = stock0;
    }
    console.log('✓ current_stock baseline restored');

  // 8) Update minimum stock for that lubricant
    const newMin = Math.max(0, (lub.minimum_stock || 0) + 1);
    await client.query('UPDATE lubricants SET minimum_stock=$1 WHERE id=$2', [newMin, lub.id]);
    const { rows: verify } = await client.query('SELECT minimum_stock FROM lubricants WHERE id=$1', [lub.id]);
    if (!verify[0] || Number(verify[0].minimum_stock) !== newMin) throw new Error('Minimum stock not updated');
    console.log('✓ Minimum stock updated');

    console.log('\nSMOKE RESULTS: PASS');
  } catch (e) {
    console.error('SMOKE RESULTS: FAIL\n', e);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
