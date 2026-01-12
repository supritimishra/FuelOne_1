
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';

const BASE_URL = 'http://localhost:5001/api';
const HEADERS = {
    'Content-Type': 'application/json',
    'x-test-user': 'TestSprite' // Bypass auth
};
const GENERATED_UUID = uuidv4();
console.log(`Using Test UUID: ${GENERATED_UUID}`);

async function testEndpoint(name, url, method, body = null) {
    console.log(`\n--- Testing ${name} ---`);
    console.log(`${method} ${url}`);
    try {
        const options = {
            method,
            headers: HEADERS,
        };
        if (body) options.body = JSON.stringify(body);

        const response = await fetch(`${BASE_URL}${url}`, options);
        let data;
        try {
            data = await response.json();
        } catch (e) {
            data = await response.text();
        }

        console.log(`Status: ${response.status}`);
        if (response.ok) {
            console.log('✅ Success:', typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
        } else {
            console.log('❌ Error:', typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
        }
        return data;
    } catch (error) {
        console.error('❌ Request Failed:', error.message);
    }
}

async function runTests() {
    console.log('🚀 Starting Relational Features Tests...');

    // 1. Interest Transactions
    // Note: UUIDs like 'employeeId' must be valid UUIDs to pass Zod schema validation if they are defined as UUIDs.
    // The placeholder 'c0b8e6a2-9f3b-4c7d-8e1f-2a3b4c5d6e7f' is a valid UUID string format.

    await testEndpoint('Interest Transactions (Post)', '/interest-trans', 'POST', {
        partyName: 'Test Party',
        transactionType: 'Loan Taken',
        loanAmount: '5000',
        transactionDate: '2025-12-21'
    });

    await testEndpoint('Interest Transactions (Get)', '/interest-trans/Test%20Party', 'GET');

    // 2. Sheet Records
    await testEndpoint('Sheet Records', '/sheet-records', 'POST', {
        openReading: '1000',
        closeReading: '1200',
        date: '2025-12-21'
    });

    // 3. Day Cash Reports
    await testEndpoint('Day Cash Report', '/day-cash-report?date=2025-12-21', 'GET');

    // 4. Tanker Sale
    await testEndpoint('Tanker Sale', '/tanker-sales', 'POST', {
        fuelProductId: GENERATED_UUID,
        tankerSaleQuantity: '500'
    });

    // 5. Guest Sales
    await testEndpoint('Guest Sales', '/guest-sales', 'POST', {
        fuelProductId: GENERATED_UUID,
        quantity: '10',
        pricePerUnit: '100',
        discount: '50'
    });

    // 6. Attendance
    await testEndpoint('Attendance', '/attendance', 'POST', {
        employeeId: GENERATED_UUID,
        status: 'Present',
        attendanceDate: '2025-12-21'
    });

    await testEndpoint('Attendance Summary', `/attendance/summary?employeeId=${GENERATED_UUID}&month=12&year=2025`, 'GET');

    // 7. Duty Pay
    await testEndpoint('Duty Pay', '/duty-pay', 'POST', {
        payMonth: '2025-12-01',
        totalSalary: '20000'
    });

    // 8. Sales Officer
    await testEndpoint('Sales Officer', '/sales-officer', 'POST', {
        fuelProductId: GENERATED_UUID,
        dipValue: '4000'
    });

    // 9. Credit Requests
    await testEndpoint('Credit Requests', '/credit-requests', 'POST', {
        creditCustomerId: GENERATED_UUID,
        orderedQuantity: '50'
    });

    // 10. Expiry Items
    await testEndpoint('Expiry Alerts', '/expiry-alerts', 'GET');

    // 11. Feedback
    await testEndpoint('Feedback', '/feedback', 'POST', {
        message: 'Great system!'
    });
    await testEndpoint('Feedback List', '/feedback', 'GET');
}

runTests();
