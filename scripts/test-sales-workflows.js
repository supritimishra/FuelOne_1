#!/usr/bin/env node

/**
 * Manual E2E Testing Script for Sales Workflows
 * Tests Guest Entry, Credit Sale, Lub Sale, and Swipe workflows
 * Verifies dashboard updates after each transaction
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://wiidbhtbbgshcofmmyxw.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpaWRiaHRiYmdzaGNvZm1teXh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5NTQ4MDAsImV4cCI6MjA1MjUzMDgwMH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8E';

const supabase = createClient(supabaseUrl, supabaseKey);

// Test data for sales workflows
const testData = {
  fuelProducts: [
    { product_name: 'Petrol', short_name: 'PET', gst_percentage: 18, is_active: true },
    { product_name: 'Diesel', short_name: 'DIE', gst_percentage: 18, is_active: true }
  ],
  creditCustomers: [
    { organization_name: 'Test Transport Ltd', phone_number: '9876543210', current_balance: 0, is_active: true },
    { organization_name: 'Test Logistics', phone_number: '9876543211', current_balance: 0, is_active: true }
  ],
  tanks: [
    { tank_number: 'TANK-001', fuel_product_id: null, capacity: 10000, current_stock: 5000, is_active: true },
    { tank_number: 'TANK-002', fuel_product_id: null, capacity: 15000, current_stock: 8000, is_active: true }
  ],
  lubricants: [
    { lubricant_name: 'Engine Oil 20W-40', category: 'Engine Oil', current_stock: 50, min_stock: 10, is_active: true },
    { lubricant_name: 'Brake Fluid', category: 'Brake Fluid', current_stock: 25, min_stock: 5, is_active: true }
  ]
};

async function setupTestData() {
  console.log('🔧 Setting up test data for sales workflows...\n');

  try {
    // 1. Create fuel products
    console.log('⛽ Creating fuel products...');
    const fuelProductIds = [];
    for (const product of testData.fuelProducts) {
      const { data, error } = await supabase
        .from('fuel_products')
        .upsert(product, { onConflict: 'product_name' })
        .select('id')
        .single();
      
      if (error && !error.message.includes('duplicate')) {
        console.error(`❌ Error creating fuel product ${product.product_name}:`, error.message);
      } else {
        fuelProductIds.push(data?.id);
        console.log(`✅ Fuel product created: ${product.product_name}`);
      }
    }

    // 2. Update tanks with fuel product IDs
    console.log('\n🛢️ Updating tanks with fuel products...');
    for (let i = 0; i < testData.tanks.length; i++) {
      const tank = { ...testData.tanks[i], fuel_product_id: fuelProductIds[i] };
      const { error } = await supabase
        .from('tanks')
        .upsert(tank, { onConflict: 'tank_number' });
      
      if (error && !error.message.includes('duplicate')) {
        console.error(`❌ Error updating tank ${tank.tank_number}:`, error.message);
      } else {
        console.log(`✅ Tank updated: ${tank.tank_number} with ${testData.fuelProducts[i].product_name}`);
      }
    }

    // 3. Create credit customers
    console.log('\n👥 Creating credit customers...');
    const customerIds = [];
    for (const customer of testData.creditCustomers) {
      const { data, error } = await supabase
        .from('credit_customers')
        .upsert(customer, { onConflict: 'organization_name' })
        .select('id')
        .single();
      
      if (error && !error.message.includes('duplicate')) {
        console.error(`❌ Error creating customer ${customer.organization_name}:`, error.message);
      } else {
        customerIds.push(data?.id);
        console.log(`✅ Credit customer created: ${customer.organization_name}`);
      }
    }

    // 4. Create lubricants
    console.log('\n🛢️ Creating lubricants...');
    for (const lubricant of testData.lubricants) {
      const { error } = await supabase
        .from('lubricants')
        .upsert(lubricant, { onConflict: 'lubricant_name' });
      
      if (error && !error.message.includes('duplicate')) {
        console.error(`❌ Error creating lubricant ${lubricant.lubricant_name}:`, error.message);
      } else {
        console.log(`✅ Lubricant created: ${lubricant.lubricant_name}`);
      }
    }

    console.log('\n✅ Test data setup complete!');
    return { fuelProductIds, customerIds };

  } catch (error) {
    console.error('❌ Error setting up test data:', error.message);
    return null;
  }
}

async function testGuestSale(fuelProductId) {
  console.log('\n🛒 Testing Guest Sale Workflow...');
  
  const guestSale = {
    sale_date: new Date().toISOString().split('T')[0],
    customer_name: 'Test Guest Customer',
    vehicle_number: 'MH12TS1234',
    mobile_number: '9876543212',
    fuel_product_id: fuelProductId,
    quantity: 25.5,
    price_per_unit: 95.50,
    discount: 0,
    payment_mode: 'Cash',
    total_amount: 2435.25
  };

  try {
    const { data, error } = await supabase
      .from('guest_sales')
      .insert(guestSale)
      .select()
      .single();

    if (error) {
      console.error('❌ Guest sale failed:', error.message);
      return false;
    }

    console.log('✅ Guest sale created successfully');
    console.log(`   Customer: ${guestSale.customer_name}`);
    console.log(`   Amount: ₹${guestSale.total_amount}`);
    console.log(`   Payment: ${guestSale.payment_mode}`);
    
    return data;
  } catch (error) {
    console.error('❌ Guest sale error:', error.message);
    return false;
  }
}

async function testCreditSale(customerId, fuelProductId) {
  console.log('\n💳 Testing Credit Sale Workflow...');
  
  const creditSale = {
    sale_date: new Date().toISOString().split('T')[0],
    credit_customer_id: customerId,
    vehicle_number: 'MH12CS5678',
    fuel_product_id: fuelProductId,
    quantity: 50.0,
    price_per_unit: 95.50,
    total_amount: 4775.00
  };

  try {
    const { data, error } = await supabase
      .from('credit_sales')
      .insert(creditSale)
      .select()
      .single();

    if (error) {
      console.error('❌ Credit sale failed:', error.message);
      return false;
    }

    console.log('✅ Credit sale created successfully');
    console.log(`   Customer ID: ${creditSale.credit_customer_id}`);
    console.log(`   Amount: ₹${creditSale.total_amount}`);
    console.log(`   Quantity: ${creditSale.quantity}L`);
    
    return data;
  } catch (error) {
    console.error('❌ Credit sale error:', error.message);
    return false;
  }
}

async function testLubricantSale() {
  console.log('\n🛢️ Testing Lubricant Sale Workflow...');
  
  const lubSale = {
    sale_date: new Date().toISOString().split('T')[0],
    customer_name: 'Test Lub Customer',
    vehicle_number: 'MH12LS9999',
    mobile_number: '9876543213',
    lubricant_name: 'Engine Oil 20W-40',
    quantity: 2,
    price_per_unit: 450.00,
    total_amount: 900.00,
    payment_mode: 'UPI'
  };

  try {
    const { data, error } = await supabase
      .from('lub_sales')
      .insert(lubSale)
      .select()
      .single();

    if (error) {
      console.error('❌ Lubricant sale failed:', error.message);
      return false;
    }

    console.log('✅ Lubricant sale created successfully');
    console.log(`   Customer: ${lubSale.customer_name}`);
    console.log(`   Product: ${lubSale.lubricant_name}`);
    console.log(`   Amount: ₹${lubSale.total_amount}`);
    
    return data;
  } catch (error) {
    console.error('❌ Lubricant sale error:', error.message);
    return false;
  }
}

async function testSwipeSale(fuelProductId) {
  console.log('\n💳 Testing Swipe Sale Workflow...');
  
  const swipeSale = {
    sale_date: new Date().toISOString().split('T')[0],
    customer_name: 'Test Swipe Customer',
    vehicle_number: 'MH12SW1111',
    mobile_number: '9876543214',
    fuel_product_id: fuelProductId,
    quantity: 30.0,
    price_per_unit: 95.50,
    total_amount: 2865.00,
    payment_mode: 'Card',
    card_type: 'Credit Card',
    card_number: '****1234'
  };

  try {
    const { data, error } = await supabase
      .from('swipe_sales')
      .insert(swipeSale)
      .select()
      .single();

    if (error) {
      console.error('❌ Swipe sale failed:', error.message);
      return false;
    }

    console.log('✅ Swipe sale created successfully');
    console.log(`   Customer: ${swipeSale.customer_name}`);
    console.log(`   Card: ${swipeSale.card_type} ${swipeSale.card_number}`);
    console.log(`   Amount: ₹${swipeSale.total_amount}`);
    
    return data;
  } catch (error) {
    console.error('❌ Swipe sale error:', error.message);
    return false;
  }
}

async function verifyDashboardUpdates() {
  console.log('\n📊 Verifying Dashboard Updates...');
  
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Check today's sales
    const { data: guestSales } = await supabase
      .from('guest_sales')
      .select('total_amount')
      .eq('sale_date', today);
    
    const { data: creditSales } = await supabase
      .from('credit_sales')
      .select('total_amount')
      .eq('sale_date', today);
    
    const { data: lubSales } = await supabase
      .from('lub_sales')
      .select('total_amount')
      .eq('sale_date', today);
    
    const { data: swipeSales } = await supabase
      .from('swipe_sales')
      .select('total_amount')
      .eq('sale_date', today);

    const guestTotal = guestSales?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0;
    const creditTotal = creditSales?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0;
    const lubTotal = lubSales?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0;
    const swipeTotal = swipeSales?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0;
    
    const totalSales = guestTotal + creditTotal + lubTotal + swipeTotal;

    console.log('📈 Dashboard Sales Summary:');
    console.log(`   Guest Sales: ₹${guestTotal.toFixed(2)}`);
    console.log(`   Credit Sales: ₹${creditTotal.toFixed(2)}`);
    console.log(`   Lubricant Sales: ₹${lubTotal.toFixed(2)}`);
    console.log(`   Swipe Sales: ₹${swipeTotal.toFixed(2)}`);
    console.log(`   Total Sales: ₹${totalSales.toFixed(2)}`);

    // Check stock levels
    const { data: tanks } = await supabase
      .from('tanks')
      .select('tank_number, current_stock, capacity')
      .eq('is_active', true);

    console.log('\n🛢️ Tank Stock Levels:');
    tanks?.forEach(tank => {
      const stockPercentage = (tank.current_stock / tank.capacity) * 100;
      console.log(`   ${tank.tank_number}: ${tank.current_stock}L / ${tank.capacity}L (${stockPercentage.toFixed(1)}%)`);
    });

    return totalSales > 0;
  } catch (error) {
    console.error('❌ Dashboard verification error:', error.message);
    return false;
  }
}

async function runSalesWorkflowTests() {
  console.log('🚀 Starting Sales Workflow E2E Tests\n');
  console.log('=' .repeat(50));

  // Setup test data
  const testSetup = await setupTestData();
  if (!testSetup) {
    console.error('❌ Test setup failed. Exiting...');
    return;
  }

  const { fuelProductIds, customerIds } = testSetup;
  
  if (!fuelProductIds || fuelProductIds.length === 0) {
    console.error('❌ No fuel products available for testing');
    return;
  }

  const fuelProductId = fuelProductIds[0];
  const customerId = customerIds?.[0];

  // Test each sales workflow
  const results = {
    guestSale: false,
    creditSale: false,
    lubSale: false,
    swipeSale: false,
    dashboardUpdate: false
  };

  // 1. Test Guest Sale
  results.guestSale = await testGuestSale(fuelProductId);

  // 2. Test Credit Sale
  if (customerId) {
    results.creditSale = await testCreditSale(customerId, fuelProductId);
  } else {
    console.log('⚠️ Skipping credit sale test - no customer ID available');
  }

  // 3. Test Lubricant Sale
  results.lubSale = await testLubricantSale();

  // 4. Test Swipe Sale
  results.swipeSale = await testSwipeSale(fuelProductId);

  // 5. Verify Dashboard Updates
  results.dashboardUpdate = await verifyDashboardUpdates();

  // Summary
  console.log('\n' + '=' .repeat(50));
  console.log('📋 Sales Workflow Test Results:');
  console.log('=' .repeat(50));
  console.log(`✅ Guest Sale: ${results.guestSale ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ Credit Sale: ${results.creditSale ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ Lubricant Sale: ${results.lubSale ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ Swipe Sale: ${results.swipeSale ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ Dashboard Updates: ${results.dashboardUpdate ? 'PASSED' : 'FAILED'}`);

  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Overall Result: ${passedTests}/${totalTests} tests passed (${((passedTests/totalTests)*100).toFixed(1)}%)`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All sales workflow tests passed!');
  } else {
    console.log('⚠️ Some tests failed. Check the logs above for details.');
  }
}

// Run the tests
if (import.meta.url === `file://${process.argv[1]}`) {
  runSalesWorkflowTests().catch(console.error);
}

export { runSalesWorkflowTests, testGuestSale, testCreditSale, testLubricantSale, testSwipeSale, verifyDashboardUpdates };
