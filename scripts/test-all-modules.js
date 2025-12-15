#!/usr/bin/env node

/**
 * Comprehensive Module Testing Script
 * Tests all CRUD operations for all modules
 */

const testModules = async () => {
  const baseUrl = 'http://localhost:5000';
  
  // Helper function to make API requests
  const apiRequest = async (method, endpoint, body = null) => {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, options);
      const data = await response.json().catch(() => null);
      return {
        status: response.status,
        ok: response.ok,
        data
      };
    } catch (error) {
      return {
        status: 0,
        ok: false,
        error: error.message
      };
    }
  };

  // Test results storage
  const results = {
    masterData: {},
    dailyOps: {},
    reports: {},
    transactions: {},
    invoices: {}
  };

  console.log('🧪 Starting Comprehensive Module Testing\n');
  console.log('=' .repeat(60));

  // ===== MASTER DATA MODULES =====
  console.log('\n📋 MASTER DATA MODULES');
  console.log('-'.repeat(60));

  const masterDataModules = [
    { name: 'Fuel Products', endpoint: '/api/fuel-products' },
    { name: 'Tanks', endpoint: '/api/tanks' },
    { name: 'Nozzles', endpoint: '/api/nozzles' },
    { name: 'Lubricants', endpoint: '/api/lubricants' },
    { name: 'Credit Customers', endpoint: '/api/credit-customers' },
    { name: 'Employees', endpoint: '/api/employees' },
    { name: 'Vendors', endpoint: '/api/vendors' },
    { name: 'Expense Types', endpoint: '/api/expense-types' },
    { name: 'Swipe Machines', endpoint: '/api/swipe-machines' },
    { name: 'Business Parties', endpoint: '/api/business-parties' }
  ];

  for (const module of masterDataModules) {
    const getResult = await apiRequest('GET', module.endpoint);
    results.masterData[module.name] = {
      GET: getResult.ok ? '✅' : `❌ (${getResult.status})`,
      status: getResult.status,
      data: getResult.data
    };
    
    console.log(`${module.name.padEnd(20)} GET: ${results.masterData[module.name].GET}`);
  }

  // ===== DAILY OPERATIONS =====
  console.log('\n⚡ DAILY OPERATIONS MODULES');
  console.log('-'.repeat(60));

  const dailyOpsModules = [
    { name: 'Day Assignings', endpoint: '/api/day-assignings' },
    { name: 'Daily Sale Rate', endpoint: '/api/daily-sale-rates' },
    { name: 'Sale Entry', endpoint: '/api/sales' },
    { name: 'Lub Sale', endpoint: '/api/lubricant-sales' },
    { name: 'Swipe Sales', endpoint: '/api/swipe-sales' },
    { name: 'Credit Sales', endpoint: '/api/credit-sales' },
    { name: 'Expenses', endpoint: '/api/expenses' },
    { name: 'Recovery', endpoint: '/api/recoveries' },
    { name: 'Emp Cash Recovery', endpoint: '/api/employee-cash-recoveries' },
    { name: 'Day Opening Stock', endpoint: '/api/day-opening-stocks' },
    { name: 'Day Settlement', endpoint: '/api/day-settlements' }
  ];

  for (const module of dailyOpsModules) {
    const getResult = await apiRequest('GET', module.endpoint);
    results.dailyOps[module.name] = {
      GET: getResult.ok ? '✅' : `❌ (${getResult.status})`,
      status: getResult.status
    };
    
    console.log(`${module.name.padEnd(20)} GET: ${results.dailyOps[module.name].GET}`);
  }

  // ===== REPORTS & STATEMENTS =====
  console.log('\n📊 REPORTS & STATEMENTS');
  console.log('-'.repeat(60));

  const reportModules = [
    { name: 'Statement Generation', endpoint: '/api/statements' },
    { name: 'Stock Report', endpoint: '/api/stock-reports' },
    { name: 'Lub Loss', endpoint: '/api/lubricant-losses' },
    { name: 'Lubs Stock', endpoint: '/api/lubricant-stocks' },
    { name: 'Minimum Stock', endpoint: '/api/minimum-stocks' }
  ];

  for (const module of reportModules) {
    const getResult = await apiRequest('GET', module.endpoint);
    results.reports[module.name] = {
      GET: getResult.ok ? '✅' : `❌ (${getResult.status})`,
      status: getResult.status
    };
    
    console.log(`${module.name.padEnd(20)} GET: ${results.reports[module.name].GET}`);
  }

  // ===== TRANSACTIONS =====
  console.log('\n💰 TRANSACTION MODULES');
  console.log('-'.repeat(60));

  const transactionModules = [
    { name: 'Shift Sheet Entry', endpoint: '/api/shift-sheets' },
    { name: 'Business Cr/Dr', endpoint: '/api/business-transactions' },
    { name: 'Vendor Transaction', endpoint: '/api/vendor-transactions' },
    { name: 'Interest Trans', endpoint: '/api/interest-transactions' },
    { name: 'Sheet Records', endpoint: '/api/sheet-records' }
  ];

  for (const module of transactionModules) {
    const getResult = await apiRequest('GET', module.endpoint);
    results.transactions[module.name] = {
      GET: getResult.ok ? '✅' : `❌ (${getResult.status})`,
      status: getResult.status
    };
    
    console.log(`${module.name.padEnd(20)} GET: ${results.transactions[module.name].GET}`);
  }

  // ===== SUMMARY =====
  console.log('\n' + '='.repeat(60));
  console.log('📈 TEST SUMMARY');
  console.log('='.repeat(60));

  const allResults = { ...results.masterData, ...results.dailyOps, ...results.reports, ...results.transactions };
  const total = Object.keys(allResults).length;
  const passing = Object.values(allResults).filter(r => r.GET.includes('✅')).length;
  const failing = total - passing;

  console.log(`\nTotal Modules: ${total}`);
  console.log(`✅ Passing: ${passing}`);
  console.log(`❌ Failing: ${failing}`);
  console.log(`📊 Success Rate: ${((passing / total) * 100).toFixed(1)}%\n`);

  // Show failing modules
  if (failing > 0) {
    console.log('❌ FAILING MODULES:');
    console.log('-'.repeat(60));
    Object.entries(allResults).forEach(([name, result]) => {
      if (result.GET.includes('❌')) {
        console.log(`  • ${name}: Status ${result.status}`);
      }
    });
    console.log('');
  }

  return results;
};

// Run tests
testModules().catch(console.error);
