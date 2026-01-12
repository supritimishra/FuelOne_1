#!/usr/bin/env node

/**
 * Manual E2E Testing Script for Financial Management
 * Tests Expenses, Recovery, Employee Cash Recovery, Business Cr/Dr, Vendor Transactions
 */

console.log('🚀 Starting Financial Management E2E Tests\n');
console.log('=' .repeat(60));

async function testServerConnectivity() {
  console.log('📡 Testing server connectivity...');
  
  try {
    const response = await fetch('http://localhost:5000');
    if (response.ok) {
      console.log('✅ Server is responding');
      const html = await response.text();
      console.log(`📄 Server returned ${html.length} characters`);
      return true;
    } else {
      console.log('❌ Server returned error:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Connection error:', error.message);
    return false;
  }
}

async function testExpensesWorkflow() {
  console.log('\n💸 Testing Expenses Workflow...');
  
  try {
    const response = await fetch('http://localhost:5000/api/expenses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Test-User': 'TestSprite'
      },
      body: JSON.stringify({
        expense_date: new Date().toISOString().split('T')[0],
        expense_type: 'Maintenance',
        amount: 5000,
        description: 'Pump maintenance',
        vendor_name: 'Test Vendor',
        payment_mode: 'Cash',
        invoice_number: 'INV-EXP-001',
        notes: 'Test expense entry'
      })
    });

    if (response.status === 401) {
      console.log('🔐 Expenses endpoint requires authentication');
      return { status: 'auth_required', message: 'Authentication required' };
    } else if (response.ok) {
      console.log('✅ Expenses endpoint accessible');
      return { status: 'success', message: 'Endpoint working' };
    } else if (response.status === 404) {
      console.log('❌ Expenses endpoint not found');
      return { status: 'not_found', message: 'Endpoint not implemented' };
    } else {
      console.log(`⚠️ Expenses endpoint returned: ${response.status}`);
      return { status: 'error', message: `Status: ${response.status}` };
    }
  } catch (error) {
    console.error('❌ Expenses test error:', error.message);
    return { status: 'error', message: error.message };
  }
}

async function testRecoveryWorkflow() {
  console.log('\n💰 Testing Recovery Workflow...');
  
  try {
    const response = await fetch('http://localhost:5000/api/recovery', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Test-User': 'TestSprite'
      },
      body: JSON.stringify({
        recovery_date: new Date().toISOString().split('T')[0],
        customer_id: 'test-customer-id',
        amount: 2500,
        description: 'Credit recovery',
        payment_mode: 'Cash',
        reference_number: 'REC-001',
        notes: 'Test recovery entry'
      })
    });

    if (response.status === 401) {
      console.log('🔐 Recovery endpoint requires authentication');
      return { status: 'auth_required', message: 'Authentication required' };
    } else if (response.ok) {
      console.log('✅ Recovery endpoint accessible');
      return { status: 'success', message: 'Endpoint working' };
    } else if (response.status === 404) {
      console.log('❌ Recovery endpoint not found');
      return { status: 'not_found', message: 'Endpoint not implemented' };
    } else {
      console.log(`⚠️ Recovery endpoint returned: ${response.status}`);
      return { status: 'error', message: `Status: ${response.status}` };
    }
  } catch (error) {
    console.error('❌ Recovery test error:', error.message);
    return { status: 'error', message: error.message };
  }
}

async function testEmployeeCashRecovery() {
  console.log('\n👨‍💼 Testing Employee Cash Recovery...');
  
  try {
    const response = await fetch('http://localhost:5000/api/employee-cash-recovery', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Test-User': 'TestSprite'
      },
      body: JSON.stringify({
        recovery_date: new Date().toISOString().split('T')[0],
        employee_id: 'test-employee-id',
        amount: 1000,
        description: 'Employee cash recovery',
        shift_id: 'test-shift-id',
        notes: 'Test employee cash recovery'
      })
    });

    if (response.status === 401) {
      console.log('🔐 Employee cash recovery endpoint requires authentication');
      return { status: 'auth_required', message: 'Authentication required' };
    } else if (response.ok) {
      console.log('✅ Employee cash recovery endpoint accessible');
      return { status: 'success', message: 'Endpoint working' };
    } else if (response.status === 404) {
      console.log('❌ Employee cash recovery endpoint not found');
      return { status: 'not_found', message: 'Endpoint not implemented' };
    } else {
      console.log(`⚠️ Employee cash recovery endpoint returned: ${response.status}`);
      return { status: 'error', message: `Status: ${response.status}` };
    }
  } catch (error) {
    console.error('❌ Employee cash recovery test error:', error.message);
    return { status: 'error', message: error.message };
  }
}

async function testBusinessCreditDebit() {
  console.log('\n📊 Testing Business Credit/Debit...');
  
  try {
    const response = await fetch('http://localhost:5000/api/business-crdr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Test-User': 'TestSprite'
      },
      body: JSON.stringify({
        transaction_date: new Date().toISOString().split('T')[0],
        transaction_type: 'Credit',
        amount: 10000,
        description: 'Business credit transaction',
        reference_number: 'BCR-001',
        notes: 'Test business credit entry'
      })
    });

    if (response.status === 401) {
      console.log('🔐 Business Cr/Dr endpoint requires authentication');
      return { status: 'auth_required', message: 'Authentication required' };
    } else if (response.ok) {
      console.log('✅ Business Cr/Dr endpoint accessible');
      return { status: 'success', message: 'Endpoint working' };
    } else if (response.status === 404) {
      console.log('❌ Business Cr/Dr endpoint not found');
      return { status: 'not_found', message: 'Endpoint not implemented' };
    } else {
      console.log(`⚠️ Business Cr/Dr endpoint returned: ${response.status}`);
      return { status: 'error', message: `Status: ${response.status}` };
    }
  } catch (error) {
    console.error('❌ Business Cr/Dr test error:', error.message);
    return { status: 'error', message: error.message };
  }
}

async function testVendorTransactions() {
  console.log('\n🏢 Testing Vendor Transactions...');
  
  try {
    const response = await fetch('http://localhost:5000/api/vendor-transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Test-User': 'TestSprite'
      },
      body: JSON.stringify({
        transaction_date: new Date().toISOString().split('T')[0],
        vendor_id: 'test-vendor-id',
        transaction_type: 'Payment',
        amount: 15000,
        description: 'Vendor payment',
        payment_mode: 'Bank Transfer',
        reference_number: 'VT-001',
        notes: 'Test vendor transaction'
      })
    });

    if (response.status === 401) {
      console.log('🔐 Vendor transactions endpoint requires authentication');
      return { status: 'auth_required', message: 'Authentication required' };
    } else if (response.ok) {
      console.log('✅ Vendor transactions endpoint accessible');
      return { status: 'success', message: 'Endpoint working' };
    } else if (response.status === 404) {
      console.log('❌ Vendor transactions endpoint not found');
      return { status: 'not_found', message: 'Endpoint not implemented' };
    } else {
      console.log(`⚠️ Vendor transactions endpoint returned: ${response.status}`);
      return { status: 'error', message: `Status: ${response.status}` };
    }
  } catch (error) {
    console.error('❌ Vendor transactions test error:', error.message);
    return { status: 'error', message: error.message };
  }
}

async function testBankTransactions() {
  console.log('\n🏦 Testing Bank Transactions...');
  
  try {
    const response = await fetch('http://localhost:5000/api/bank-transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Test-User': 'TestSprite'
      },
      body: JSON.stringify({
        transaction_date: new Date().toISOString().split('T')[0],
        bank_name: 'Test Bank',
        account_number: '1234567890',
        transaction_type: 'Deposit',
        amount: 50000,
        description: 'Daily deposit',
        reference_number: 'BT-001',
        notes: 'Test bank transaction'
      })
    });

    if (response.status === 401) {
      console.log('🔐 Bank transactions endpoint requires authentication');
      return { status: 'auth_required', message: 'Authentication required' };
    } else if (response.ok) {
      console.log('✅ Bank transactions endpoint accessible');
      return { status: 'success', message: 'Endpoint working' };
    } else if (response.status === 404) {
      console.log('❌ Bank transactions endpoint not found');
      return { status: 'not_found', message: 'Endpoint not implemented' };
    } else {
      console.log(`⚠️ Bank transactions endpoint returned: ${response.status}`);
      return { status: 'error', message: `Status: ${response.status}` };
    }
  } catch (error) {
    console.error('❌ Bank transactions test error:', error.message);
    return { status: 'error', message: error.message };
  }
}

async function testInterestTransactions() {
  console.log('\n📈 Testing Interest Transactions...');
  
  try {
    const response = await fetch('http://localhost:5000/api/interest-transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Test-User': 'TestSprite'
      },
      body: JSON.stringify({
        transaction_date: new Date().toISOString().split('T')[0],
        customer_id: 'test-customer-id',
        principal_amount: 10000,
        interest_rate: 12.5,
        interest_amount: 104.17,
        total_amount: 10104.17,
        notes: 'Test interest transaction'
      })
    });

    if (response.status === 401) {
      console.log('🔐 Interest transactions endpoint requires authentication');
      return { status: 'auth_required', message: 'Authentication required' };
    } else if (response.ok) {
      console.log('✅ Interest transactions endpoint accessible');
      return { status: 'success', message: 'Endpoint working' };
    } else if (response.status === 404) {
      console.log('❌ Interest transactions endpoint not found');
      return { status: 'not_found', message: 'Endpoint not implemented' };
    } else {
      console.log(`⚠️ Interest transactions endpoint returned: ${response.status}`);
      return { status: 'error', message: `Status: ${response.status}` };
    }
  } catch (error) {
    console.error('❌ Interest transactions test error:', error.message);
    return { status: 'error', message: error.message };
  }
}

async function runFinancialManagementTests() {
  console.log('🚀 Starting Financial Management E2E Tests\n');
  console.log('=' .repeat(60));

  // Test server connectivity
  const serverOk = await testServerConnectivity();
  if (!serverOk) {
    console.error('❌ Server connectivity failed. Exiting...');
    return;
  }

  // Test individual workflows
  const results = {
    expenses: await testExpensesWorkflow(),
    recovery: await testRecoveryWorkflow(),
    employeeCashRecovery: await testEmployeeCashRecovery(),
    businessCreditDebit: await testBusinessCreditDebit(),
    vendorTransactions: await testVendorTransactions(),
    bankTransactions: await testBankTransactions(),
    interestTransactions: await testInterestTransactions()
  };

  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📋 Financial Management Test Results:');
  console.log('=' .repeat(60));
  
  Object.entries(results).forEach(([test, result]) => {
    const status = result.status === 'success' ? '✅ PASSED' : 
                  result.status === 'auth_required' ? '🔐 AUTH REQUIRED' : 
                  result.status === 'not_found' ? '❌ NOT IMPLEMENTED' :
                  '❌ FAILED';
    console.log(`${status} ${test}: ${result.message}`);
  });

  const authRequiredCount = Object.values(results).filter(r => r.status === 'auth_required').length;
  const successCount = Object.values(results).filter(r => r.status === 'success').length;
  const notFoundCount = Object.values(results).filter(r => r.status === 'not_found').length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Overall Result:`);
  console.log(`   ✅ Successful: ${successCount}/${totalTests}`);
  console.log(`   🔐 Auth Required: ${authRequiredCount}/${totalTests}`);
  console.log(`   ❌ Not Implemented: ${notFoundCount}/${totalTests}`);
  console.log(`   ❌ Failed: ${totalTests - successCount - authRequiredCount - notFoundCount}/${totalTests}`);
  
  if (notFoundCount > 0) {
    console.log('\n❌ Missing Endpoints:');
    console.log('   Some financial management endpoints are not yet implemented.');
    console.log('   This indicates areas for future development.');
  }
  
  if (authRequiredCount > 0) {
    console.log('\n🔐 Authentication Required:');
    console.log('   The endpoints are working but require proper authentication.');
    console.log('   This is expected behavior for protected API endpoints.');
  }
  
  if (successCount === totalTests) {
    console.log('\n🎉 All financial management tests passed!');
  } else if (authRequiredCount === totalTests) {
    console.log('\n🔐 All tests require authentication - this is normal for protected endpoints.');
  } else {
    console.log('\n⚠️ Some tests failed or endpoints are missing. Check the logs above for details.');
  }
}

// Run the tests
runFinancialManagementTests().catch(console.error);
