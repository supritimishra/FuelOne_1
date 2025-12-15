const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function seedAdditionalData() {
  console.log('🌱 Seeding additional dashboard data...');
  
  try {
    // Get existing fuel products
    const { rows: fuelProducts } = await pool.query('SELECT id, product_name FROM fuel_products LIMIT 3');
    console.log('📦 Found fuel products:', fuelProducts);

    if (fuelProducts.length === 0) {
      console.log('❌ No fuel products found. Please run the main seed script first.');
      return;
    }

    // Add guest sales for yesterday and last week
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastWeekStr = lastWeek.toISOString().split('T')[0];

    const additionalGuestSales = [
      {
        sale_date: yesterdayStr,
        customer_name: 'Yesterday Customer 1',
        vehicle_number: 'MH12XY1234',
        mobile_number: '9876543213',
        fuel_product_id: fuelProducts[0].id,
        quantity: 30.0,
        price_per_unit: 95.50,
        total_amount: 2865.00,
        payment_mode: 'Card'
      },
      {
        sale_date: yesterdayStr,
        customer_name: 'Yesterday Customer 2',
        vehicle_number: 'MH12XY5678',
        mobile_number: '9876543214',
        fuel_product_id: fuelProducts[1]?.id || fuelProducts[0].id,
        quantity: 25.0,
        price_per_unit: 98.00,
        total_amount: 2450.00,
        payment_mode: 'UPI'
      },
      {
        sale_date: lastWeekStr,
        customer_name: 'Last Week Customer',
        vehicle_number: 'MH12XY9999',
        mobile_number: '9876543215',
        fuel_product_id: fuelProducts[2]?.id || fuelProducts[0].id,
        quantity: 40.0,
        price_per_unit: 89.00,
        total_amount: 3560.00,
        payment_mode: 'Cash'
      }
    ];

    console.log('💳 Adding additional guest sales...');
    for (const sale of additionalGuestSales) {
      const { rows } = await pool.query(`
        INSERT INTO guest_sales (
          sale_date, customer_name, vehicle_number, mobile_number,
          fuel_product_id, quantity, price_per_unit, total_amount, payment_mode, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        RETURNING id
      `, [
        sale.sale_date, sale.customer_name, sale.vehicle_number, sale.mobile_number,
        sale.fuel_product_id, sale.quantity, sale.price_per_unit, sale.total_amount, sale.payment_mode
      ]);
      console.log(`✅ Added guest sale: ${sale.customer_name} - ₹${sale.total_amount} (${sale.sale_date})`);
    }

    // Add credit sales for different dates
    const { rows: creditCustomers } = await pool.query('SELECT id, organization_name FROM credit_customers LIMIT 3');
    
    if (creditCustomers.length > 0) {
      const additionalCreditSales = [
        {
          sale_date: yesterdayStr,
          credit_customer_id: creditCustomers[0].id,
          vehicle_number: 'MH12AB9999',
          fuel_product_id: fuelProducts[0].id,
          quantity: 60.0,
          price_per_unit: 95.50,
          total_amount: 5730.00
        },
        {
          sale_date: lastWeekStr,
          credit_customer_id: creditCustomers[1]?.id || creditCustomers[0].id,
          vehicle_number: 'MH12CD9999',
          fuel_product_id: fuelProducts[1]?.id || fuelProducts[0].id,
          quantity: 45.0,
          price_per_unit: 98.00,
          total_amount: 4410.00
        }
      ];

      console.log('💳 Adding additional credit sales...');
      for (const sale of additionalCreditSales) {
        const { rows } = await pool.query(`
          INSERT INTO credit_sales (
            sale_date, credit_customer_id, vehicle_number,
            fuel_product_id, quantity, price_per_unit, total_amount, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
          RETURNING id
        `, [
          sale.sale_date, sale.credit_customer_id, sale.vehicle_number,
          sale.fuel_product_id, sale.quantity, sale.price_per_unit, sale.total_amount
        ]);
        console.log(`✅ Added credit sale: Customer ID ${sale.credit_customer_id} - ₹${sale.total_amount} (${sale.sale_date})`);
      }
    }

    console.log('🎉 Additional dashboard data seeding completed!');
    console.log('📊 Summary:');
    console.log('   - Additional Guest Sales: 3 records');
    console.log('   - Additional Credit Sales: 2 records');
    console.log('🌐 Now refresh your dashboard to see the enhanced data!');

  } catch (error) {
    console.error('❌ Error seeding additional dashboard data:', error);
  } finally {
    await pool.end();
  }
}

seedAdditionalData();
