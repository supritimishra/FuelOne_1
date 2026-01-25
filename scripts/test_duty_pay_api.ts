/**
 * Test Duty Pay API Endpoints
 * 
 * This script tests the duty pay CRUD API endpoints
 */

async function testDutyPayAPI() {
  const BASE_URL = 'http://localhost:5000';
  
  console.log('🧪 Testing Duty Pay API Endpoints\n');

  try {
    // Test 1: GET all duty pay records
    console.log('1️⃣ Testing GET /api/duty-pay');
    const getResponse = await fetch(`${BASE_URL}/api/duty-pay`, {
      credentials: 'include',
    });
    const getData = await getResponse.json();
    
    if (getData.ok && getData.rows) {
      console.log(`   ✅ Success! Retrieved ${getData.rows.length} records`);
      console.log(`   📊 Sample record:`, JSON.stringify(getData.rows[0], null, 2));
    } else {
      console.log(`   ❌ Failed:`, getData);
    }

    console.log('\n2️⃣ Testing GET /api/duty-pay with month filter');
    const filterResponse = await fetch(`${BASE_URL}/api/duty-pay?month=2025-12`, {
      credentials: 'include',
    });
    const filterData = await filterResponse.json();
    
    if (filterData.ok && filterData.rows) {
      console.log(`   ✅ Success! Retrieved ${filterData.rows.length} records for December 2025`);
    } else {
      console.log(`   ❌ Failed:`, filterData);
    }

    // Test 3: POST - Create a new record
    console.log('\n3️⃣ Testing POST /api/duty-pay (Create)');
    const newRecord = {
      pay_month: '2026-02-01',
      total_salary: 500000,
      total_employees: 18,
      notes: 'Test record - February 2026 payroll'
    };
    
    const postResponse = await fetch(`${BASE_URL}/api/duty-pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(newRecord),
    });
    const postData = await postResponse.json();
    
    if (postData.ok && postData.id) {
      console.log(`   ✅ Success! Created record with ID: ${postData.id}`);
      
      // Test 4: PUT - Update the record
      console.log('\n4️⃣ Testing PUT /api/duty-pay/:id (Update)');
      const updateResponse = await fetch(`${BASE_URL}/api/duty-pay/${postData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          total_salary: 550000,
          notes: 'Test record - Updated with overtime'
        }),
      });
      const updateData = await updateResponse.json();
      
      if (updateData.ok) {
        console.log(`   ✅ Success! Updated record`);
      } else {
        console.log(`   ❌ Failed:`, updateData);
      }

      // Test 5: DELETE - Remove the test record
      console.log('\n5️⃣ Testing DELETE /api/duty-pay/:id');
      const deleteResponse = await fetch(`${BASE_URL}/api/duty-pay/${postData.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const deleteData = await deleteResponse.json();
      
      if (deleteData.ok) {
        console.log(`   ✅ Success! Deleted test record`);
      } else {
        console.log(`   ❌ Failed:`, deleteData);
      }
    } else {
      console.log(`   ❌ Failed to create:`, postData);
    }

    console.log('\n✅ All API tests completed!');

  } catch (error) {
    console.error('❌ Error testing API:', error);
  }
}

// Run the tests
testDutyPayAPI();
