const { Client } = require('pg');
require('dotenv').config();

const client = new Client({ connectionString: process.env.DATABASE_URL });

// Sample data for realistic tanker sales
const fuelProducts = [
  'Premium Petrol',
  'Regular Petrol', 
  'Diesel',
  'High Speed Diesel',
  'Kerosene',
  'Lubricating Oil',
  'Hydraulic Oil',
  'Brake Fluid',
  'Coolant',
  'Transmission Fluid'
];

const tankerCompanies = [
  'ABC Tankers Ltd',
  'XYZ Petroleum',
  'Reliance Tankers',
  'Indian Oil Tankers',
  'Bharat Petroleum',
  'Hindustan Petroleum',
  'Shell Tankers',
  'BP Tankers',
  'Chevron Tankers',
  'ExxonMobil Tankers'
];

const notesTemplates = [
  'Regular delivery from supplier',
  'Emergency delivery - urgent requirement',
  'Monthly bulk delivery',
  'Quality check passed - premium grade',
  'Temperature controlled delivery',
  'Special handling required - hazardous material',
  'Delivery completed successfully',
  'Minor delay due to traffic',
  'Full tanker capacity utilized',
  'Partial delivery - remaining scheduled for next week',
  'Driver verification completed',
  'Safety inspection passed',
  'Documentation verified',
  'Payment terms: Net 30 days',
  'Next delivery scheduled for next month'
];

// Generate random date within last 3 months
function getRandomDate() {
  const now = new Date();
  const threeMonthsAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
  const randomTime = threeMonthsAgo.getTime() + Math.random() * (now.getTime() - threeMonthsAgo.getTime());
  return new Date(randomTime);
}

// Generate realistic tanker sale quantities
function getRealisticQuantities() {
  const baseQuantity = 5000 + Math.floor(Math.random() * 15000); // 5000-19999 liters
  const beforeDip = baseQuantity;
  const grossStock = baseQuantity + 2000 + Math.floor(Math.random() * 8000); // 2000-9999 more
  const tankerQuantity = grossStock - beforeDip;
  
  return {
    beforeDipStock: beforeDip,
    grossStock: grossStock,
    tankerSaleQuantity: tankerQuantity
  };
}

async function run() {
  try {
    await client.connect();
    console.log('🔗 Connected to database');

    // Get existing fuel products
    const fuelProductsResult = await client.query('SELECT id, product_name FROM fuel_products ORDER BY created_at');
    const existingFuelProducts = fuelProductsResult.rows;
    console.log(`⛽ Found ${existingFuelProducts.length} existing fuel products`);

    // If no fuel products exist, create some
    if (existingFuelProducts.length === 0) {
      console.log('📝 Creating fuel products...');
      for (const productName of fuelProducts.slice(0, 5)) {
        const result = await client.query(
          `INSERT INTO fuel_products (product_name, short_name, is_active) VALUES ($1, $2, true) RETURNING id`,
          [productName, productName.split(' ').map(w => w[0]).join('')]
        );
        existingFuelProducts.push(result.rows[0]);
        console.log(`✅ Created fuel product: ${productName}`);
      }
    }

    // Clear existing test data
    console.log('🧹 Clearing existing tanker sales...');
    await client.query('DELETE FROM tanker_sales WHERE notes LIKE $1', ['%Tanker delivery%']);

    // Generate 20 tanker sales
    const recordsToInsert = 20;
    console.log(`🚛 Generating ${recordsToInsert} tanker sales...`);

    for (let i = 0; i < recordsToInsert; i++) {
      const randomDate = getRandomDate();
      const dateStr = randomDate.toISOString().slice(0, 10);
      
      const fuelProduct = existingFuelProducts[Math.floor(Math.random() * existingFuelProducts.length)];
      const tankerCompany = tankerCompanies[Math.floor(Math.random() * tankerCompanies.length)];
      const note = notesTemplates[Math.floor(Math.random() * notesTemplates.length)];
      const { beforeDipStock, grossStock, tankerSaleQuantity } = getRealisticQuantities();

      const insertQuery = `
        INSERT INTO tanker_sales (
          sale_date, 
          fuel_product_id, 
          before_dip_stock, 
          gross_stock, 
          tanker_sale_quantity, 
          notes, 
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, now())
        RETURNING id, sale_date, tanker_sale_quantity
      `;

      const result = await client.query(insertQuery, [
        dateStr,
        fuelProduct.id,
        beforeDipStock,
        grossStock,
        tankerSaleQuantity,
        `${note} - ${tankerCompany}`
      ]);

      console.log(`✅ Inserted tanker sale ${i + 1}/${recordsToInsert}: ${fuelProduct.product_name} (${result.rows[0].sale_date}) - ${result.rows[0].tanker_sale_quantity}L`);
    }

    // Verify insertion
    const countResult = await client.query('SELECT COUNT(*) as total FROM tanker_sales');
    console.log(`\n📊 Total tanker sales in database: ${countResult.rows[0].total}`);

    // Show recent records
    const recentResult = await client.query(`
      SELECT 
        ts.sale_date,
        ts.tanker_sale_quantity,
        ts.notes,
        fp.product_name
      FROM tanker_sales ts
      LEFT JOIN fuel_products fp ON fp.id = ts.fuel_product_id
      ORDER BY ts.created_at DESC
      LIMIT 5
    `);

    console.log('\n🚛 Recent tanker sales:');
    recentResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.product_name} | ${row.sale_date} | ${row.tanker_sale_quantity}L | ${row.notes}`);
    });

    console.log('\n🎉 Tanker sales seeding completed successfully!');
    console.log('💡 You can now test the UI at /relational/tanker-sale-enhanced');

  } catch (err) {
    console.error('❌ Seeding error:', err.message || err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

run();
