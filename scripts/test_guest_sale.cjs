const { Client } = require('pg');
require('dotenv').config();

async function testGuestSaleInsert() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    await client.connect();
    console.log('Connected to database\n');
    
    // Test data similar to what the form would submit
    const testData = {
      sale_date: '2025-10-12',
      fuel_product_id: '00000000-0000-0000-0000-000000000001', // Dummy UUID
      nozzle_id: null,
      vehicle_number: 'TEST1234',
      mobile_number: '9876543210',
      customer_name: 'Test Customer',
      quantity: 50.5,
      price_per_unit: 105.50,
      discount: 10,
      total_amount: (50.5 * 105.50) - 10,
      payment_mode: 'Cash',
      offer_type: 'Festive',
      gst_tin: 'GST123456'
    };
    
    console.log('Testing guest sale insert with data:');
    console.log(testData);
    console.log('');
    
    // First, get an actual fuel product ID
    const fuelQuery = await client.query('SELECT id, product_name FROM fuel_products WHERE is_active = true LIMIT 1');
    if (fuelQuery.rows.length === 0) {
      console.log('❌ No active fuel products found in database!');
      return;
    }
    
    const fuelProduct = fuelQuery.rows[0];
    console.log(`✅ Found fuel product: ${fuelProduct.product_name} (${fuelProduct.id})`);
    testData.fuel_product_id = fuelProduct.id;
    
    // Try insert
    console.log('\nAttempting to insert guest sale...');
    const insertResult = await client.query(
      `INSERT INTO guest_sales (
        sale_date, fuel_product_id, nozzle_id, vehicle_number,
        mobile_number, customer_name, quantity, price_per_unit,
        discount, total_amount, payment_mode, offer_type, gst_tin
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        testData.sale_date, testData.fuel_product_id, testData.nozzle_id,
        testData.vehicle_number, testData.mobile_number, testData.customer_name,
        testData.quantity, testData.price_per_unit, testData.discount,
        testData.total_amount, testData.payment_mode, testData.offer_type,
        testData.gst_tin
      ]
    );
    
    console.log('\n✅ Guest sale inserted successfully!');
    console.log('Inserted record:');
    console.log(insertResult.rows[0]);
    
    // Clean up
    await client.query('DELETE FROM guest_sales WHERE id = $1', [insertResult.rows[0].id]);
    console.log('\n✅ Test record cleaned up');
    
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    console.error('Error details:', err);
  } finally {
    await client.end();
  }
}

testGuestSaleInsert();
