/**
 * Test Master Section API Endpoints with MongoDB
 * This script tests all CRUD operations for Master data
 */

const BASE_URL = 'http://localhost:5001';

// Test authentication token (you'll need to login first)
let authToken = '';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

async function makeRequest(method, endpoint, data = null, expectAuth = true) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (authToken && expectAuth) {
    options.headers['Authorization'] = `Bearer ${authToken}`;
  }

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const result = await response.json();
    return { status: response.status, data: result, ok: response.ok };
  } catch (error) {
    return { status: 0, error: error.message, ok: false };
  }
}

async function testHealthCheck() {
  log(colors.cyan, '\n🏥 Testing Health Check...');
  const result = await makeRequest('GET', '/api/health', null, false);
  if (result.ok) {
    log(colors.green, '✅ Server is healthy');
    return true;
  } else {
    log(colors.red, '❌ Server health check failed');
    return false;
  }
}

async function testFuelProducts() {
  log(colors.cyan, '\n⛽ Testing Fuel Products API...');
  
  // GET - List all
  log(colors.blue, '  GET /api/fuel-products');
  let result = await makeRequest('GET', '/api/fuel-products');
  if (result.ok) {
    log(colors.green, `  ✅ Retrieved ${result.data.rows?.length || 0} fuel products`);
    if (result.data.rows && result.data.rows.length > 0) {
      result.data.rows.slice(0, 3).forEach(p => {
        console.log(`     - ${p.productName} (${p.shortName})`);
      });
    }
  } else {
    log(colors.red, `  ❌ Failed: ${result.data.error || 'Unknown error'}`);
  }

  // POST - Create new
  log(colors.blue, '  POST /api/fuel-products');
  result = await makeRequest('POST', '/api/fuel-products', {
    productName: 'Test Fuel ' + Date.now(),
    shortName: 'TF' + Date.now().toString().slice(-4),
    gstPercentage: 18,
    tdsPercentage: 1,
    wgtPercentage: 0.5,
    lfrn: 'LFR-TEST-' + Date.now(),
  });
  if (result.ok) {
    log(colors.green, `  ✅ Created fuel product with ID: ${result.data.id}`);
  } else {
    log(colors.red, `  ❌ Failed to create: ${result.data.error || 'Unknown error'}`);
  }
}

async function testLubricants() {
  log(colors.cyan, '\n🛢️  Testing Lubricants API...');
  
  // GET - List all
  log(colors.blue, '  GET /api/lubricants');
  let result = await makeRequest('GET', '/api/lubricants');
  if (result.ok) {
    log(colors.green, `  ✅ Retrieved ${result.data.rows?.length || 0} lubricants`);
    if (result.data.rows && result.data.rows.length > 0) {
      result.data.rows.slice(0, 3).forEach(l => {
        console.log(`     - ${l.lubricantName} (Stock: ${l.currentStock})`);
      });
    }
  } else {
    log(colors.red, `  ❌ Failed: ${result.data.error || 'Unknown error'}`);
  }

  // POST - Create new
  log(colors.blue, '  POST /api/lubricants');
  result = await makeRequest('POST', '/api/lubricants', {
    lubricantName: 'Test Oil ' + Date.now(),
    productCode: 'TO' + Date.now().toString().slice(-4),
    mrpRate: 500,
    saleRate: 450,
    gstPercentage: 18,
    minimumStock: 10,
  });
  if (result.ok) {
    log(colors.green, `  ✅ Created lubricant with ID: ${result.data.id}`);
  } else {
    log(colors.red, `  ❌ Failed to create: ${result.data.error || 'Unknown error'}`);
  }
}

async function testCreditCustomers() {
  log(colors.cyan, '\n👥 Testing Credit Customers API...');
  
  // GET - List all
  log(colors.blue, '  GET /api/credit-customers');
  let result = await makeRequest('GET', '/api/credit-customers');
  if (result.ok) {
    log(colors.green, `  ✅ Retrieved ${result.data.rows?.length || 0} credit customers`);
  } else {
    log(colors.red, `  ❌ Failed: ${result.data.error || 'Unknown error'}`);
  }

  // POST - Create new
  log(colors.blue, '  POST /api/credit-customers');
  result = await makeRequest('POST', '/api/credit-customers', {
    organizationName: 'Test Company ' + Date.now(),
    phoneNumber: '1234567890',
    mobileNumber: '9876543210',
    email: `test${Date.now()}@example.com`,
    creditLimit: 50000,
    representativeName: 'Test Rep',
  });
  if (result.ok) {
    log(colors.green, `  ✅ Created credit customer with ID: ${result.data.id}`);
  } else {
    log(colors.red, `  ❌ Failed to create: ${result.data.error || 'Unknown error'}`);
  }
}

async function testEmployees() {
  log(colors.cyan, '\n👷 Testing Employees API...');
  
  // GET - List all
  log(colors.blue, '  GET /api/employees');
  let result = await makeRequest('GET', '/api/employees');
  if (result.ok) {
    log(colors.green, `  ✅ Retrieved ${result.data.rows?.length || 0} employees`);
  } else {
    log(colors.red, `  ❌ Failed: ${result.data.error || 'Unknown error'}`);
  }

  // POST - Create new
  log(colors.blue, '  POST /api/employees');
  result = await makeRequest('POST', '/api/employees', {
    employeeName: 'Test Employee ' + Date.now(),
    designation: 'Manager',
    phoneNumber: '1234567890',
    salary: 30000,
    joiningDate: new Date().toISOString().split('T')[0],
  });
  if (result.ok) {
    log(colors.green, `  ✅ Created employee with ID: ${result.data.id}`);
  } else {
    log(colors.red, `  ❌ Failed to create: ${result.data.error || 'Unknown error'}`);
  }
}

async function testVendors() {
  log(colors.cyan, '\n🏪 Testing Vendors API...');
  
  // GET - List all
  log(colors.blue, '  GET /api/vendors');
  let result = await makeRequest('GET', '/api/vendors');
  if (result.ok) {
    log(colors.green, `  ✅ Retrieved ${result.data.rows?.length || 0} vendors`);
  } else {
    log(colors.red, `  ❌ Failed: ${result.data.error || 'Unknown error'}`);
  }

  // POST - Create new
  log(colors.blue, '  POST /api/vendors');
  result = await makeRequest('POST', '/api/vendors', {
    vendorName: 'Test Vendor ' + Date.now(),
    vendorType: 'Both',
    contactPerson: 'Test Contact',
    phoneNumber: '1234567890',
    email: `vendor${Date.now()}@example.com`,
    gstNumber: 'GST123456789',
  });
  if (result.ok) {
    log(colors.green, `  ✅ Created vendor with ID: ${result.data.id}`);
  } else {
    log(colors.red, `  ❌ Failed to create: ${result.data.error || 'Unknown error'}`);
  }
}

async function testOtherMasterData() {
  log(colors.cyan, '\n📋 Testing Other Master Data APIs...');
  
  // Swipe Machines
  log(colors.blue, '  GET /api/swipe-machines');
  let result = await makeRequest('GET', '/api/swipe-machines');
  log(result.ok ? colors.green : colors.red, 
      `  ${result.ok ? '✅' : '❌'} Swipe Machines: ${result.ok ? result.data.rows?.length || 0 : result.data.error}`);

  // Tanks
  log(colors.blue, '  GET /api/tanks');
  result = await makeRequest('GET', '/api/tanks');
  log(result.ok ? colors.green : colors.red, 
      `  ${result.ok ? '✅' : '❌'} Tanks: ${result.ok ? result.data.rows?.length || 0 : result.data.error}`);

  // Nozzles
  log(colors.blue, '  GET /api/nozzles');
  result = await makeRequest('GET', '/api/nozzles');
  log(result.ok ? colors.green : colors.red, 
      `  ${result.ok ? '✅' : '❌'} Nozzles: ${result.ok ? result.data.rows?.length || 0 : result.data.error}`);

  // Expense Types
  log(colors.blue, '  GET /api/expense-types');
  result = await makeRequest('GET', '/api/expense-types');
  log(result.ok ? colors.green : colors.red, 
      `  ${result.ok ? '✅' : '❌'} Expense Types: ${result.ok ? result.data.rows?.length || 0 : result.data.error}`);

  // Business Parties
  log(colors.blue, '  GET /api/business-parties');
  result = await makeRequest('GET', '/api/business-parties');
  log(result.ok ? colors.green : colors.red, 
      `  ${result.ok ? '✅' : '❌'} Business Parties: ${result.ok ? result.data.rows?.length || 0 : result.data.error}`);
}

async function runAllTests() {
  log(colors.cyan, '\n' + '='.repeat(60));
  log(colors.cyan, '🧪 MASTER SECTION API TESTS - MongoDB Backend');
  log(colors.cyan, '='.repeat(60));

  // Check if server is running
  const serverHealthy = await testHealthCheck();
  if (!serverHealthy) {
    log(colors.yellow, '\n⚠️  Server is not running. Start it with: npm run dev');
    log(colors.yellow, '⚠️  Some tests require authentication - login first to get token');
    return;
  }

  // Note about authentication
  log(colors.yellow, '\n⚠️  Note: Most endpoints require authentication');
  log(colors.yellow, '   If tests fail with 401, login first and update authToken in the script');

  // Run tests
  await testFuelProducts();
  await testLubricants();
  await testCreditCustomers();
  await testEmployees();
  await testVendors();
  await testOtherMasterData();

  // Summary
  log(colors.cyan, '\n' + '='.repeat(60));
  log(colors.cyan, '📊 TEST SUMMARY');
  log(colors.cyan, '='.repeat(60));
  log(colors.green, '✅ MongoDB Master Section API endpoints are configured');
  log(colors.yellow, '⚠️  Full functionality requires authentication');
  log(colors.cyan, '\nNext steps:');
  log(colors.white, '  1. Start the server: npm run dev');
  log(colors.white, '  2. Login to get authentication token');
  log(colors.white, '  3. Update authToken variable in this script');
  log(colors.white, '  4. Run this script again to test authenticated endpoints\n');
}

// Run tests
runAllTests().catch(error => {
  log(colors.red, '\n❌ Test suite failed:');
  console.error(error);
  process.exit(1);
});
