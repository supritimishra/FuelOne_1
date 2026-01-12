

const BASE_URL = 'http://127.0.0.1:5001';

async function testVendorTransactions() {
    console.log('🧪 Testing Vendor Transactions API...');

    try {
        // 1. Fetch Vendors to get a valid ID
        console.log('Step 0: Fetching Vendors...');
        const vendorsRes = await fetch(`${BASE_URL}/api/vendors`);
        const vendorsData = await vendorsRes.json();

        if (!vendorsData.ok || !vendorsData.rows || vendorsData.rows.length === 0) {
            console.warn('⚠️ No vendors found. Cannot test Vendor Transactions fully without valid vendor_id.');
            // Attempt to proceed with a dummy ID might fail if FK is enforced, but let's try or return
            // If DB has foreign keys, this will fail.
            // But maybe we can create a vendor? The routes didn't show POST /vendors in the snippet I saw?
            // Actually I only saw GET /vendors.
            // Let's abort if no vendors.
            console.error('❌ Aborting test: No vendors available.');
            return;
        }

        const vendorId = vendorsData.rows[0].id;
        console.log(`✅ Using Vendor ID: ${vendorId} (${vendorsData.rows[0].vendor_name})`);

        // 2. POST - Create Transaction
        console.log('Test 1: POST /api/vendor-transactions');
        const createRes = await fetch(`${BASE_URL}/api/vendor-transactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                transaction_date: '2025-12-28',
                vendor_id: vendorId,
                transaction_type: 'Debit',
                amount: 500.00,
                payment_mode: 'Cash',
                description: 'Test Vendor Payment'
            })
        });
        const createResult = await createRes.json();
        console.log('Response:', createResult);

        if (!createResult.ok) throw new Error('Create failed: ' + createResult.error);
        const txId = createResult.data.id;
        console.log('✅ Created Transaction ID:', txId);

        // 3. GET - List Transactions
        console.log('Test 2: GET /api/vendor-transactions');
        const getRes = await fetch(`${BASE_URL}/api/vendor-transactions?vendor_id=${vendorId}`);
        const getResult = await getRes.json();
        console.log('Response rows count:', getResult.rows?.length);
        if (!getResult.ok) throw new Error('Get failed');
        console.log('✅ List fetched');

        // 4. PUT - Update Transaction
        console.log('Test 3: PUT /api/vendor-transactions/:id');
        const updateRes = await fetch(`${BASE_URL}/api/vendor-transactions/${txId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                transaction_date: '2025-12-28',
                vendor_id: vendorId,
                transaction_type: 'Debit',
                amount: 600.00, // Changed amount
                payment_mode: 'Bank', // Changed mode
                description: 'Updated Vendor Payment'
            })
        });
        const updateResult = await updateRes.json();
        console.log('Response:', updateResult);
        if (!updateResult.ok) throw new Error('Update failed');
        console.log('✅ Transaction updated');

        // 5. DELETE - Delete Transaction
        console.log('Test 4: DELETE /api/vendor-transactions/:id');
        const deleteRes = await fetch(`${BASE_URL}/api/vendor-transactions/${txId}`, {
            method: 'DELETE'
        });
        const deleteResult = await deleteRes.json();
        console.log('Response:', deleteResult);
        if (!deleteResult.ok) throw new Error('Delete failed');
        console.log('✅ Transaction deleted');

        console.log('🎉 All Vendor Transaction tests passed!');

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testVendorTransactions();
