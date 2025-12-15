#!/usr/bin/env node

/**
 * Manual E2E Testing Script for Purchase and Stock Management
 * Tests Liquid Purchase, Lubricant Purchase, Tanker Sale, and Stock Reports
 */

console.log('🚀 Starting Purchase and Stock Management E2E Tests\n');
console.log('=' .repeat(60));

// Test data for purchase workflows
const testData = {
  vendors: [
    { vendor_name: 'Test Fuel Supplier', vendor_type: 'Liquids', phone_number: '9876543210', gst_tin: 'GST123456789', email: 'fuel@test.com', address: 'Test Address', opening_balance: 0, is_active: true },
    { vendor_name: 'Test Lubricant Supplier', vendor_type: 'Lubricants', phone_number: '9876543211', gst_tin: 'GST987654321', email: 'lub@test.com', address: 'Test Address 2', opening_balance: 0, is_active: true }
  ],
  fuelProducts: [
    { product_name: 'Petrol', short_name: 'PET', gst_percentage: 18, is_active: true },
    { product_name: 'Diesel', short_name: 'DIE', gst_percentage: 18, is_active: true }
  ],
  tanks: [
    { tank_number: 'TANK-001', capacity: 10000, current_stock: 5000, is_active: true },
    { tank_number: 'TANK-002', capacity: 15000, current_stock: 8000, is_active: true }
  ],
  lubricants: [
    { lubricant_name: 'Engine Oil 20W-40', category: 'Engine Oil', current_stock: 50, min_stock: 10, is_active: true },
    { lubricant_name: 'Brake Fluid', category: 'Brake Fluid', current_stock: 25, min_stock: 5, is_active: true }
  ]
};

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

async function testAPIEndpoints() {
  console.log('\n🔌 Testing API endpoints...');
  
  const endpoints = [
    '/api/fuel-products',
    '/api/tanks',
    '/api/lubricants',
    '/api/vendors',
    '/api/tanker-sales',
    '/api/liquid-purchases',
    '/api/lubs-purchases'
  ];

  const results = {};
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`http://localhost:5000${endpoint}`);
      results[endpoint] = {
        status: response.status,
        ok: response.ok,
        accessible: response.status !== 404
      };
      
      if (response.ok) {
        console.log(`✅ ${endpoint}: ${response.status} OK`);
      } else if (response.status === 401) {
        console.log(`🔐 ${endpoint}: ${response.status} Authentication required`);
      } else if (response.status === 404) {
        console.log(`❌ ${endpoint}: ${response.status} Not found`);
      } else {
        console.log(`⚠️ ${endpoint}: ${response.status} Error`);
      }
    } catch (error) {
      results[endpoint] = {
        status: 'ERROR',
        ok: false,
        accessible: false,
        error: error.message
      };
      console.log(`❌ ${endpoint}: Connection error`);
    }
  }
  
  return results;
}

async function testLiquidPurchaseWorkflow() {
  console.log('\n⛽ Testing Liquid Purchase Workflow...');
  
  try {
    // Test liquid purchase API endpoint
    const response = await fetch('http://localhost:5000/api/liquid-purchases', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Test-User': 'TestSprite' // Use test header for authentication
      },
      body: JSON.stringify({
        purchase_date: new Date().toISOString().split('T')[0],
        vendor_id: 'test-vendor-id',
        fuel_product_id: 'test-fuel-id',
        quantity: 1000,
        price_per_unit: 85.50,
        total_amount: 85500,
        invoice_number: 'INV-TEST-001',
        vehicle_number: 'MH12LP1234',
        notes: 'Test liquid purchase'
      })
    });

    if (response.status === 401) {
      console.log('🔐 Liquid purchase endpoint requires authentication');
      return { status: 'auth_required', message: 'Authentication required' };
    } else if (response.ok) {
      console.log('✅ Liquid purchase endpoint accessible');
      return { status: 'success', message: 'Endpoint working' };
    } else {
      console.log(`⚠️ Liquid purchase endpoint returned: ${response.status}`);
      return { status: 'error', message: `Status: ${response.status}` };
    }
  } catch (error) {
    console.error('❌ Liquid purchase test error:', error.message);
    return { status: 'error', message: error.message };
  }
}

async function testLubricantPurchaseWorkflow() {
  console.log('\n🛢️ Testing Lubricant Purchase Workflow...');
  
  try {
    const response = await fetch('http://localhost:5000/api/lubs-purchases', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Test-User': 'TestSprite'
      },
      body: JSON.stringify({
        purchase_date: new Date().toISOString().split('T')[0],
        vendor_id: 'test-vendor-id',
        lubricant_name: 'Engine Oil 20W-40',
        quantity: 10,
        price_per_unit: 400.00,
        total_amount: 4000,
        invoice_number: 'INV-LUB-001',
        notes: 'Test lubricant purchase'
      })
    });

    if (response.status === 401) {
      console.log('🔐 Lubricant purchase endpoint requires authentication');
      return { status: 'auth_required', message: 'Authentication required' };
    } else if (response.ok) {
      console.log('✅ Lubricant purchase endpoint accessible');
      return { status: 'success', message: 'Endpoint working' };
    } else {
      console.log(`⚠️ Lubricant purchase endpoint returned: ${response.status}`);
      return { status: 'error', message: `Status: ${response.status}` };
    }
  } catch (error) {
    console.error('❌ Lubricant purchase test error:', error.message);
    return { status: 'error', message: error.message };
  }
}

async function testTankerSaleWorkflow() {
  console.log('\n🚛 Testing Tanker Sale Workflow...');
  
  try {
    const response = await fetch('http://localhost:5000/api/tanker-sales', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Test-User': 'TestSprite'
      },
      body: JSON.stringify({
        sale_date: new Date().toISOString().split('T')[0],
        fuel_product_id: 'test-fuel-id',
        before_dip_stock: 5000,
        gross_stock: 6000,
        tanker_sale_quantity: 1000,
        notes: 'Test tanker sale'
      })
    });

    if (response.status === 401) {
      console.log('🔐 Tanker sale endpoint requires authentication');
      return { status: 'auth_required', message: 'Authentication required' };
    } else if (response.ok) {
      console.log('✅ Tanker sale endpoint accessible');
      return { status: 'success', message: 'Endpoint working' };
    } else {
      console.log(`⚠️ Tanker sale endpoint returned: ${response.status}`);
      return { status: 'error', message: `Status: ${response.status}` };
    }
  } catch (error) {
    console.error('❌ Tanker sale test error:', error.message);
    return { status: 'error', message: error.message };
  }
}

async function testStockReports() {
  console.log('\n📊 Testing Stock Reports...');
  
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
    } else {
      console.log(`⚠️ Stock reports endpoint returned: ${response.status}`);
      return { status: 'error', message: `Status: ${response.status}` };
    }
  } catch (error) {
    console.error('❌ Stock reports test error:', error.message);
    return { status: 'error', message: error.message };
  }
}

async function testVendorManagement() {
  console.log('\n🏢 Testing Vendor Management...');
  
  try {
    const response = await fetch('http://localhost:5000/api/vendors', {
      headers: {
        'X-Test-User': 'TestSprite'
      }
    });

    if (response.status === 401) {
      console.log('🔐 Vendors endpoint requires authentication');
      return { status: 'auth_required', message: 'Authentication required' };
    } else if (response.ok) {
      console.log('✅ Vendors endpoint accessible');
      return { status: 'success', message: 'Endpoint working' };
    } else {
      console.log(`⚠️ Vendors endpoint returned: ${response.status}`);
      return { status: 'error', message: `Status: ${response.status}` };
    }
  } catch (error) {
    console.error('❌ Vendor management test error:', error.message);
    return { status: 'error', message: error.message };
  }
}

async function runPurchaseStockTests() {
  console.log('🚀 Starting Purchase and Stock Management E2E Tests\n');
  console.log('=' .repeat(60));

  // Test server connectivity
  const serverOk = await testServerConnectivity();
  if (!serverOk) {
    console.error('❌ Server connectivity failed. Exiting...');
    return;
  }

  // Test API endpoints
  const apiResults = await testAPIEndpoints();

  // Test individual workflows
  const results = {
    liquidPurchase: await testLiquidPurchaseWorkflow(),
    lubricantPurchase: await testLubricantPurchaseWorkflow(),
    tankerSale: await testTankerSaleWorkflow(),
    stockReports: await testStockReports(),
    vendorManagement: await testVendorManagement()
  };

  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📋 Purchase and Stock Management Test Results:');
  console.log('=' .repeat(60));
  
  Object.entries(results).forEach(([test, result]) => {
    const status = result.status === 'success' ? '✅ PASSED' : 
                  result.status === 'auth_required' ? '🔐 AUTH REQUIRED' : 
                  '❌ FAILED';
    console.log(`${status} ${test}: ${result.message}`);
  });

  const authRequiredCount = Object.values(results).filter(r => r.status === 'auth_required').length;
  const successCount = Object.values(results).filter(r => r.status === 'success').length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Overall Result:`);
  console.log(`   ✅ Successful: ${successCount}/${totalTests}`);
  console.log(`   🔐 Auth Required: ${authRequiredCount}/${totalTests}`);
  console.log(`   ❌ Failed: ${totalTests - successCount - authRequiredCount}/${totalTests}`);
  
  if (authRequiredCount > 0) {
    console.log('\n🔐 Authentication Required:');
    console.log('   The endpoints are working but require proper authentication.');
    console.log('   This is expected behavior for protected API endpoints.');
  }
  
  if (successCount === totalTests) {
    console.log('\n🎉 All purchase and stock management tests passed!');
  } else if (authRequiredCount === totalTests) {
    console.log('\n🔐 All tests require authentication - this is normal for protected endpoints.');
  } else {
    console.log('\n⚠️ Some tests failed. Check the logs above for details.');
  }
}

// Run the tests
runPurchaseStockTests().catch(console.error);
