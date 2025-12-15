const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres.rozgwrsgenmsixvrdvxu:%40Tkhg9966@aws-1-ap-south-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function addTestTankerSale() {
  try {
    // Get a valid fuel product ID from existing data
    const fuelProductResult = await pool.query('SELECT id FROM fuel_products LIMIT 1');
    if (fuelProductResult.rows.length === 0) {
      console.log('No fuel products found. Creating a test fuel product first...');
      const createProductResult = await pool.query(`
        INSERT INTO fuel_products (product_name, short_name, price_per_liter, created_at)
        VALUES ('Test Fuel', 'TEST', 50.00, NOW())
        RETURNING id
      `);
      var fuelProductId = createProductResult.rows[0].id;
    } else {
      var fuelProductId = fuelProductResult.rows[0].id;
    }

    // Insert test tanker sale
    const result = await pool.query(`
      INSERT INTO tanker_sales (
        sale_date,
        fuel_product_id,
        before_dip_stock,
        gross_stock,
        tanker_sale_quantity,
        notes,
        created_at
      ) VALUES (
        CURRENT_DATE,
        $1,
        2000.00,
        3500.00,
        1500.00,
        'Smoke test data - Added via script',
        NOW()
      ) RETURNING id, sale_date, tanker_sale_quantity
    `, [fuelProductId]);

    console.log('✅ Test tanker sale added successfully!');
    console.log('ID:', result.rows[0].id);
    console.log('Sale Date:', result.rows[0].sale_date);
    console.log('Quantity:', result.rows[0].tanker_sale_quantity);

    // Verify it appears in the list
    const verifyResult = await pool.query(`
      SELECT COUNT(*) as total_count 
      FROM tanker_sales 
      WHERE notes LIKE '%Smoke test%'
    `);
    
    console.log('Total smoke test records:', verifyResult.rows[0].total_count);

  } catch (error) {
    console.error('❌ Error adding test tanker sale:', error);
  } finally {
    await pool.end();
  }
}

addTestTankerSale();
