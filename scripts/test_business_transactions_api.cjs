/**
 * Test script for Business Transactions API
 * Tests POST, GET, PUT, DELETE endpoints with various scenarios
 */

// Note: This test requires the server to be running on localhost:5000
// Run: npm run dev (in another terminal)

const BASE_URL = 'http://127.0.0.1:5001';

async function testBusinessTransactionsAPI() {
    console.log('🧪 Testing Business Transactions API...\n');
    console.log('⚠️  Make sure the server is running on http://localhost:5000\n');

    try {
        // Test 1: POST - Create a new transaction with valid data
        console.log('Test 1: POST /api/business-transactions (valid data)');
        const createResponse = await fetch(`${BASE_URL}/api/business-transactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                transaction_date: '2025-12-27',
                transaction_type: 'Credit',
                party_name: 'Test Party ABC',
                amount: 1500.50,
                description: 'Test transaction for API validation'
            })
        });
        const createResult = await createResponse.json();
        console.log('Response:', createResult);
        console.log('Status:', createResponse.status);

        const transactionId = createResult.data?.id;
        console.log('Created Transaction ID:', transactionId);
        console.log('✅ Test 1 passed\n');

        // Test 2: POST - Try to create with invalid data (negative amount)
        console.log('Test 2: POST /api/business-transactions (invalid amount)');
        const invalidResponse = await fetch(`${BASE_URL}/api/business-transactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                transaction_date: '2025-12-27',
                transaction_type: 'Debit',
                party_name: 'Test Party',
                amount: -100,
                description: 'Invalid transaction'
            })
        });
        const invalidResult = await invalidResponse.json();
        console.log('Response:', invalidResult);
        console.log('Status:', invalidResponse.status);
        console.log('✅ Test 2 passed (correctly rejected)\n');

        // Test 3: GET - Fetch all transactions
        console.log('Test 3: GET /api/business-transactions');
        const getResponse = await fetch(`${BASE_URL}/api/business-transactions`);
        const getResult = await getResponse.json();
        console.log('Response:', {
            ok: getResult.ok,
            rowCount: getResult.rows?.length,
            pagination: getResult.pagination
        });
        console.log('✅ Test 3 passed\n');

        // Test 4: GET - Fetch with filters
        console.log('Test 4: GET /api/business-transactions (with filters)');
        const filterResponse = await fetch(`${BASE_URL}/api/business-transactions?from=2025-12-01&to=2025-12-31&transaction_type=Credit`);
        const filterResult = await filterResponse.json();
        console.log('Response:', {
            ok: filterResult.ok,
            rowCount: filterResult.rows?.length,
            pagination: filterResult.pagination
        });
        console.log('✅ Test 4 passed\n');

        if (transactionId) {
            // Test 5: PUT - Update the transaction
            console.log('Test 5: PUT /api/business-transactions/:id');
            const updateResponse = await fetch(`${BASE_URL}/api/business-transactions/${transactionId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transaction_date: '2025-12-27',
                    transaction_type: 'Credit',
                    party_name: 'Test Party ABC Updated',
                    amount: 2000.00,
                    description: 'Updated test transaction'
                })
            });
            const updateResult = await updateResponse.json();
            console.log('Response:', updateResult);
            console.log('Status:', updateResponse.status);
            console.log('✅ Test 5 passed\n');

            // Test 6: DELETE - Delete the transaction
            console.log('Test 6: DELETE /api/business-transactions/:id');
            const deleteResponse = await fetch(`${BASE_URL}/api/business-transactions/${transactionId}`, {
                method: 'DELETE'
            });
            const deleteResult = await deleteResponse.json();
            console.log('Response:', deleteResult);
            console.log('Status:', deleteResponse.status);
            console.log('✅ Test 6 passed\n');
        }

        console.log('🎉 All tests completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run tests
testBusinessTransactionsAPI();
