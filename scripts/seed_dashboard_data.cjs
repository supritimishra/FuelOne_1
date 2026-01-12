const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres.rozgwrsgenmsixvrdvxu:%40Tkhg9966@aws-1-ap-south-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function seedDashboardData() {
  console.log('🌱 Seeding dashboard data...');

  try {
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    
    // Get yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Get fuel products
    const { rows: fuelProducts } = await pool.query('SELECT id, product_name FROM fuel_products LIMIT 3');
    console.log('📦 Found fuel products:', fuelProducts);

    if (fuelProducts.length === 0) {
      console.log('❌ No fuel products found. Please add fuel products first.');
      return;
    }

    // Add guest sales for today and yesterday
    const guestSalesData = [
      {
        sale_date: today,
        customer_name: 'John Doe',
        vehicle_number: 'MH12AB1234',
        mobile_number: '9876543210',
        fuel_product_id: fuelProducts[0].id,
        quantity: 25.5,
        price_per_unit: 95.50,
        total_amount: 2435.25,
        payment_mode: 'Cash',
        discount: 0
      },
      {
        sale_date: today,
        customer_name: 'Jane Smith',
        vehicle_number: 'MH12CD5678',
        mobile_number: '9876543211',
        fuel_product_id: fuelProducts[1]?.id || fuelProducts[0].id,
        quantity: 30.0,
        price_per_unit: 98.00,
        total_amount: 2940.00,
        payment_mode: 'Debit',
        discount: 50
      },
      {
        sale_date: yesterdayStr,
        customer_name: 'Bob Wilson',
        vehicle_number: 'MH12EF9012',
        mobile_number: '9876543212',
        fuel_product_id: fuelProducts[0].id,
        quantity: 20.0,
        price_per_unit: 95.00,
        total_amount: 1900.00,
        payment_mode: 'Cash',
        discount: 0
      }
    ];

    console.log('💳 Adding guest sales...');
    for (const sale of guestSalesData) {
      const { rows } = await pool.query(`
        INSERT INTO guest_sales (
          sale_date, customer_name, vehicle_number, mobile_number,
          fuel_product_id, quantity, price_per_unit, total_amount,
          payment_mode, discount, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        RETURNING id
      `, [
        sale.sale_date, sale.customer_name, sale.vehicle_number, sale.mobile_number,
        sale.fuel_product_id, sale.quantity, sale.price_per_unit, sale.total_amount,
        sale.payment_mode, sale.discount
      ]);
      console.log(`✅ Added guest sale: ${sale.customer_name} - ₹${sale.total_amount}`);
    }

    // Add credit sales for today and yesterday
    const creditSalesData = [
      {
        sale_date: today,
        credit_customer_id: null, // We'll set this after creating customers
        vehicle_number: 'MH12GH3456',
        fuel_product_id: fuelProducts[0].id,
        quantity: 50.0,
        price_per_unit: 95.50,
        total_amount: 4775.00
      },
      {
        sale_date: yesterdayStr,
        credit_customer_id: null, // We'll set this after creating customers
        vehicle_number: 'MH12IJ7890',
        fuel_product_id: fuelProducts[1]?.id || fuelProducts[0].id,
        quantity: 40.0,
        price_per_unit: 98.00,
        total_amount: 3920.00
      }
    ];

    // Add some credit customers first
    const creditCustomersData = [
      {
        organization_name: 'ABC Transport Ltd',
        phone_number: '9876543210',
        current_balance: 15000.00,
        is_active: true
      },
      {
        organization_name: 'XYZ Logistics',
        phone_number: '9876543211',
        current_balance: 8500.00,
        is_active: true
      },
      {
        organization_name: 'DEF Courier',
        phone_number: '9876543212',
        current_balance: 12000.00,
        is_active: true
      }
    ];

    console.log('👥 Adding credit customers...');
    const customerIds = [];
    for (const customer of creditCustomersData) {
      const { rows } = await pool.query(`
        INSERT INTO credit_customers (
          organization_name, phone_number, current_balance, is_active, created_at
        ) VALUES ($1, $2, $3, $4, NOW())
        RETURNING id
      `, [
        customer.organization_name, customer.phone_number, customer.current_balance, customer.is_active
      ]);
      customerIds.push(rows[0].id);
      console.log(`✅ Added credit customer: ${customer.organization_name} - ₹${customer.current_balance}`);
    }

    // Update credit sales with customer IDs
    creditSalesData[0].credit_customer_id = customerIds[0];
    creditSalesData[1].credit_customer_id = customerIds[1];

    console.log('💳 Adding credit sales...');
    for (const sale of creditSalesData) {
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
      console.log(`✅ Added credit sale: Customer ID ${sale.credit_customer_id} - ₹${sale.total_amount}`);
    }

    console.log('🎉 Dashboard data seeding completed!');
    console.log('📊 Summary:');
    console.log(`   - Guest Sales: ${guestSalesData.length} records`);
    console.log(`   - Credit Sales: ${creditSalesData.length} records`);
    console.log(`   - Credit Customers: ${creditCustomersData.length} records`);
    console.log('🌐 Now refresh your dashboard to see the real data!');

  } catch (error) {
    console.error('❌ Error seeding dashboard data:', error);
  } finally {
    await pool.end();
  }
}

seedDashboardData();
