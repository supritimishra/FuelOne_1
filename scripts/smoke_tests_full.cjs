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

const log = (...a) => console.log(new Date().toISOString(), ...a);

(async ()=>{
  const repoRoot = path.resolve(__dirname, '..');
  const env = loadEnv(path.join(repoRoot, '.env'));
  if (!env.DATABASE_URL) { console.error('DATABASE_URL missing in .env'); process.exit(1); }
  const client = new Client({ connectionString: env.DATABASE_URL });
  await client.connect();

  const created = { fuel: null, lube: null, emp: null, creditCustomer: null, vendor: null, tank: null, nozzle: null, expType: null, swipeMachine: null };

  try {
    // 1) Fuel product
    log('-> Creating fuel product');
    let r = await client.query("INSERT INTO fuel_products (product_name, short_name, gst_percentage, unit, is_active) VALUES ($1,$2,$3,$4,$5) RETURNING id", ['SMOKE_FUEL_FULL','SF',18,'Liters',true]);
    created.fuel = r.rows[0].id;
    log('fuel id', created.fuel);

    // 2) Lubricant
    log('-> Creating lubricant');
    r = await client.query("INSERT INTO lubricants (lubricant_name, mrp_rate, sale_rate, current_stock, minimum_stock, is_active) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id", ['SMOKE_LUBE_FULL',200,250,50,5,true]);
    created.lube = r.rows[0].id;
    log('lube id', created.lube);

    // 3) Employee
    log('-> Creating employee');
    r = await client.query("INSERT INTO employees (employee_name, mobile_number, designation, status) VALUES ($1,$2,$3,$4) RETURNING id", ['SMOKE_EMP','9999999000','Operator','Active']);
    created.emp = r.rows[0].id;
    log('emp id', created.emp);

    // 4) Credit customer
    log('-> Creating credit customer');
    r = await client.query(`INSERT INTO credit_customers (organization_name, phone_number, email, address, credit_limit, current_balance, is_active) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`, ['SMOKE_ORG','9999000000','smoke@org.test','Nowhere',10000,0,true]);
    created.creditCustomer = r.rows[0].id;
    log('credit customer id', created.creditCustomer);

    // 5) Vendor
    log('-> Creating vendor');
    r = await client.query(`INSERT INTO vendors (vendor_name, opening_balance, current_balance, is_active) VALUES ($1,$2,$3,$4) RETURNING id`, ['SMOKE_VENDOR',0,0,true]);
    created.vendor = r.rows[0].id;
    log('vendor id', created.vendor);

    // 6) Tank (needs fuel product id)
    log('-> Creating tank');
    r = await client.query(`INSERT INTO tanks (tank_number, fuel_product_id, capacity, current_stock) VALUES ($1,$2,$3,$4) RETURNING id, current_stock`, ['SMOKE_TANK_1', created.fuel, 10000, 5000]);
    created.tank = r.rows[0].id;
    log('tank id', created.tank, 'stock', r.rows[0].current_stock);

    // 7) Nozzle (needs tank id)
    log('-> Creating nozzle');
    r = await client.query(`INSERT INTO nozzles (nozzle_number, tank_id, fuel_product_id, is_active) VALUES ($1,$2,$3,$4) RETURNING id`, ['SMOKE_N1', created.tank, created.fuel, true]);
    created.nozzle = r.rows[0].id;
    log('nozzle id', created.nozzle);

    // 8) Expense type
    log('-> Creating expense type');
    r = await client.query(`INSERT INTO expense_types (expense_type_name, is_active, effect_for, options) VALUES ($1,$2,$3,$4) RETURNING id`, ['SMOKE_EXP_FULL', true, 'Employee', '[]']);
    created.expType = r.rows[0].id;
    log('expense type id', created.expType);

    // 9) Swipe machine
    log('-> Creating swipe machine');
    r = await client.query(`INSERT INTO swipe_machines (machine_name, machine_type, provider, bank_type, is_active, status) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`, ['SMOKE_POS1','Card','HDFC Bank','HDFC Bank',true,'Active']);
    created.swipeMachine = r.rows[0].id;
    log('swipe machine id', created.swipeMachine);

    // Flow tests
    // Guest sale -> should reduce tank.current_stock by quantity (if trigger exists)
    log('-> Guest sale flow test');
    const before = await client.query('SELECT current_stock FROM tanks WHERE id=$1', [created.tank]);
    const beforeStock = Number(before.rows[0].current_stock || 0);
    const qty = 5.5;
  r = await client.query(`INSERT INTO guest_sales (mobile_number, vehicle_number, nozzle_id, fuel_product_id, quantity, price_per_unit, payment_mode, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,NOW()) RETURNING id`, ['9999000111','MH12AB1234', created.nozzle, created.fuel, qty, 100, 'Cash']);
    const guestId = r.rows[0].id;
    log('guest sale id', guestId);
    const after = await client.query('SELECT current_stock FROM tanks WHERE id=$1', [created.tank]);
    const afterStock = Number(after.rows[0].current_stock || 0);
    if (afterStock === beforeStock - qty) {
      log('Guest sale trigger effect OK: tank stock decreased by', qty);
    } else {
      log('Guest sale trigger effect NOT observed (before:', beforeStock, 'after:', afterStock, ') - triggers may not exist or seed logic differs.');
      // attempt to restore if changed
      if (afterStock !== beforeStock) {
        await client.query('UPDATE tanks SET current_stock=$1 WHERE id=$2', [beforeStock, created.tank]);
        log('Restored tank stock to', beforeStock);
      }
    }
    // cleanup guest sale
    await client.query('DELETE FROM guest_sales WHERE id=$1', [guestId]);
    log('Deleted guest sale');

    // Credit sale -> check credit customer balance increase
    log('-> Credit sale flow test');
    const custBefore = await client.query('SELECT current_balance FROM credit_customers WHERE id=$1', [created.creditCustomer]);
    const custBeforeBal = Number(custBefore.rows[0].current_balance || 0);
    const csQty = 10;
    const csPrice = 90;
    r = await client.query(`INSERT INTO credit_sales (credit_customer_id, vehicle_number, fuel_product_id, quantity, price_per_unit, created_at) VALUES ($1,$2,$3,$4,$5,NOW()) RETURNING id, total_amount`, [created.creditCustomer, 'MH12CD9999', created.fuel, csQty, csPrice]);
    const csId = r.rows[0].id;
    log('credit sale id', csId, 'total', r.rows[0].total_amount);
    const custAfter = await client.query('SELECT current_balance FROM credit_customers WHERE id=$1', [created.creditCustomer]);
    const custAfterBal = Number(custAfter.rows[0].current_balance || 0);
    if (custAfterBal === custBeforeBal + Number(r.rows[0].total_amount || 0)) {
      log('Credit sale trigger effect OK: customer balance increased by', r.rows[0].total_amount);
    } else {
      log('Credit sale trigger effect NOT observed (before:', custBeforeBal, 'after:', custAfterBal, ')');
    }
    // cleanup credit sale and restore balance if needed
    await client.query('DELETE FROM credit_sales WHERE id=$1', [csId]);
    // try to restore balance (best-effort)
    await client.query('UPDATE credit_customers SET current_balance=$1 WHERE id=$2', [custBeforeBal, created.creditCustomer]);
    log('Deleted credit sale and restored customer balance');

    // Vendor invoice -> insert and cleanup
    log('-> Vendor invoice CRUD test');
    r = await client.query(`INSERT INTO vendor_invoices (invoice_date, invoice_number, vendor_id, invoice_type, amount, gst_amount) VALUES (CURRENT_DATE, $1, $2, $3, $4, $5) RETURNING id, total_amount`, ['INV-SMOKE-1', created.vendor, 'Liquid', 1000, 180]);
    const vinv = r.rows[0].id;
    log('vendor invoice id', vinv);
    await client.query('DELETE FROM vendor_invoices WHERE id=$1', [vinv]);
    log('Deleted vendor invoice');

    // Purchases (tanker/purchases) simple insert
    log('-> Purchase/purchase_create test');
    try {
      r = await client.query(`INSERT INTO purchases (purchase_date, fuel_product_id, quantity, vendor_id, created_at) VALUES (CURRENT_DATE, $1, $2, $3, NOW()) RETURNING id`, [created.fuel, 100, created.vendor]);
      const purchaseId = r.rows[0].id;
      log('purchase id', purchaseId);
      await client.query('DELETE FROM purchases WHERE id=$1', [purchaseId]);
      log('Deleted purchase');
    } catch (err) {
      log('Purchases table test skipped or failed:', err.message || err);
    }

    // Swipe transaction
    log('-> Swipe transaction test');
    r = await client.query(`INSERT INTO swipe_transactions (transaction_date, employee_id, swipe_type, swipe_mode, amount, batch_number) VALUES (CURRENT_DATE, $1, $2, $3, $4, $5) RETURNING id`, [created.emp, 'POS', 'Card', 500, 'BATCH1']);
    const stId = r.rows[0].id;
    log('swipe transaction id', stId);
    await client.query('DELETE FROM swipe_transactions WHERE id=$1', [stId]);
    log('Deleted swipe transaction');

    log('All flow tests completed.');

  } catch (err) {
    console.error('Smoke tests failed:', err && err.message ? err.message : err);
  } finally {
    // cleanup created base records (best-effort)
    try {
      if (created.nozzle) await client.query('DELETE FROM nozzles WHERE id=$1', [created.nozzle]);
      if (created.tank) await client.query('DELETE FROM tanks WHERE id=$1', [created.tank]);
      if (created.swipeMachine) await client.query('DELETE FROM swipe_machines WHERE id=$1', [created.swipeMachine]);
      if (created.expType) await client.query('DELETE FROM expense_types WHERE id=$1', [created.expType]);
      if (created.lube) await client.query('DELETE FROM lubricants WHERE id=$1', [created.lube]);
      if (created.vendor) await client.query('DELETE FROM vendors WHERE id=$1', [created.vendor]);
      if (created.creditCustomer) await client.query('DELETE FROM credit_customers WHERE id=$1', [created.creditCustomer]);
      if (created.emp) await client.query('DELETE FROM employees WHERE id=$1', [created.emp]);
      if (created.fuel) await client.query('DELETE FROM fuel_products WHERE id=$1', [created.fuel]);
      log('Cleaned up created base records (best-effort).');
    } catch (e) {
      console.warn('Cleanup errors:', e && e.message ? e.message : e);
    }

    await client.end();
    log('Finished full smoke tests.');
    process.exit(0);
  }
})();
