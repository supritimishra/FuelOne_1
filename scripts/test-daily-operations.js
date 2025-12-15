#!/usr/bin/env node

/**
 * Manual E2E Testing Script for Daily Operations
 * Tests Day Opening, Denominations, Sale Rate, Day Settlement
 */

console.log('🚀 Starting Daily Operations E2E Tests\n');
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

async function testDayOpeningWorkflow() {
  console.log('\n🌅 Testing Day Opening Workflow...');
  
  try {
    const response = await fetch('http://localhost:5000/api/day-opening', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Test-User': 'TestSprite'
      },
      body: JSON.stringify({
        opening_date: new Date().toISOString().split('T')[0],
        opening_stock_petrol: 5000,
        opening_stock_diesel: 8000,
        opening_cash: 10000,
        notes: 'Test day opening'
      })
    });

    if (response.status === 401) {
      console.log('🔐 Day opening endpoint requires authentication');
      return { status: 'auth_required', message: 'Authentication required' };
    } else if (response.ok) {
      console.log('✅ Day opening endpoint accessible');
      return { status: 'success', message: 'Endpoint working' };
    } else if (response.status === 404) {
      console.log('❌ Day opening endpoint not found');
      return { status: 'not_found', message: 'Endpoint not implemented' };
    } else {
      console.log(`⚠️ Day opening endpoint returned: ${response.status}`);
      return { status: 'error', message: `Status: ${response.status}` };
    }
  } catch (error) {
    console.error('❌ Day opening test error:', error.message);
    return { status: 'error', message: error.message };
  }
}

async function testDenominationsWorkflow() {
  console.log('\n💰 Testing Denominations Workflow...');
  
  try {
    const response = await fetch('http://localhost:5000/api/denominations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Test-User': 'TestSprite'
      },
      body: JSON.stringify({
        date: new Date().toISOString().split('T')[0],
        denominations: {
          '2000': 5,
          '500': 20,
          '200': 50,
          '100': 100,
          '50': 200,
          '20': 300,
          '10': 500,
          '5': 1000,
          '2': 2000,
          '1': 5000
        },
        total_cash: 50000
      })
    });

    if (response.status === 401) {
      console.log('🔐 Denominations endpoint requires authentication');
      return { status: 'auth_required', message: 'Authentication required' };
    } else if (response.ok) {
      console.log('✅ Denominations endpoint accessible');
      return { status: 'success', message: 'Endpoint working' };
    } else if (response.status === 404) {
      console.log('❌ Denominations endpoint not found');
      return { status: 'not_found', message: 'Endpoint not implemented' };
    } else {
      console.log(`⚠️ Denominations endpoint returned: ${response.status}`);
      return { status: 'error', message: `Status: ${response.status}` };
    }
  } catch (error) {
    console.error('❌ Denominations test error:', error.message);
    return { status: 'error', message: error.message };
  }
}

async function testSaleRateWorkflow() {
  console.log('\n⛽ Testing Sale Rate Workflow...');
  
  try {
    const response = await fetch('http://localhost:5000/api/sale-rates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Test-User': 'TestSprite'
      },
      body: JSON.stringify({
        date: new Date().toISOString().split('T')[0],
        fuel_product_id: 'test-fuel-id',
        sale_rate: 95.50,
        effective_from: new Date().toISOString(),
        notes: 'Test sale rate update'
      })
    });

    if (response.status === 401) {
      console.log('🔐 Sale rate endpoint requires authentication');
      return { status: 'auth_required', message: 'Authentication required' };
    } else if (response.ok) {
      console.log('✅ Sale rate endpoint accessible');
      return { status: 'success', message: 'Endpoint working' };
    } else if (response.status === 404) {
      console.log('❌ Sale rate endpoint not found');
      return { status: 'not_found', message: 'Endpoint not implemented' };
    } else {
      console.log(`⚠️ Sale rate endpoint returned: ${response.status}`);
      return { status: 'error', message: `Status: ${response.status}` };
    }
  } catch (error) {
    console.error('❌ Sale rate test error:', error.message);
    return { status: 'error', message: error.message };
  }
}

async function testDaySettlementWorkflow() {
  console.log('\n🏁 Testing Day Settlement Workflow...');
  
  try {
    const response = await fetch('http://localhost:5000/api/day-settlement', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Test-User': 'TestSprite'
      },
      body: JSON.stringify({
        settlement_date: new Date().toISOString().split('T')[0],
        closing_stock_petrol: 4500,
        closing_stock_diesel: 7500,
        closing_cash: 15000,
        total_sales: 5000,
        total_expenses: 1000,
        notes: 'Test day settlement'
      })
    });

    if (response.status === 401) {
      console.log('🔐 Day settlement endpoint requires authentication');
      return { status: 'auth_required', message: 'Authentication required' };
    } else if (response.ok) {
      console.log('✅ Day settlement endpoint accessible');
      return { status: 'success', message: 'Endpoint working' };
    } else if (response.status === 404) {
      console.log('❌ Day settlement endpoint not found');
      return { status: 'not_found', message: 'Endpoint not implemented' };
    } else {
      console.log(`⚠️ Day settlement endpoint returned: ${response.status}`);
      return { status: 'error', message: `Status: ${response.status}` };
    }
  } catch (error) {
    console.error('❌ Day settlement test error:', error.message);
    return { status: 'error', message: error.message };
  }
}

async function testShiftManagement() {
  console.log('\n👥 Testing Shift Management...');
  
  try {
    const response = await fetch('http://localhost:5000/api/shifts', {
      headers: {
        'X-Test-User': 'TestSprite'
      }
    });

    if (response.status === 401) {
      console.log('🔐 Shifts endpoint requires authentication');
      return { status: 'auth_required', message: 'Authentication required' };
    } else if (response.ok) {
      console.log('✅ Shifts endpoint accessible');
      return { status: 'success', message: 'Endpoint working' };
    } else if (response.status === 404) {
      console.log('❌ Shifts endpoint not found');
      return { status: 'not_found', message: 'Endpoint not implemented' };
    } else {
      console.log(`⚠️ Shifts endpoint returned: ${response.status}`);
      return { status: 'error', message: `Status: ${response.status}` };
    }
  } catch (error) {
    console.error('❌ Shift management test error:', error.message);
    return { status: 'error', message: error.message };
  }
}

async function testEmployeeAssignments() {
  console.log('\n👨‍💼 Testing Employee Assignments...');
  
  try {
    const response = await fetch('http://localhost:5000/api/employee-assignments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Test-User': 'TestSprite'
      },
      body: JSON.stringify({
        date: new Date().toISOString().split('T')[0],
        shift_id: 'test-shift-id',
        employee_id: 'test-employee-id',
        assignment_type: 'pump_operator',
        notes: 'Test employee assignment'
      })
    });

    if (response.status === 401) {
      console.log('🔐 Employee assignments endpoint requires authentication');
      return { status: 'auth_required', message: 'Authentication required' };
    } else if (response.ok) {
      console.log('✅ Employee assignments endpoint accessible');
      return { status: 'success', message: 'Endpoint working' };
    } else if (response.status === 404) {
      console.log('❌ Employee assignments endpoint not found');
      return { status: 'not_found', message: 'Endpoint not implemented' };
    } else {
      console.log(`⚠️ Employee assignments endpoint returned: ${response.status}`);
      return { status: 'error', message: `Status: ${response.status}` };
    }
  } catch (error) {
    console.error('❌ Employee assignments test error:', error.message);
    return { status: 'error', message: error.message };
  }
}

async function testDayCashReports() {
  console.log('\n📊 Testing Day Cash Reports...');
  
  try {
    const response = await fetch('http://localhost:5000/api/day-cash-reports', {
      headers: {
        'X-Test-User': 'TestSprite'
      }
    });

    if (response.status === 401) {
      console.log('🔐 Day cash reports endpoint requires authentication');
      return { status: 'auth_required', message: 'Authentication required' };
    } else if (response.ok) {
      console.log('✅ Day cash reports endpoint accessible');
      return { status: 'success', message: 'Endpoint working' };
    } else if (response.status === 404) {
      console.log('❌ Day cash reports endpoint not found');
      return { status: 'not_found', message: 'Endpoint not implemented' };
    } else {
      console.log(`⚠️ Day cash reports endpoint returned: ${response.status}`);
      return { status: 'error', message: `Status: ${response.status}` };
    }
  } catch (error) {
    console.error('❌ Day cash reports test error:', error.message);
    return { status: 'error', message: error.message };
  }
}

async function runDailyOperationsTests() {
  console.log('🚀 Starting Daily Operations E2E Tests\n');
  console.log('=' .repeat(60));

  // Test server connectivity
  const serverOk = await testServerConnectivity();
  if (!serverOk) {
    console.error('❌ Server connectivity failed. Exiting...');
    return;
  }

  // Test individual workflows
  const results = {
    dayOpening: await testDayOpeningWorkflow(),
    denominations: await testDenominationsWorkflow(),
    saleRate: await testSaleRateWorkflow(),
    daySettlement: await testDaySettlementWorkflow(),
    shiftManagement: await testShiftManagement(),
    employeeAssignments: await testEmployeeAssignments(),
    dayCashReports: await testDayCashReports()
  };

  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📋 Daily Operations Test Results:');
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
    console.log('   Some daily operations endpoints are not yet implemented.');
    console.log('   This indicates areas for future development.');
  }
  
  if (authRequiredCount > 0) {
    console.log('\n🔐 Authentication Required:');
    console.log('   The endpoints are working but require proper authentication.');
    console.log('   This is expected behavior for protected API endpoints.');
  }
  
  if (successCount === totalTests) {
    console.log('\n🎉 All daily operations tests passed!');
  } else if (authRequiredCount === totalTests) {
    console.log('\n🔐 All tests require authentication - this is normal for protected endpoints.');
  } else {
    console.log('\n⚠️ Some tests failed or endpoints are missing. Check the logs above for details.');
  }
}

// Run the tests
runDailyOperationsTests().catch(console.error);
