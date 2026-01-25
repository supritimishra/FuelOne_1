/**
 * Test script for lubricants API endpoints
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5001';
const TEST_USER = {
  email: 'admin@example.com',
  password: 'admin123'
};

async function login() {
  console.log('🔐 Logging in...');
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(TEST_USER)
  });
  
  const cookies = response.headers.get('set-cookie');
  const tokenMatch = cookies?.match(/token=([^;]+)/);
  
  if (!tokenMatch) {
    throw new Error('Failed to get authentication token');
  }
  
  console.log('✅ Logged in successfully');
  return tokenMatch[1];
}

async function testGetLubricants(token: string) {
  console.log('\n📋 Testing GET /api/lubricants...');
  const response = await fetch(`${BASE_URL}/api/lubricants`, {
    headers: { 'Cookie': `token=${token}` }
  });
  
  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));
  
  if (data.ok && Array.isArray(data.rows)) {
    console.log(`✅ Found ${data.rows.length} lubricants`);
    return data.rows;
  } else {
    console.log('❌ Failed to fetch lubricants');
    return [];
  }
}

async function testCreateLubricant(token: string) {
  console.log('\n➕ Testing POST /api/lubricants...');
  const newLubricant = {
    lubricant_name: 'Test Lubricant ' + Date.now(),
    hsn_code: '27101990',
    gst_percentage: 18,
    mrp_rate: 350,
    sale_rate: 320,
    minimum_stock: 5,
    current_stock: 15,
    is_active: true
  };
  
  const response = await fetch(`${BASE_URL}/api/lubricants`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `token=${token}`
    },
    body: JSON.stringify(newLubricant)
  });
  
  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));
  
  if (data.ok && data.id) {
    console.log(`✅ Created lubricant with ID: ${data.id}`);
    return data.id;
  } else {
    console.log('❌ Failed to create lubricant');
    return null;
  }
}

async function testUpdateLubricant(token: string, id: string) {
  console.log(`\n✏️ Testing PUT /api/lubricants/${id}...`);
  const updates = {
    sale_rate: 340,
    current_stock: 20
  };
  
  const response = await fetch(`${BASE_URL}/api/lubricants/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `token=${token}`
    },
    body: JSON.stringify(updates)
  });
  
  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));
  
  if (data.ok) {
    console.log('✅ Updated lubricant successfully');
  } else {
    console.log('❌ Failed to update lubricant');
  }
}

async function testDeleteLubricant(token: string, id: string) {
  console.log(`\n🗑️ Testing DELETE /api/lubricants/${id}...`);
  const response = await fetch(`${BASE_URL}/api/lubricants/${id}`, {
    method: 'DELETE',
    headers: { 'Cookie': `token=${token}` }
  });
  
  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));
  
  if (data.ok) {
    console.log('✅ Deleted lubricant successfully');
  } else {
    console.log('❌ Failed to delete lubricant');
  }
}

async function runTests() {
  try {
    // Step 1: Login
    const token = await login();
    
    // Step 2: Get all lubricants
    const lubricants = await testGetLubricants(token);
    
    // Step 3: Create a new lubricant
    const newId = await testCreateLubricant(token);
    
    if (newId) {
      // Step 4: Update the lubricant
      await testUpdateLubricant(token, newId);
      
      // Step 5: Get lubricants again to see the changes
      await testGetLubricants(token);
      
      // Step 6: Delete the test lubricant
      await testDeleteLubricant(token, newId);
      
      // Step 7: Verify deletion
      await testGetLubricants(token);
    }
    
    console.log('\n✅ All tests completed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

runTests();
