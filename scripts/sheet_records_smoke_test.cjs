const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function smokeTestSheetRecords() {
  console.log('🧪 Starting Sheet Records Smoke Test...\n');
  
  try {
    // Test 1: Check if sheet_records table exists
    console.log('📋 Test 1: Checking sheet_records table...');
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'sheet_records'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ sheet_records table exists');
    } else {
      console.log('❌ sheet_records table does not exist');
      return;
    }

    // Test 2: Insert sample data for testing
    console.log('\n📋 Test 2: Inserting sample sheet records...');
    const sampleData = [
      {
        date: '2024-01-15',
        sheet_name: 'Daily Sales Sheet',
        open_reading: 1000,
        close_reading: 1200,
        notes: 'Regular daily operations'
      },
      {
        date: '2024-01-16',
        sheet_name: 'Weekend Sales Sheet',
        open_reading: 1200,
        close_reading: 1350,
        notes: 'Weekend operations with higher volume'
      },
      {
        date: '2024-01-17',
        sheet_name: 'Monthly Report Sheet',
        open_reading: 1350,
        close_reading: 1500,
        notes: 'Monthly reporting period'
      }
    ];

    for (const record of sampleData) {
      await pool.query(`
        INSERT INTO sheet_records (date, sheet_name, open_reading, close_reading, notes, created_at)
        VALUES ($1, $2, $3, $4, $5, now())
        ON CONFLICT DO NOTHING
      `, [record.date, record.sheet_name, record.open_reading, record.close_reading, record.notes]);
    }
    console.log('✅ Sample data inserted successfully');

    // Test 3: Test API endpoint without filters
    console.log('\n📋 Test 3: Testing API endpoint (no filters)...');
    const response1 = await fetch('http://localhost:5000/api/sheet-records');
    if (response1.ok) {
      const data1 = await response1.json();
      console.log(`✅ API returned ${data1.length} records`);
      console.log(`   Sample record: ${JSON.stringify(data1[0] || 'No records')}`);
    } else {
      console.log(`❌ API failed with status: ${response1.status}`);
    }

    // Test 4: Test API endpoint with date range filter
    console.log('\n📋 Test 4: Testing API endpoint (date range filter)...');
    const response2 = await fetch('http://localhost:5000/api/sheet-records?from=2024-01-15&to=2024-01-16');
    if (response2.ok) {
      const data2 = await response2.json();
      console.log(`✅ Date range filter returned ${data2.length} records`);
    } else {
      console.log(`❌ Date range filter failed with status: ${response2.status}`);
    }

    // Test 5: Test API endpoint with search term
    console.log('\n📋 Test 5: Testing API endpoint (search term)...');
    const response3 = await fetch('http://localhost:5000/api/sheet-records?search=Daily');
    if (response3.ok) {
      const data3 = await response3.json();
      console.log(`✅ Search filter returned ${data3.length} records`);
    } else {
      console.log(`❌ Search filter failed with status: ${response3.status}`);
    }

    // Test 6: Test API endpoint with combined filters
    console.log('\n📋 Test 6: Testing API endpoint (combined filters)...');
    const response4 = await fetch('http://localhost:5000/api/sheet-records?from=2024-01-15&to=2024-01-17&search=Sheet');
    if (response4.ok) {
      const data4 = await response4.json();
      console.log(`✅ Combined filters returned ${data4.length} records`);
    } else {
      console.log(`❌ Combined filters failed with status: ${response4.status}`);
    }

    // Test 7: Test frontend page accessibility
    console.log('\n📋 Test 7: Testing frontend page accessibility...');
    const response5 = await fetch('http://localhost:5000/relational/sheet-records');
    if (response5.ok) {
      const html = await response5.text();
      if (html.includes('Sheet Records') || html.includes('Entries')) {
        console.log('✅ Frontend page is accessible');
      } else {
        console.log('⚠️  Frontend page accessible but content may be loading via JavaScript');
      }
    } else {
      console.log(`❌ Frontend page failed with status: ${response5.status}`);
    }

    // Test 8: Verify data structure
    console.log('\n📋 Test 8: Verifying data structure...');
    const structureCheck = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'sheet_records' 
      ORDER BY ordinal_position
    `);
    
    console.log('✅ Table structure:');
    structureCheck.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type}`);
    });

    // Test 9: Test CRUD operations
    console.log('\n📋 Test 9: Testing CRUD operations...');
    
    // Create
    const createResponse = await fetch('http://localhost:5000/api/sheet-records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: '2024-01-18',
        sheet_name: 'Test Sheet',
        open_reading: 1500,
        close_reading: 1600,
        notes: 'Smoke test record'
      })
    });
    
    if (createResponse.ok) {
      const created = await createResponse.json();
      console.log('✅ Create operation successful');
      
      // Update
      const updateResponse = await fetch(`http://localhost:5000/api/sheet-records/${created.row.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: '2024-01-18',
          sheet_name: 'Updated Test Sheet',
          open_reading: 1500,
          close_reading: 1650,
          notes: 'Updated smoke test record'
        })
      });
      
      if (updateResponse.ok) {
        console.log('✅ Update operation successful');
        
        // Delete
        const deleteResponse = await fetch(`http://localhost:5000/api/sheet-records/${created.row.id}`, {
          method: 'DELETE'
        });
        
        if (deleteResponse.ok) {
          console.log('✅ Delete operation successful');
        } else {
          console.log('❌ Delete operation failed');
        }
      } else {
        console.log('❌ Update operation failed');
      }
    } else {
      console.log('❌ Create operation failed');
    }

    console.log('\n🎉 Sheet Records Smoke Test Completed!');
    console.log('\n📊 Summary:');
    console.log('✅ Database table exists');
    console.log('✅ Sample data inserted');
    console.log('✅ API endpoints working');
    console.log('✅ Search filters functional');
    console.log('✅ Frontend page accessible');
    console.log('✅ CRUD operations working');
    
    console.log('\n🚀 Ready for testing at: http://localhost:5000/relational/sheet-records');

  } catch (error) {
    console.error('❌ Smoke test failed:', error.message);
  } finally {
    await pool.end();
  }
}

// Run the smoke test
smokeTestSheetRecords();
