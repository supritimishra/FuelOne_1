const fs = require('fs');
const path = require('path');

function loadEnv(envPath) {
  try {
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split(/\r?\n/);
    const map = {};
    for (const l of lines) {
      const m = l.match(/^([^#=]+)=(.*)$/);
      if (m) map[m[1].trim()] = m[2].trim().replace(/^"(.*)"$/, '$1');
    }
    return map;
  } catch (e) { return {}; }
}

async function run() {
  const repoRoot = path.resolve(__dirname, '..');
  let env = loadEnv(path.join(repoRoot, '.env'));
  if (!env.DATABASE_URL) env = loadEnv(path.join(repoRoot, '.local.env'));

  const BASE_URL = 'http://localhost:5005';

  console.log('='.repeat(60));
  console.log('BUSINESS TRANSACTIONS API TEST');
  console.log('='.repeat(60));

  try {
    // Step 1: Get auth token
    console.log('\n[1] Getting auth token...');
    const authRes = await fetch(`${BASE_URL}/api/auth/dev-reset`, { method: 'POST' });
    const authData = await authRes.json();

    if (!authData.token) {
      console.error('❌ Failed to get token:', authData);
      process.exit(1);
    }

    const token = authData.token;
    console.log('✅ Token obtained');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Step 2: Fetch customers
    console.log('\n[2] Fetching credit customers...');
    const customersRes = await fetch(`${BASE_URL}/api/credit-customers`, { headers });
    const customersData = await customersRes.json();

    if (!customersData.ok) {
      console.error('❌ Failed to fetch customers:', customersData);
      process.exit(1);
    }

    console.log(`✅ Fetched ${customersData.rows.length} customers`);
    if (customersData.rows.length > 0) {
      console.log(`   Sample: ${customersData.rows[0].organization_name}`);
    }

    // Step 3: Fetch vendors
    console.log('\n[3] Fetching vendors...');
    const vendorsRes = await fetch(`${BASE_URL}/api/vendors`, { headers });
    const vendorsData = await vendorsRes.json();

    if (!vendorsData.ok) {
      console.error('❌ Failed to fetch vendors:', vendorsData);
      process.exit(1);
    }

    console.log(`✅ Fetched ${vendorsData.rows.length} vendors`);
    if (vendorsData.rows.length > 0) {
      console.log(`   Sample: ${vendorsData.rows[0].vendor_name}`);
    }

    // Step 4: Create a Credit transaction
    console.log('\n[4] Creating Credit transaction...');
    const creditPayload = {
      transaction_date: new Date().toISOString().slice(0, 10),
      transaction_type: 'Credit',
      party_name: 'Test Party Credit',
      amount: 5000,
      description: 'Test credit transaction'
    };

    const creditRes = await fetch(`${BASE_URL}/api/business-transactions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(creditPayload)
    });

    const creditData = await creditRes.json();

    if (!creditData.ok) {
      console.error('❌ Failed to create credit transaction:', creditData);
      process.exit(1);
    }

    console.log('✅ Credit transaction created:', creditData.data.id);
    const creditId = creditData.data.id;

    // Step 5: Create a Debit transaction
    console.log('\n[5] Creating Debit transaction...');
    const debitPayload = {
      transaction_date: new Date().toISOString().slice(0, 10),
      transaction_type: 'Debit',
      party_name: 'Test Party Debit',
      amount: 3000,
      description: 'Test debit transaction'
    };

    const debitRes = await fetch(`${BASE_URL}/api/business-transactions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(debitPayload)
    });

    const debitData = await debitRes.json();

    if (!debitData.ok) {
      console.error('❌ Failed to create debit transaction:', debitData);
      process.exit(1);
    }

    console.log('✅ Debit transaction created:', debitData.data.id);
    const debitId = debitData.data.id;

    // Step 6: Fetch all transactions
    console.log('\n[6] Fetching all transactions...');
    const listRes = await fetch(`${BASE_URL}/api/business-transactions`, { headers });
    const listData = await listRes.json();

    if (!listData.ok) {
      console.error('❌ Failed to fetch transactions:', listData);
      process.exit(1);
    }

    console.log(`✅ Fetched ${listData.rows.length} transactions`);

    const foundCredit = listData.rows.find(r => r.id === creditId);
    const foundDebit = listData.rows.find(r => r.id === debitId);

    if (!foundCredit || !foundDebit) {
      console.error('❌ Created transactions not found in list');
      process.exit(1);
    }

    console.log('✅ Both test transactions verified in list');

    // Step 7: Delete test transactions
    console.log('\n[7] Cleaning up test transactions...');

    const delCredit = await fetch(`${BASE_URL}/api/business-transactions/${creditId}`, {
      method: 'DELETE',
      headers
    });
    const delCreditData = await delCredit.json();

    if (!delCreditData.ok) {
      console.error('❌ Failed to delete credit transaction:', delCreditData);
    } else {
      console.log('✅ Credit transaction deleted');
    }

    const delDebit = await fetch(`${BASE_URL}/api/business-transactions/${debitId}`, {
      method: 'DELETE',
      headers
    });
    const delDebitData = await delDebit.json();

    if (!delDebitData.ok) {
      console.error('❌ Failed to delete debit transaction:', delDebitData);
    } else {
      console.log('✅ Debit transaction deleted');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS PASSED');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    process.exit(1);
  }
}

run();
