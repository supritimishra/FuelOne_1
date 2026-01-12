#!/usr/bin/env node

/**
 * Manual E2E Testing Script for Reporting and Analytics
 * Tests Statement Generation, Stock Reports, Shift Sheets, Interest Trans, Attendance, Duty Pay
 */

console.log('🚀 Starting Reporting and Analytics E2E Tests\n');
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

async function testStatementGeneration() {
  console.log('\n📊 Testing Statement Generation...');
  
  try {
    const response = await fetch('http://localhost:5000/api/statements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Test-User': 'TestSprite'
      },
      body: JSON.stringify({
        customer_id: 'test-customer-id',
        start_date: '2025-01-01',
        end_date: '2025-01-31',
        statement_type: 'monthly',
        include_interest: true
      })
    });

    if (response.status === 401) {
      console.log('🔐 Statement generation endpoint requires authentication');
      return { status: 'auth_required', message: 'Authentication required' };
    } else if (response.ok) {
      console.log('✅ Statement generation endpoint accessible');
      return { status: 'success', message: 'Endpoint working' };
    } else if (response.status === 404) {
      console.log('❌ Statement generation endpoint not found');
      return { status: 'not_found', message: 'Endpoint not implemented' };
    } else {
      console.log(`⚠️ Statement generation endpoint returned: ${response.status}`);
      return { status: 'error', message: `Status: ${response.status}` };
    }
  } catch (error) {
    console.error('❌ Statement generation test error:', error.message);
    return { status: 'error', message: error.message };
  }
}

async function testStockReports() {
  console.log('\n📦 Testing Stock Reports...');
  
  try {
    const response = await fetch('http://localhost:5000/api/stock-reports', {
      headers: {
        'X-Test-User': 'TestSprite'
      }
    });

    if (response.status === 401) {
      console.log('🔐 Stock reports endpoint requires authentication');
      return { status: 'auth_required', message: 'Authentication required' };
    } else if (response.ok) {
      console.log('✅ Stock reports endpoint accessible');
      return { status: 'success', message: 'Endpoint working' };
    } else if (response.status === 404) {
      console.log('❌ Stock reports endpoint not found');
      return { status: 'not_found', message: 'Endpoint not implemented' };
    } else {
      console.log(`⚠️ Stock reports endpoint returned: ${response.status}`);
      return { status: 'error', message: `Status: ${response.status}` };
    }
  } catch (error) {
    console.error('❌ Stock reports test error:', error.message);
    return { status: 'error', message: error.message };
  }
}

async function testShiftSheets() {
  console.log('\n📋 Testing Shift Sheets...');
  
  try {
    const response = await fetch('http://localhost:5000/api/shift-sheets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Test-User': 'TestSprite'
      },
      body: JSON.stringify({
        shift_date: new Date().toISOString().split('T')[0],
        shift_id: 'test-shift-id',
        employee_id: 'test-employee-id',
        include_sales: true,
        include_stock: true
      })
    });

    if (response.status === 401) {
      console.log('🔐 Shift sheets endpoint requires authentication');
      return { status: 'auth_required', message: 'Authentication required' };
    } else if (response.ok) {
      console.log('✅ Shift sheets endpoint accessible');
      return { status: 'success', message: 'Endpoint working' };
    } else if (response.status === 404) {
      console.log('❌ Shift sheets endpoint not found');
      return { status: 'not_found', message: 'Endpoint not implemented' };
    } else {
      console.log(`⚠️ Shift sheets endpoint returned: ${response.status}`);
      return { status: 'error', message: `Status: ${response.status}` };
    }
  } catch (error) {
    console.error('❌ Shift sheets test error:', error.message);
    return { status: 'error', message: error.message };
  }
}

async function testInterestTransactions() {
  console.log('\n📈 Testing Interest Transactions Reports...');
  
  try {
    const response = await fetch('http://localhost:5000/api/interest-transactions', {
      headers: {
        'X-Test-User': 'TestSprite'
      }
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

async function testAttendanceReports() {
  console.log('\n👥 Testing Attendance Reports...');
  
  try {
    const response = await fetch('http://localhost:5000/api/attendance-reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Test-User': 'TestSprite'
      },
      body: JSON.stringify({
        start_date: '2025-01-01',
        end_date: '2025-01-31',
        employee_id: 'test-employee-id',
        report_type: 'monthly'
      })
    });

    if (response.status === 401) {
      console.log('🔐 Attendance reports endpoint requires authentication');
      return { status: 'auth_required', message: 'Authentication required' };
    } else if (response.ok) {
      console.log('✅ Attendance reports endpoint accessible');
      return { status: 'success', message: 'Endpoint working' };
    } else if (response.status === 404) {
      console.log('❌ Attendance reports endpoint not found');
      return { status: 'not_found', message: 'Endpoint not implemented' };
    } else {
      console.log(`⚠️ Attendance reports endpoint returned: ${response.status}`);
      return { status: 'error', message: `Status: ${response.status}` };
    }
  } catch (error) {
    console.error('❌ Attendance reports test error:', error.message);
    return { status: 'error', message: error.message };
  }
}

async function testDutyPayReports() {
  console.log('\n💰 Testing Duty Pay Reports...');
  
  try {
    const response = await fetch('http://localhost:5000/api/duty-pay-reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Test-User': 'TestSprite'
      },
      body: JSON.stringify({
        start_date: '2025-01-01',
        end_date: '2025-01-31',
        employee_id: 'test-employee-id',
        include_overtime: true,
        include_bonus: true
      })
    });

    if (response.status === 401) {
      console.log('🔐 Duty pay reports endpoint requires authentication');
      return { status: 'auth_required', message: 'Authentication required' };
    } else if (response.ok) {
      console.log('✅ Duty pay reports endpoint accessible');
      return { status: 'success', message: 'Endpoint working' };
    } else if (response.status === 404) {
      console.log('❌ Duty pay reports endpoint not found');
      return { status: 'not_found', message: 'Endpoint not implemented' };
    } else {
      console.log(`⚠️ Duty pay reports endpoint returned: ${response.status}`);
      return { status: 'error', message: `Status: ${response.status}` };
    }
  } catch (error) {
    console.error('❌ Duty pay reports test error:', error.message);
    return { status: 'error', message: error.message };
  }
}

async function testSalesReports() {
  console.log('\n📊 Testing Sales Reports...');
  
  try {
    const response = await fetch('http://localhost:5000/api/sales-reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Test-User': 'TestSprite'
      },
      body: JSON.stringify({
        start_date: '2025-01-01',
        end_date: '2025-01-31',
        report_type: 'daily',
        include_breakdown: true
      })
    });

    if (response.status === 401) {
      console.log('🔐 Sales reports endpoint requires authentication');
      return { status: 'auth_required', message: 'Authentication required' };
    } else if (response.ok) {
      console.log('✅ Sales reports endpoint accessible');
      return { status: 'success', message: 'Endpoint working' };
    } else if (response.status === 404) {
      console.log('❌ Sales reports endpoint not found');
      return { status: 'not_found', message: 'Endpoint not implemented' };
    } else {
      console.log(`⚠️ Sales reports endpoint returned: ${response.status}`);
      return { status: 'error', message: `Status: ${response.status}` };
    }
  } catch (error) {
    console.error('❌ Sales reports test error:', error.message);
    return { status: 'error', message: error.message };
  }
}

async function testFinancialReports() {
  console.log('\n💳 Testing Financial Reports...');
  
  try {
    const response = await fetch('http://localhost:5000/api/financial-reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Test-User': 'TestSprite'
      },
      body: JSON.stringify({
        start_date: '2025-01-01',
        end_date: '2025-01-31',
        report_type: 'profit_loss',
        include_details: true
      })
    });

    if (response.status === 401) {
      console.log('🔐 Financial reports endpoint requires authentication');
      return { status: 'auth_required', message: 'Authentication required' };
    } else if (response.ok) {
      console.log('✅ Financial reports endpoint accessible');
      return { status: 'success', message: 'Endpoint working' };
    } else if (response.status === 404) {
      console.log('❌ Financial reports endpoint not found');
      return { status: 'not_found', message: 'Endpoint not implemented' };
    } else {
      console.log(`⚠️ Financial reports endpoint returned: ${response.status}`);
      return { status: 'error', message: `Status: ${response.status}` };
    }
  } catch (error) {
    console.error('❌ Financial reports test error:', error.message);
    return { status: 'error', message: error.message };
  }
}

async function runReportingAnalyticsTests() {
  console.log('🚀 Starting Reporting and Analytics E2E Tests\n');
  console.log('=' .repeat(60));

  // Test server connectivity
  const serverOk = await testServerConnectivity();
  if (!serverOk) {
    console.error('❌ Server connectivity failed. Exiting...');
    return;
  }

  // Test individual workflows
  const results = {
    statementGeneration: await testStatementGeneration(),
    stockReports: await testStockReports(),
    shiftSheets: await testShiftSheets(),
    interestTransactions: await testInterestTransactions(),
    attendanceReports: await testAttendanceReports(),
    dutyPayReports: await testDutyPayReports(),
    salesReports: await testSalesReports(),
    financialReports: await testFinancialReports()
  };

  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📋 Reporting and Analytics Test Results:');
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
    console.log('   Some reporting and analytics endpoints are not yet implemented.');
    console.log('   This indicates areas for future development.');
  }
  
  if (authRequiredCount > 0) {
    console.log('\n🔐 Authentication Required:');
    console.log('   The endpoints are working but require proper authentication.');
    console.log('   This is expected behavior for protected API endpoints.');
  }
  
  if (successCount === totalTests) {
    console.log('\n🎉 All reporting and analytics tests passed!');
  } else if (authRequiredCount === totalTests) {
    console.log('\n🔐 All tests require authentication - this is normal for protected endpoints.');
  } else {
    console.log('\n⚠️ Some tests failed or endpoints are missing. Check the logs above for details.');
  }
}

// Run the tests
runReportingAnalyticsTests().catch(console.error);
