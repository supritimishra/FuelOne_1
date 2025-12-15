const { Client } = require('pg');
require('dotenv').config();

const client = new Client({ connectionString: process.env.DATABASE_URL });

// Sample data for realistic expiry items
const itemCategories = [
  'Engine Oil',
  'Brake Fluid',
  'Coolant',
  'Transmission Fluid',
  'Power Steering Fluid',
  'Gear Oil',
  'Hydraulic Oil',
  'Compressor Oil',
  'Grease',
  'Fuel Additives',
  'Cleaning Products',
  'Safety Equipment',
  'Filters',
  'Belts',
  'Gaskets'
];

const itemNames = [
  'Engine Oil 5W-30',
  'Engine Oil 10W-40',
  'Engine Oil 15W-50',
  'Brake Fluid DOT3',
  'Brake Fluid DOT4',
  'Brake Fluid DOT5',
  'Coolant Premium',
  'Coolant Standard',
  'Transmission Fluid ATF',
  'Transmission Fluid Manual',
  'Power Steering Fluid',
  'Gear Oil 80W-90',
  'Gear Oil 75W-90',
  'Hydraulic Oil AW46',
  'Hydraulic Oil AW68',
  'Compressor Oil',
  'Multi-Purpose Grease',
  'Lithium Grease',
  'Fuel System Cleaner',
  'Carburetor Cleaner',
  'Glass Cleaner',
  'Degreaser',
  'Safety Gloves',
  'Safety Goggles',
  'Fire Extinguisher',
  'Oil Filter',
  'Air Filter',
  'Fuel Filter',
  'Timing Belt',
  'Fan Belt',
  'Head Gasket',
  'Valve Cover Gasket'
];

const statusOptions = ['Active', 'Expired', 'Near Expiry', 'Disposed', 'Returned'];

// Generate random date within last 3 months
function getRandomDate() {
  const now = new Date();
  const threeMonthsAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
  const randomTime = threeMonthsAgo.getTime() + Math.random() * (now.getTime() - threeMonthsAgo.getTime());
  return new Date(randomTime);
}

// Generate expiry date (1-12 months from issue date)
function getExpiryDate(issueDate) {
  const issue = new Date(issueDate);
  const monthsToAdd = 1 + Math.floor(Math.random() * 12); // 1-12 months
  const expiry = new Date(issue);
  expiry.setMonth(expiry.getMonth() + monthsToAdd);
  return expiry;
}

// Generate item number
function getItemNumber(category, index) {
  const categoryCode = category.split(' ').map(w => w[0]).join('').toUpperCase();
  const year = new Date().getFullYear();
  const sequence = String(index + 1).padStart(3, '0');
  return `${categoryCode}${year}${sequence}`;
}

async function run() {
  try {
    await client.connect();
    console.log('🔗 Connected to database');

    // Clear existing test data
    console.log('🧹 Clearing existing expiry items...');
    await client.query('DELETE FROM expiry_items WHERE item_name LIKE $1', ['%Test%']);

    // Generate 25 expiry items
    const recordsToInsert = 25;
    console.log(`📦 Generating ${recordsToInsert} expiry items...`);

    for (let i = 0; i < recordsToInsert; i++) {
      const category = itemCategories[Math.floor(Math.random() * itemCategories.length)];
      const itemName = itemNames[Math.floor(Math.random() * itemNames.length)];
      const issueDate = getRandomDate();
      const expiryDate = getExpiryDate(issueDate);
      const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
      const itemNumber = getItemNumber(category, i);

      const insertQuery = `
        INSERT INTO expiry_items (
          item_name, 
          issue_date, 
          expiry_date, 
          status, 
          created_at
        ) VALUES ($1, $2, $3, $4, now())
        RETURNING id, item_name, expiry_date, status
      `;

      const result = await client.query(insertQuery, [
        itemName,
        issueDate.toISOString().slice(0, 10),
        expiryDate.toISOString().slice(0, 10),
        status
      ]);

      console.log(`✅ Inserted expiry item ${i + 1}/${recordsToInsert}: ${result.rows[0].item_name} (Expires: ${result.rows[0].expiry_date}) - ${result.rows[0].status}`);
    }

    // Verify insertion
    const countResult = await client.query('SELECT COUNT(*) as total FROM expiry_items');
    console.log(`\n📊 Total expiry items in database: ${countResult.rows[0].total}`);

    // Show recent records
    const recentResult = await client.query(`
      SELECT 
        item_name,
        issue_date,
        expiry_date,
        status
      FROM expiry_items
      ORDER BY created_at DESC
      LIMIT 5
    `);

    console.log('\n📦 Recent expiry items:');
    recentResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.item_name} | Issue: ${row.issue_date} | Expires: ${row.expiry_date} | ${row.status}`);
    });

    // Show status distribution
    const statusResult = await client.query(`
      SELECT status, COUNT(*) as count
      FROM expiry_items
      GROUP BY status
      ORDER BY count DESC
    `);

    console.log('\n📊 Status Distribution:');
    statusResult.rows.forEach(row => {
      console.log(`  ${row.status}: ${row.count} items`);
    });

    console.log('\n🎉 Expiry items seeding completed successfully!');
    console.log('💡 You can now test the UI at /master/expiry-items');

  } catch (err) {
    console.error('❌ Seeding error:', err.message || err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

run();
